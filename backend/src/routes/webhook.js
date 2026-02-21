/**
 * webhook.js — Rotas públicas para webhooks do WooCommerce
 *
 * Não requerem autenticação JWT (chamadas externas do WooCommerce).
 * A segurança é feita pela verificação de assinatura HMAC (WOO_WEBHOOK_SECRET).
 *
 * Rotas disponíveis:
 *   POST /api/webhook/woocommerce   → Order webhook (fallback / compras avulsas)
 *   POST /api/webhook/subscription  → Subscription webhook (FONTE DA VERDADE)
 *   GET|POST /api/webhook/test      → Health check / diagnóstico
 */

import express from 'express';
import { handleOrderWebhook, testWebhook } from '../controllers/orderWebhookController.js';
import { handleSubscriptionWebhook }       from '../controllers/subscriptionWebhookController.js';

const router = express.Router();

// ── Order webhook (backward compat + compras avulsas) ──────────────────────
router.post('/woocommerce', handleOrderWebhook);

// ── Subscription webhook (FONTE DA VERDADE — WooCommerce Subscriptions) ────
router.post('/subscription', handleSubscriptionWebhook);

// ── Health check ────────────────────────────────────────────────────────────
router.get('/test',  testWebhook);
router.post('/test', testWebhook);

export default router;

