/**
 * webhook.js — Rotas públicas para webhooks do WooCommerce
 *
 * Não requerem autenticação JWT (chamadas externas do WooCommerce).
 * A segurança é feita pela verificação de assinatura HMAC nos controllers.
 *
 * Rotas disponíveis:
 *   POST /api/webhook/woocommerce   → Order webhook (fallback / compras avulsas)
 *   POST /api/webhook/subscription  → Subscription webhook (WooCommerce Subscriptions)
 *   POST /api/webhook/membership    → Membership webhook (WooCommerce Memberships)
 *   GET|POST /api/webhook/test      → Health check / diagnóstico
 *
 * Arquitetura de acesso dual:
 *   subscription_active (WC Subscriptions) → controla se o pagamento está em dia
 *   membership_active   (WC Memberships)   → controla se o acesso ao plano está ativo
 *   Ambas devem ser true para liberar conteúdo (middleware: requireActiveAccess)
 */

import express from 'express';
import { handleOrderWebhook, testWebhook }  from '../controllers/orderWebhookController.js';
import { handleSubscriptionWebhook }        from '../controllers/subscriptionWebhookController.js';
import { membershipWebhook }                from '../controllers/webhookController.js';

const router = express.Router();

// ── Order webhook (backward compat + compras avulsas) ──────────────────────
router.post('/woocommerce', handleOrderWebhook);

// ── Subscription webhook (WooCommerce Subscriptions — controle de pagamento) ─
// handleSubscriptionWebhook gerencia a tabela subscriptions + histórico
// e chama syncUserSubscriptionCache que sincroniza subscription_active.
router.post('/subscription', handleSubscriptionWebhook);

// ── Membership webhook (WooCommerce Memberships — controle de acesso) ───────
// Configura no WooCommerce:
//   Tópico: User Membership created | User Membership updated | User Membership deleted
//   URL   : POST /api/webhook/membership
//   Segredo: WOO_MEMBERSHIP_WEBHOOK_SECRET (variável de ambiente)
router.post('/membership', membershipWebhook);

// ── Health check ─────────────────────────────────────────────────────────────
router.get('/test',  testWebhook);
router.post('/test', testWebhook);

export default router;

