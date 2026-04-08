/**
 * webhookController.js
 *
 * Contém o handler do WooCommerce Memberships (controle de acesso ao plano).
 *
 * Os outros handlers ficam em controllers dedicados:
 *   • Order webhook      → orderWebhookController.js
 *   • Subscription hook  → subscriptionWebhookController.js
 *
 * Configuração no WooCommerce:
 *   Plugin : WooCommerce Memberships
 *   Tópico : User Membership created
 *            User Membership updated
 *            User Membership deleted
 *   URL    : POST https://e-questoes-api.onrender.com/api/webhook/membership
 *   Segredo: WOO_MEMBERSHIP_WEBHOOK_SECRET (variável de ambiente no Render)
 */

import prisma from '../config/database.js';
import { syncUserSubscriptionCache } from '../utils/subscriptionUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// _planNameToSubscriptionType
// Converte o nome do plano WC Memberships para o subscription_type interno.
// Hoje existe apenas um tipo de aluno: "Aluno Eleva".
// ─────────────────────────────────────────────────────────────────────────────
function _planNameToSubscriptionType(planName) {
  if (!planName) return 'Aluno Eleva';
  return 'Aluno Eleva'; // único tipo de assinatura de aluno no sistema
}

// ─────────────────────────────────────────────────────────────────────────────
// membershipWebhook
//
// Processa webhooks do WooCommerce Memberships.
//
// O que faz:
//   1. Extrai customer_id, order_id, plan_name, status e datas do payload
//   2. Localiza o usuário pelo order_id (via tabela subscriptions)
//   3. Fallback: consulta a WC REST API pelo customer_id para obter email/nome
//      e cria o usuário se ainda não existir
//   4. Atualiza os campos membership_* no modelo User
//   5. Sincroniza o cache subscription_status / subscription_active
//
// Payload real confirmado nos logs (WC Memberships):
//   id, customer_id, plan_id, plan_name, status, order_id, product_id,
//   start_date, start_date_gmt, end_date, end_date_gmt,
//   cancelled_date, cancelled_date_gmt
//   ⚠️  NÃO há campo de email no payload — usamos order_id como chave.
//
// Variáveis de ambiente necessárias (Render):
//   WOO_SITE_URL            = https://equestoes.com.br
//   WOO_CONSUMER_KEY        = ck_xxxxxxxxxxxxxxxx
//   WOO_CONSUMER_SECRET     = cs_xxxxxxxxxxxxxxxx
//   WOO_MEMBERSHIP_WEBHOOK_SECRET = (opcional, mas recomendado)
// ─────────────────────────────────────────────────────────────────────────────
export const membershipWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const topic   = req.headers['x-wc-webhook-topic'] ?? '';

    console.log('🎫 Membership Webhook recebido:', {
      id:          payload?.id,
      customer_id: payload?.customer_id,
      order_id:    payload?.order_id,
      plan_name:   payload?.plan_name,
      status:      payload?.status,
      end_date:    payload?.end_date,
      topic,
    });

    const isDeleted =
      topic.toLowerCase().includes('deleted') ||
      payload?.status === 'deleted';

    // ── 1. Localizar usuário pelo order_id ───────────────────────────────────
    // O WC Memberships NÃO envia email no payload.
    // Estratégia: cruzar o order_id com woo_order_id na tabela subscriptions,
    // registrado quando o pedido (order webhook) foi processado.
    let user = null;
    const orderId = payload?.order_id ? String(payload.order_id) : null;

    if (orderId) {
      const sub = await prisma.subscription.findFirst({
        where:   { woo_order_id: orderId },
        include: { user: true },
      });
      if (sub?.user) {
        user = sub.user;
        console.log(`✅ Usuário encontrado via order_id ${orderId}: ${user.email}`);
      }
    }

    // ── 2. Fallback: consulta WC REST API pelo customer_id ───────────────────
    // Ativado quando o usuário não é encontrado pelo order_id.
    // Cenário comum: membership chegou antes do order.completed.
    // Se o usuário não existir no banco → CRIA automaticamente.
    if (!user && payload?.customer_id) {
      if (process.env.WOO_CONSUMER_KEY && process.env.WOO_CONSUMER_SECRET) {
        try {
          const site   = (process.env.WOO_SITE_URL ?? 'https://equestoes.com.br').replace(/\/$/, '');
          const apiUrl = `${site}/wp-json/wc/v3/customers/${payload.customer_id}`;
          const auth   = Buffer.from(
            `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_CONSUMER_SECRET}`
          ).toString('base64');

          console.log(`🔍 Consultando WC API para customer_id=${payload.customer_id}...`);

          const response = await fetch(apiUrl, {
            headers: { Authorization: `Basic ${auth}` },
            signal:  AbortSignal.timeout(8000),
          });

          if (response.ok) {
            const customer      = await response.json();
            const custEmail     = customer.email?.toLowerCase().trim();
            const custFirstName = customer.first_name ?? '';
            const custLastName  = customer.last_name  ?? '';
            const custFullName  = `${custFirstName} ${custLastName}`.trim();

            if (custEmail) {
              user = await prisma.user.findUnique({ where: { email: custEmail } });

              if (user) {
                console.log(`✅ Usuário encontrado via WC API: ${custEmail}`);
              } else if (custFullName) {
                // Membership chegou antes do order.completed → criar usuário antecipadamente
                user = await prisma.user.create({
                  data: {
                    email:               custEmail,
                    full_name:           custFullName,
                    subscription_type:   _planNameToSubscriptionType(payload.plan_name),
                    subscription_status: 'pending',
                    role:                'user',
                    first_login:         true,
                    password_hash:       null,
                  },
                });
                console.log(`✅ Usuário criado via WC API (antes do order.completed): ${custEmail}`);
              } else {
                console.warn(`⚠️ WC API: email ${custEmail} encontrado mas sem nome — criação ignorada`);
              }
            }
          } else {
            console.warn(`⚠️ WC API respondeu ${response.status} para customer_id=${payload.customer_id}`);
          }
        } catch (apiError) {
          console.warn('⚠️ Falha ao consultar WooCommerce API:', apiError.message);
        }
      } else {
        console.warn(
          '⚠️ WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET ausentes no .env — fallback WC API desabilitado.',
        );
      }
    }

    if (!user) {
      console.warn(
        `⚠️ Membership Webhook: usuário não localizado — ` +
        `order_id=${orderId}, customer_id=${payload?.customer_id}`,
      );
      return res.status(200).json({ message: 'Usuário não encontrado — webhook ignorado' });
    }

    // ── 3. Evento de exclusão / remoção da membership ────────────────────────
    if (isDeleted) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { membership_active: false, membership_status: 'deleted' },
      });
      console.log(`✅ Membership removida para ${user.email}`);
      return res.status(200).json({ message: 'Membership removida', email: user.email });
    }

    // ── 4. Extrair dados do payload ──────────────────────────────────────────
    const status   = payload?.status ?? 'inactive';
    const isActive = status === 'active';
    const planName = payload?.plan_name ?? null;

    // Preferir datas em GMT para garantir UTC correto
    const rawEndDate   = payload?.end_date_gmt   ?? payload?.end_date   ?? null;
    const rawStartDate = payload?.start_date_gmt ?? payload?.start_date ?? null;

    const endDate   = rawEndDate   ? new Date(rawEndDate)   : null;
    const startDate = rawStartDate ? new Date(rawStartDate) : null;

    const validEndDate   = endDate   && !isNaN(endDate.getTime())   ? endDate   : null;
    const validStartDate = startDate && !isNaN(startDate.getTime()) ? startDate : null;

    // ── 5. Atualizar campos membership no usuário ────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data:  {
        membership_status:     status,
        membership_active:     isActive,
        membership_expires_at: validEndDate,
        ...(planName && { membership_plan: planName }),
      },
    });

    // ── 6. Atualizar subscription com as datas de expiração ─────────────────
    if (orderId) {
      const existingSub = await prisma.subscription.findFirst({
        where: { woo_order_id: orderId },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data:  {
            status,
            expires_at:  validEndDate,
            started_at:  validStartDate ?? existingSub.started_at,
            updated_at:  new Date(),
          },
        });
        console.log(`✅ Subscription ${existingSub.id} atualizada — expires_at=${validEndDate?.toISOString() ?? 'null'}`);
      } else {
        // Subscription ainda não existe → criar
        await prisma.subscription.create({
          data: {
            user_id:           user.id,
            woo_order_id:      orderId,
            status,
            subscription_type: planName ?? user.subscription_type ?? 'Aluno Eleva',
            started_at:        validStartDate ?? new Date(),
            expires_at:        validEndDate,
          },
        });
        console.log(`✅ Subscription criada via membership webhook (order_id: ${orderId})`);
      }
    }

    // ── 7. Sincronizar cache subscription_active ─────────────────────────────
    await syncUserSubscriptionCache(prisma, user.id);

    console.log(
      `✅ Membership: ${user.email} → status=${status} ativo=${isActive} ` +
      `plano="${planName}" expira=${validEndDate?.toISOString() ?? 'sem prazo'}`,
    );

    return res.status(200).json({
      message:               'Membership processada com sucesso',
      email:                 user.email,
      status,
      membership_active:     isActive,
      membership_plan:       planName,
      membership_expires_at: validEndDate?.toISOString() ?? null,
    });

  } catch (error) {
    console.error('❌ Membership Webhook error:', error);
    res.status(500).json({ error: 'Erro ao processar membership webhook' });
  }
};
