import express from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Admin only routes
router.get('/', authenticate, requireAdmin, listUsers);
router.post('/', authenticate, requireAdmin, createUser);
router.get('/:id', authenticate, requireAdmin, getUser);
router.put('/:id', authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);
router.post('/:id/reset-password', authenticate, requireAdmin, resetUserPassword);

export default router;

