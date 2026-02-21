import express from 'express';
import {
  listNotebooks,
  getNotebook,
  createNotebook,
  updateNotebook,
  deleteNotebook
} from '../controllers/notebookController.js';
import { authenticate, requireActiveSubscription } from '../middlewares/auth.js';

const router = express.Router();

router.get('/',    authenticate, requireActiveSubscription, listNotebooks);
router.get('/:id', authenticate, requireActiveSubscription, getNotebook);
router.post('/',   authenticate, requireActiveSubscription, createNotebook);
router.put('/:id', authenticate, requireActiveSubscription, updateNotebook);
router.delete('/:id', authenticate, requireActiveSubscription, deleteNotebook);

export default router;

