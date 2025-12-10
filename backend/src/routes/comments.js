import express from 'express';
import {
  listComments,
  createComment,
  deleteComment
} from '../controllers/commentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, listComments);
router.post('/', authenticate, createComment);
router.delete('/:id', authenticate, deleteComment);

export default router;

