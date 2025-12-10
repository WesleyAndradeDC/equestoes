import express from 'express';
import { invokeLLM } from '../controllers/tutorController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/invoke', authenticate, invokeLLM);

export default router;

