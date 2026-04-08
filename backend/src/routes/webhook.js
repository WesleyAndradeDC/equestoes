/**
 * webhook.js — Rotas públicas para webhooks do WooCommerce
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ENDPOINTS  (configurar no WooCommerce → Configurações → Avançado → Webhooks)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  1. ORDER WEBHOOK  (WooCommerce Orders)                             │
 * │     Tópico : Order updated                                          │
 * │     URL    : POST https://e-questoes-api.onrender.com/api/webhook/woocommerce │
 * │     Segredo: valor de WOO_WEBHOOK_SECRET no Render                  │
 * │     Função : Cria ou atualiza o usuário quando um pedido é concluído│
 * │              (fallback quando o Subscriptions não está configurado) │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  2. SUBSCRIPTION WEBHOOK  (WooCommerce Subscriptions)               │
 * │     Tópico : Subscription updated                                   │
 * │     URL    : POST https://e-questoes-api.onrender.com/api/webhook/subscription │
 * │     Segredo: valor de WOO_WEBHOOK_SECRET no Render                  │
 * │     Função : Fonte da verdade do pagamento. Atualiza               │
 * │              subscription_status e subscription_active do usuário   │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  3. MEMBERSHIP WEBHOOK  (WooCommerce Memberships)                   │
 * │     Tópico : User Membership created                                │
 * │             User Membership updated                                 │
 * │             User Membership deleted                                 │
 * │     URL    : POST https://e-questoes-api.onrender.com/api/webhook/membership  │
 * │     Segredo: valor de WOO_MEMBERSHIP_WEBHOOK_SECRET no Render       │
 * │     Função : Controla o acesso ao plano. Atualiza                  │
 * │              membership_status, membership_active e membership_expires_at │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  4. TESTE / HEALTH CHECK                                            │
 * │     URL    : GET|POST https://e-questoes-api.onrender.com/api/webhook/test     │
 * │     Função : Verifica se o servidor está respondendo                │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════
 * VARIÁVEIS DE AMBIENTE  (configurar no Render → Environment)
 * ═══════════════════════════════════════════════════════════════════════
 *   WOO_WEBHOOK_SECRET            → segredo do Order e Subscription webhook
 *   WOO_MEMBERSHIP_WEBHOOK_SECRET → segredo do Membership webhook
 *   WOO_SITE_URL                  → https://equestoes.com.br
 *   WOO_CONSUMER_KEY              → ck_xxxxxxxxxxxxxxxx  (WC REST API)
 *   WOO_CONSUMER_SECRET           → cs_xxxxxxxxxxxxxxxx  (WC REST API)
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SEGURANÇA
 * ═══════════════════════════════════════════════════════════════════════
 *   • Rotas NÃO requerem autenticação JWT (chamadas externas do WooCommerce)
 *   • Verificação HMAC-SHA256 feita nos controllers (header x-wc-webhook-signature)
 *   • Rate limiting global isencionado para /api/webhook (ver index.js)
 *   • Rawbody capturado no index.js para garantir assinatura correta
 */

import express from 'express';
import { handleOrderWebhook, testWebhook }  from '../controllers/orderWebhookController.js';
import { handleSubscriptionWebhook }        from '../controllers/subscriptionWebhookController.js';
import { membershipWebhook }                from '../controllers/webhookController.js';

const router = express.Router();

// ── 1. Order webhook (WooCommerce Orders) ────────────────────────────────────
// URL: POST /api/webhook/woocommerce
router.post('/woocommerce', handleOrderWebhook);

// ── 2. Subscription webhook (WooCommerce Subscriptions) ──────────────────────
// URL: POST /api/webhook/subscription
router.post('/subscription', handleSubscriptionWebhook);

// ── 3. Membership webhook (WooCommerce Memberships) ──────────────────────────
// URL: POST /api/webhook/membership
router.post('/membership', membershipWebhook);

// ── 4. Health check ───────────────────────────────────────────────────────────
// URL: GET|POST /api/webhook/test
router.get('/test',  testWebhook);
router.post('/test', testWebhook);

export default router;
