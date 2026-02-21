import express from 'express';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import {
  authenticate,
  requireProfessor,
  requireActiveSubscription,
} from '../middlewares/auth.js';

const router = express.Router();

// Conteúdo protegido: requer autenticação + assinatura ativa
router.get('/',    authenticate, requireActiveSubscription, listQuestions);
router.get('/:id', authenticate, requireActiveSubscription, getQuestion);

// Criação/edição: professor ou admin (subscription implicitamente garantida pelo requireProfessor)
router.post('/',    authenticate, requireProfessor, createQuestion);
router.put('/:id',  authenticate, requireProfessor, updateQuestion);
router.delete('/:id', authenticate, requireProfessor, deleteQuestion);

export default router;

