import { Router } from 'express';
import { authenticate, requireActiveSubscription } from '../middlewares/auth.js';
import {
  listFlashcards,
  getDueFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  reviewFlashcard,
} from '../controllers/flashcardController.js';

const router = Router();

// Todas as rotas exigem autenticação e assinatura ativa
router.use(authenticate, requireActiveSubscription);

router.get('/due', getDueFlashcards);
router.get('/', listFlashcards);
router.post('/', createFlashcard);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);
router.post('/:id/review', reviewFlashcard);

export default router;
