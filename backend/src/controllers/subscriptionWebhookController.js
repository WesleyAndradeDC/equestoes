/**
 * subscriptionWebhookController.js
 *
 * FONTE DA VERDADE para controle de assinaturas.
 * Processa webhooks do WooCommerce Subscriptions.
 *
 * Eventos tratados (via campo "status" do payload):
 *   active         → assinatura ativa / renovada
 *   pending-cancel → cancelamento agendado (ainda tem acesso)
 *   on-hold        → pausada por falha de pagamento
 *   cancelled      → cancelada
 *   expired        → expirada (data de término atingida)
 *   pending        → aguardando pagamento inicial
 *
 * Configuração no WooCommerce:
 *   WooCommerce > Configurações > Avançado > Webhooks > Adicionar Webhook
 *   Nome    : Assinatura (todos os eventos)
 *   Status  : Ativo
 *   Tópico  : Subscription updated  (cobre created + updated + cancelled + expired)
 *   URL     : POST /api/webhook/subscription
 *   Segredo : valor de WOO_WEBHOOK_SECRET no .env
 */

import crypto from 'crypto';
import prisma from '../config/database.js';
import {
  identifySubscriptionType,
  normalizeWooStatus,
  parseWooDate,
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
// Handler principal: Subscription Webhook
// ─────────────────────────────────────────────────────────────────────────────

export const handleSubscriptionWebhook = async (req, res) => {
  try {
    // ── Verificação de assinatura ──────────────────────────────────────────
    const wooSecret = process.env.WOO_WEBHOOK_SECRET;
    const signature = req.headers['x-wc-webhook-signature'];
    const rawBody   = req.rawBody ?? JSON.stringify(req.body);
    const topic     = req.headers['x-wc-webhook-topic'] ?? 'subscription.unknown';

    if (wooSecret && !verifyWooSignature(rawBody, signature, wooSecret)) {
      console.warn('⚠️ Subscription Webhook: assinatura inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const payload = req.body;

    console.log('📨 Subscription Webhook recebido:', {
      id:     payload.id,
      status: payload.status,
      topic,
      email:  payload.billing?.email,
    });

    // ── Validações básicas ────────────────────────────────────────────────
    if (!payload.id) {
      return res.status(400).json({ error: 'ID da assinatura não fornecido' });
    }
    if (!payload.billing?.email) {
      return res.status(400).json({ error: 'Email do billing não fornecido' });
    }

    // ── Extrair e normalizar dados ────────────────────────────────────────
    const email             = payload.billing.email.toLowerCase().trim();
    const wooSubscriptionId = String(payload.id);
    const mappedStatus      = normalizeWooStatus(payload.status);
    const isActive          = ACTIVE_STATUSES.has(mappedStatus);

    const firstName = payload.billing?.first_name ?? '';
    const lastName  = payload.billing?.last_name  ?? '';
    const full_name = `${firstName} ${lastName}`.trim();

    const subscription_type = identifySubscriptionType(payload.line_items);

    // ── Datas ─────────────────────────────────────────────────────────────
    const started_at = parseWooDate(
      payload.start_date_gmt ?? payload.start_date,
    );
    const expires_at = parseWooDate(
      payload.end_date_gmt ?? payload.end_date,
    );
    const next_payment_at = parseWooDate(
      payload.next_payment_date_gmt ?? payload.next_payment_date,
    );
    const cancelled_at = ['cancelled', 'expired'].includes(mappedStatus)
      ? (parseWooDate(payload.cancelled_date_gmt ?? payload.cancelled_date) ?? new Date())
      : null;

    // ── Encontrar ou criar usuário ────────────────────────────────────────
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (!full_name) {
        return res.status(400).json({
          error: 'Usuário não encontrado e nome não disponível no payload',
        });
      }
      user = await prisma.user.create({
        data: {
          email,
          full_name,
          subscription_type:   subscription_type ?? 'Aluno Eleva',
          subscription_status: mappedStatus,
          role:                'user',
          first_login:         true,
          password_hash:       null,
        },
      });
      console.log('✅ Subscription Webhook: novo usuário criado:', email);
    }

    // ── Encontrar ou criar a Subscription ────────────────────────────────
    const existingSubscription = await prisma.subscription.findUnique({
      where: { woo_subscription_id: wooSubscriptionId },
    });

    let subscription;

    if (existingSubscription) {
      // ── Atualizar subscription existente ────────────────────────────
      const previousStatus = existingSubscription.status;

      subscription = await prisma.subscription.update({
        where: { woo_subscription_id: wooSubscriptionId },
        data: {
          status:         mappedStatus,
          // Só atualiza subscription_type se vier no payload; preserve o atual caso contrário
          ...(subscription_type && { subscription_type }),
          // Preserve started_at original; atualiza expires, next_payment, cancelled
          started_at:     started_at ?? existingSubscription.started_at,
          expires_at,
          next_payment_at,
          // cancelled_at: seta quando cancela; não limpa se já estava cancelada
          cancelled_at:   cancelled_at ?? existingSubscription.cancelled_at,
          woo_order_id:   payload.last_order_id
            ? String(payload.last_order_id)
            : existingSubscription.woo_order_id,
        },
      });

      // Registrar no histórico APENAS quando o status muda
      if (previousStatus !== mappedStatus) {
        await prisma.subscriptionHistory.create({
          data: {
            subscription_id: subscription.id,
            previous_status: previousStatus,
            new_status:      mappedStatus,
            reason:          'webhook',
            woo_event:       topic,
            payload_id:      wooSubscriptionId,
          },
        });
        console.log(
          `📊 Subscription ${wooSubscriptionId}: ${previousStatus} → ${mappedStatus}`,
        );
      }

    } else {
      // ── Criar nova subscription (primeira vez que recebemos este ID) ──
      subscription = await prisma.subscription.create({
        data: {
          user_id:            user.id,
          woo_subscription_id: wooSubscriptionId,
          woo_order_id:        payload.last_order_id
            ? String(payload.last_order_id)
            : null,
          status:           mappedStatus,
          subscription_type: subscription_type
            ?? user.subscription_type
            ?? 'Aluno Eleva',
          started_at,
          expires_at,
          next_payment_at,
          cancelled_at,
          history: {
            create: {
              previous_status: null,
              new_status:      mappedStatus,
              reason:          'created',
              woo_event:       topic,
              payload_id:      wooSubscriptionId,
            },
          },
        },
      });
      console.log(
        '✅ Subscription Webhook: nova subscription criada:',
        wooSubscriptionId,
        `(${mappedStatus})`,
      );
    }

    // ── Sincronizar cache do usuário ──────────────────────────────────────
    // Garante que users.subscription_status reflita a melhor assinatura ativa
    await syncUserSubscriptionCache(prisma, user.id);

    return res.status(200).json({
      message:            'Subscription processada com sucesso',
      email,
      woo_subscription_id: wooSubscriptionId,
      status:             mappedStatus,
      is_active:          isActive,
      expires_at:         expires_at?.toISOString() ?? null,
      next_payment_at:    next_payment_at?.toISOString() ?? null,
    });

  } catch (error) {
    console.error('❌ Subscription Webhook error:', error);
    console.error('❌ Stack:', error.stack);

    // Conflito de unique (ex.: race condition com dois webhooks simultâneos)
    if (error.code === 'P2002') {
      return res.status(200).json({
        message: 'Subscription já processada (idempotente)',
      });
    }

    res.status(500).json({ error: 'Erro ao processar subscription webhook' });
  }
};
