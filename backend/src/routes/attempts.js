import express from 'express';
import {
  listAttempts,
  createAttempt,
  getUserAttempts,
} from '../controllers/attemptController.js';
import { authenticate, requireActiveSubscription } from '../middlewares/auth.js';

const router = express.Router();

// Requer assinatura ativa para registrar e consultar tentativas
router.get('/',   authenticate, requireActiveSubscription, listAttempts);
router.post('/',  authenticate, requireActiveSubscription, createAttempt);
router.get('/me', authenticate, requireActiveSubscription, getUserAttempts);

export default router;

