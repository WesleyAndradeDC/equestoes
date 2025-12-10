import express from 'express';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../controllers/questionController.js';
import { authenticate, requireProfessor } from '../middlewares/auth.js';

const router = express.Router();

// Public/authenticated routes
router.get('/', authenticate, listQuestions);
router.get('/:id', authenticate, getQuestion);

// Professor/admin only routes
router.post('/', authenticate, requireProfessor, createQuestion);
router.put('/:id', authenticate, requireProfessor, updateQuestion);
router.delete('/:id', authenticate, requireProfessor, deleteQuestion);

export default router;

