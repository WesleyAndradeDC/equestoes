import express from 'express';
import {
  listAttempts,
  createAttempt,
  getUserAttempts
} from '../controllers/attemptController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, listAttempts);
router.post('/', authenticate, createAttempt);
router.get('/me', authenticate, getUserAttempts);

export default router;

