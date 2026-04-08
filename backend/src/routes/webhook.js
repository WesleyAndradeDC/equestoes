/**
 * webhook.js — Rota pública para receber webhooks do WooCommerce
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONFIGURAÇÃO NO WOOCOMMERCE
 * WooCommerce > Configurações > Avançado > Webhooks > Adicionar Webhook
 * ═══════════════════════════════════════════════════════════════════
 *
 *   Nome    : E-Questões — Pedido concluído
 *   Status  : Ativo
 *   Tópico  : Order updated
 *   URL     : https://e-questoes-api.onrender.com/api/webhook/woocommerce
 *   Segredo : valor de WOO_WEBHOOK_SECRET no Render
 *   Versão  : WP REST API Integration v3
 *
 * ═══════════════════════════════════════════════════════════════════
 * O QUE ACONTECE QUANDO UM PEDIDO É CONCLUÍDO
 * ═══════════════════════════════════════════════════════════════════
 *   1. WooCommerce envia o payload para a URL acima
 *   2. O sistema verifica a assinatura HMAC (WOO_WEBHOOK_SECRET)
 *   3. Ignora pedidos com status diferente de "completed"
 *   4. Identifica o plano pelos product_ids do pedido
 *   5. Cria o usuário (ou atualiza se já existir) com acesso liberado
 *   6. Usuário recebe e-mail e define a senha no primeiro acesso
 *
 * ═══════════════════════════════════════════════════════════════════
 * SEGURANÇA
 * ═══════════════════════════════════════════════════════════════════
 *   • Não requer autenticação JWT (chamada externa do WooCommerce)
 *   • Assinatura HMAC-SHA256 verificada no controller
 *   • Rate limiting global isento para /api/webhook (ver index.js)
 *   • rawBody capturado no index.js para validação correta da assinatura
 */

import express from 'express';
import { handleOrderWebhook, testWebhook } from '../controllers/orderWebhookController.js';

const router = express.Router();

// ── Endpoint principal: recebe pedidos concluídos do WooCommerce ──────────────
// POST https://e-questoes-api.onrender.com/api/webhook/woocommerce
router.post('/woocommerce', handleOrderWebhook);

// ── Health check ──────────────────────────────────────────────────────────────
// GET|POST https://e-questoes-api.onrender.com/api/webhook/test
router.get('/test',  testWebhook);
router.post('/test', testWebhook);

export default router;
