import express from 'express';
import { getRanking } from '../controllers/rankingController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Qualquer usuário autenticado pode ver o ranking (não exige assinatura ativa)
// O controller filtra automaticamente pela categoria do usuário logado
router.get('/', authenticate, getRanking);

export default router;
