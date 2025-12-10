import express from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Admin only routes
router.get('/', authenticate, requireAdmin, listUsers);
router.get('/:id', authenticate, requireAdmin, getUser);
router.put('/:id', authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;

