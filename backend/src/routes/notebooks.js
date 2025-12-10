import express from 'express';
import {
  listNotebooks,
  getNotebook,
  createNotebook,
  updateNotebook,
  deleteNotebook
} from '../controllers/notebookController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, listNotebooks);
router.get('/:id', authenticate, getNotebook);
router.post('/', authenticate, createNotebook);
router.put('/:id', authenticate, updateNotebook);
router.delete('/:id', authenticate, deleteNotebook);

export default router;

