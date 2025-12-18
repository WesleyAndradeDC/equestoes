import express from 'express';
import { 
  register, 
  login, 
  checkEmail, 
  setPassword, 
  me, 
  updateMe, 
  logout, 
  refreshToken 
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmail); // Nova rota - Etapa 1
router.post('/set-password', setPassword); // Nova rota - Definir senha
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateMe);
router.post('/logout', authenticate, logout);

export default router;
