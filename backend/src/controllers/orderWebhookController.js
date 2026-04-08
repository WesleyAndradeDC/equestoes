/**
 * orderWebhookController.js
 *
 * Processa webhooks de PEDIDO (order) do WooCommerce.
 *
 * Fluxo E-Questões (setup simples — sem WC Subscriptions / WC Memberships):
 *   1. Cliente compra no WooCommerce
 *   2. Pedido muda para "completed"
 *   3. WooCommerce dispara webhook → POST /api/webhook/woocommerce
 *   4. Sistema cria (ou atualiza) o usuário com acesso liberado imediatamente
 *
 * Configuração no WooCommerce:
 *   WooCommerce > Configurações > Avançado > Webhooks > Adicionar Webhook
 *   Tópico  : Order updated
 *   URL     : POST https://e-questoes-api.onrender.com/api/webhook/woocommerce
 *   Segredo : valor de WOO_WEBHOOK_SECRET no Render
 */

import crypto from 'crypto';
import prisma from '../config/database.js';
import { identifySubscriptionType } from '../utils/subscriptionUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// verifyWooSignature
// Verifica a assinatura HMAC-SHA256 enviada pelo WooCommerce no header
// x-wc-webhook-signature. Se WOO_WEBHOOK_SECRET não estiver definido no Render,
// a verificação é ignorada (útil em testes/dev).
// ─────────────────────────────────────────────────────────────────────────────
function verifyWooSignature(rawBody, signature, secret) {
  if (!secret || !signature) return true;
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
// handleOrderWebhook — handler principal
// ─────────────────────────────────────────────────────────────────────────────
export const handleOrderWebhook = async (req, res) => {
  console.log('📦 [ORDER-WEBHOOK] Recebido —', new Date().toISOString());

  try {
    // ── 1. Verificação de assinatura HMAC ──────────────────────────────────
    const wooSecret = process.env.WOO_WEBHOOK_SECRET;
    const signature = req.headers['x-wc-webhook-signature'];
    const rawBody   = req.rawBody ?? JSON.stringify(req.body);
    const topic     = req.headers['x-wc-webhook-topic'] ?? 'order.unknown';

    console.log('📦 topic:', topic, '| assinatura presente:', !!signature);

    if (wooSecret && !verifyWooSignature(rawBody, signature, wooSecret)) {
      console.warn('⚠️ Assinatura divergente — processando mesmo assim (modo permissivo)');
      // Não rejeita: continua o processamento para não perder cadastros.
      // Para re-ativar bloqueio: trocar este bloco por return res.status(401)...
    }

    const payload = req.body;

    // ── 2. Processar apenas pedidos com status "completed" ─────────────────
    if (payload.status !== 'completed') {
      console.log(`ℹ️ Pedido ignorado — status: "${payload.status}" (esperado: "completed")`);
      return res.status(200).json({
        message: 'Webhook recebido mas ignorado',
        reason:  `Status "${payload.status}" não é "completed"`,
      });
    }

    // ── 3. Extrair email e nome do billing ────────────────────────────────
    const email     = payload.billing?.email?.toLowerCase().trim();
    const firstName = payload.billing?.first_name ?? '';
    const lastName  = payload.billing?.last_name  ?? '';
    const full_name = `${firstName} ${lastName}`.trim();

    if (!email) {
      console.error('❌ Email não encontrado no payload billing');
      return res.status(400).json({ error: 'Email não encontrado no billing do pedido' });
    }
    if (!full_name) {
      console.error('❌ Nome não encontrado no payload billing');
      return res.status(400).json({ error: 'Nome não encontrado no billing do pedido' });
    }

    // ── 4. Identificar o tipo de assinatura pelos product_ids ─────────────
    const subscription_type = identifySubscriptionType(payload.line_items);

    if (!subscription_type) {
      const ids = payload.line_items?.map((i) => i.product_id) ?? [];
      console.log('⚠️ Nenhum product_id reconhecido:', ids);
      return res.status(200).json({
        message:     'Webhook recebido — nenhum product_id reconhecido para o E-Questões',
        product_ids: ids,
      });
    }

    const wooOrderId = String(payload.id);
    console.log('📝 Dados extraídos:', { email, full_name, subscription_type, wooOrderId });

    // ── 5. Criar ou atualizar o usuário ───────────────────────────────────
    // subscription_active e membership_active são definidos como true aqui mesmo
    // pois este setup não usa WC Subscriptions nem WC Memberships — não há
    // webhook posterior para fazer esse update.
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          full_name,
          subscription_type,
          subscription_status: 'active',
          subscription_active: true,   // acesso imediato — sem webhook de subscription
          membership_active:   true,   // acesso imediato — sem webhook de membership
          role:         'user',
          first_login:  true,
          password_hash: null,         // usuário define a senha no primeiro acesso
        },
      });
      console.log('✅ Novo usuário criado:', email);
    } else {
      // Usuário já existe: atualizar nome/tipo se necessário e garantir acesso ativo
      const upd = {
        subscription_active: true,
        membership_active:   true,
        subscription_status: 'active',
      };
      if (full_name && full_name !== user.full_name) upd.full_name = full_name;
      if (subscription_type && subscription_type !== user.subscription_type) {
        upd.subscription_type = subscription_type;
      }
      user = await prisma.user.update({ where: { email }, data: upd });
      console.log('✅ Usuário existente atualizado — acesso reativado:', email);
    }

    // ── 6. Registrar o pedido na tabela subscriptions (histórico) ─────────
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
      console.log('✅ Pedido registrado na tabela subscriptions:', wooOrderId);
    }

    return res.status(200).json({
      message:           'Pedido processado com sucesso',
      email,
      subscription_type,
      action: user ? 'created' : 'updated',
    });

  } catch (error) {
    console.error('❌ Order Webhook error:', error);
    if (error.code === 'P2002') {
      // Conflito de unique (ex.: dois webhooks simultâneos do mesmo pedido)
      return res.status(200).json({ message: 'Pedido já processado (idempotente)' });
    }
    res.status(500).json({ error: 'Erro ao processar order webhook' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// testWebhook — health check
// GET|POST /api/webhook/test
// ─────────────────────────────────────────────────────────────────────────────
export const testWebhook = async (req, res) => {
  res.json({
    message:   'Webhook está funcionando! ✅',
    timestamp: new Date().toISOString(),
    headers: {
      topic:  req.headers['x-wc-webhook-topic'] ?? null,
      source: req.headers['x-wc-webhook-source'] ?? null,
    },
    body_preview: {
      id:          req.body?.id ?? null,
      status:      req.body?.status ?? null,
      has_billing: !!req.body?.billing,
      line_items:  req.body?.line_items?.map((i) => i.product_id) ?? [],
    },
  });
};
