/**
 * orderWebhookController.js
 *
 * Processa webhooks de PEDIDO (order) do WooCommerce.
 * Serve como FALLBACK quando o WooCommerce Subscriptions não está configurado,
 * ou para registrar compras avulsas.
 *
 * A FONTE DA VERDADE de assinatura é o subscriptionWebhookController.
 * Se ambos estiverem ativos, o subscription webhook prevalece.
 *
 * Configuração no WooCommerce:
 *   Tópico : Order updated / Order created
 *   URL    : POST /api/webhook/woocommerce
 */

import crypto from 'crypto';
import prisma from '../config/database.js';
import {
  identifySubscriptionType,
  ACTIVE_STATUSES,
  syncUserSubscriptionCache,
} from '../utils/subscriptionUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica a assinatura HMAC-SHA256 enviada pelo WooCommerce.
 * Se WOO_WEBHOOK_SECRET não estiver definido, a verificação é ignorada.
 */
function verifyWooSignature(rawBody, signature, secret) {
  if (!secret || !signature) return true; // verificação desabilitada
  try {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'base64'),
      Buffer.from(signature, 'base64'),
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler principal: Order Webhook
// ─────────────────────────────────────────────────────────────────────────────

export const handleOrderWebhook = async (req, res) => {
  // 🔍 LOG IMEDIATO — capturado antes de qualquer validação
  console.log('📦 [ORDER-HANDLER] Handler chamado!');
  console.log('📦 [ORDER-HANDLER] rawBody existe?', !!req.rawBody);
  console.log('📦 [ORDER-HANDLER] body existe?', !!req.body);
  console.log('📦 [ORDER-HANDLER] body keys:', Object.keys(req.body ?? {}));

  try {
    // ── Verificação de assinatura ──────────────────────────────────────────
    const wooSecret  = process.env.WOO_WEBHOOK_SECRET;
    const signature  = req.headers['x-wc-webhook-signature'];
    const rawBody    = req.rawBody ?? JSON.stringify(req.body);
    const topic      = req.headers['x-wc-webhook-topic'] ?? 'order.unknown';

    console.log('📦 [ORDER-HANDLER] topic:', topic);
    console.log('📦 [ORDER-HANDLER] WOO_WEBHOOK_SECRET definido?', !!wooSecret);
    console.log('📦 [ORDER-HANDLER] signature header presente?', !!signature);

    if (wooSecret && !verifyWooSignature(rawBody, signature, wooSecret)) {
      console.warn('⚠️ Order Webhook: assinatura inválida — verifique WOO_WEBHOOK_SECRET no Render');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const payload = req.body;

    console.log('📦 Order Webhook recebido:', {
      id:     payload.id,
      status: payload.status,
      topic,
    });

    // ── Ignorar pedidos não concluídos ────────────────────────────────────
    if (payload.status !== 'completed') {
      return res.status(200).json({
        message: 'Webhook recebido mas ignorado',
        reason:  `Status "${payload.status}" não é "completed"`,
      });
    }

    // ── Detectar formato do payload ───────────────────────────────────────
    if (!payload.billing?.email) {
      // Formato legado: { email, full_name, subscription_type }
      const { email, full_name, subscription_type } = payload;
      if (!email || !full_name) {
        return res.status(400).json({
          error: 'Payload inválido: esperado formato WooCommerce nativo ou legado { email, full_name }',
        });
      }
      return await _processLegacyPayload({ email, full_name, subscription_type }, res);
    }

    // ── Formato nativo WooCommerce ────────────────────────────────────────
    const email           = payload.billing.email.toLowerCase().trim();
    const firstName       = payload.billing?.first_name ?? '';
    const lastName        = payload.billing?.last_name  ?? '';
    const full_name       = `${firstName} ${lastName}`.trim();
    const subscription_type = identifySubscriptionType(payload.line_items);
    const wooOrderId      = String(payload.id);

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no billing' });
    }

    if (!subscription_type) {
      return res.status(200).json({
        message:     'Webhook recebido mas nenhum product_id reconhecido',
        product_ids: payload.line_items?.map((i) => i.product_id) ?? [],
      });
    }

    // ── Encontrar ou criar usuário ────────────────────────────────────────
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (!full_name) {
        return res.status(400).json({ error: 'Nome não disponível no payload' });
      }
      user = await prisma.user.create({
        data: {
          email,
          full_name,
          subscription_type,
          subscription_status: 'active',
          role:        'user',
          first_login: true,
          password_hash: null,
        },
      });
      console.log('✅ Order Webhook: novo usuário criado:', email);
    } else {
      // Atualizar dados se necessário
      const upd = {};
      if (full_name && full_name !== user.full_name) upd.full_name = full_name;
      if (subscription_type !== user.subscription_type)  upd.subscription_type = subscription_type;
      if (Object.keys(upd).length > 0) {
        user = await prisma.user.update({ where: { email }, data: upd });
      }
    }

    // ── Criar subscription de pedido apenas se não houver uma ativa ───────
    // (Se o subscription webhook já estiver configurado, ele já gerencia isso)
    const hasActiveSubscription = await prisma.subscription.findFirst({
      where: {
        user_id: user.id,
        status: { in: [...ACTIVE_STATUSES] },
      },
    });

    if (!hasActiveSubscription) {
      const alreadyRegistered = await prisma.subscription.findFirst({
        where: { user_id: user.id, woo_order_id: wooOrderId },
      });

      if (!alreadyRegistered) {
        await prisma.subscription.create({
          data: {
            user_id:          user.id,
            woo_order_id:     wooOrderId,
            status:           'active',
            subscription_type,
            started_at:       new Date(),
            history: {
              create: {
                previous_status: null,
                new_status:      'active',
                reason:          'order.completed',
                woo_event:       topic,
                payload_id:      wooOrderId,
              },
            },
          },
        });
        console.log('✅ Order Webhook: subscription criada via pedido:', wooOrderId);
      }

      // Sincronizar cache
      await syncUserSubscriptionCache(prisma, user.id);
    }

    return res.status(200).json({
      message:           'Pedido processado com sucesso',
      email,
      subscription_type,
    });

  } catch (error) {
    console.error('❌ Order Webhook error:', error);
    if (error.code === 'P2002') {
      return res.status(200).json({ message: 'Pedido já processado (idempotente)' });
    }
    res.status(500).json({ error: 'Erro ao processar order webhook' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Formato legado (compatibilidade retroativa)
// ─────────────────────────────────────────────────────────────────────────────

async function _processLegacyPayload({ email, full_name, subscription_type }, res) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const upd = {};
    if (full_name && full_name !== existingUser.full_name) upd.full_name = full_name;
    if (subscription_type && subscription_type !== existingUser.subscription_type) {
      upd.subscription_type = subscription_type;
    }
    if (Object.keys(upd).length > 0) {
      await prisma.user.update({ where: { email }, data: upd });
    }
    return res.status(200).json({ message: 'Usuário atualizado', updated: true });
  }

  await prisma.user.create({
    data: {
      email,
      full_name,
      subscription_type:   subscription_type ?? 'Aluno Eleva',
      subscription_status: 'active',
      role:        'user',
      first_login: true,
      password_hash: null,
    },
  });

  return res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook de teste
// ─────────────────────────────────────────────────────────────────────────────

export const testWebhook = async (req, res) => {
  res.json({
    message:   'Webhook está funcionando! ✅',
    timestamp: new Date().toISOString(),
    headers: {
      topic:  req.headers['x-wc-webhook-topic'],
      source: req.headers['x-wc-webhook-source'],
    },
    body_preview: {
      id:          req.body?.id,
      status:      req.body?.status,
      has_billing: !!req.body?.billing,
    },
  });
};
