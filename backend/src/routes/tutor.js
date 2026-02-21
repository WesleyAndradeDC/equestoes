import express from 'express';
import { invokeLLM } from '../controllers/tutorController.js';
import { authenticate, requireActiveSubscription } from '../middlewares/auth.js';

const router = express.Router();

router.post('/invoke', authenticate, requireActiveSubscription, invokeLLM);

export default router;

