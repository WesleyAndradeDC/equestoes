import express from 'express';
import * as webhookController from '../controllers/webhookController.js';

const router = express.Router();

// Webhook routes (públicas - não requerem autenticação)
router.post('/woocommerce', webhookController.woocommerceNewStudent);
router.post('/test', webhookController.testWebhook);
router.get('/test', webhookController.testWebhook);

export default router;

