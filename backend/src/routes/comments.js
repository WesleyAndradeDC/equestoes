import express from 'express';
import {
  listComments,
  createComment,
  deleteComment
} from '../controllers/commentController.js';
import { authenticate, requireActiveSubscription } from '../middlewares/auth.js';

const router = express.Router();

router.get('/',     authenticate, requireActiveSubscription, listComments);
router.post('/',    authenticate, requireActiveSubscription, createComment);
router.delete('/:id', authenticate, requireActiveSubscription, deleteComment);

export default router;

