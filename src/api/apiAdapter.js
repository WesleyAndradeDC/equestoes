// Adapter para manter compatibilidade com sintaxe base44
// Permite migração gradual sem quebrar o código existente

import { authService } from '@/services/authService';
import { questionService } from '@/services/questionService';
import { attemptService } from '@/services/attemptService';
import { notebookService } from '@/services/notebookService';
import { commentService } from '@/services/commentService';
import { userService } from '@/services/userService';
import { tutorService } from '@/services/tutorService';

// Auth adapter
const authAdapter = {
  me: () => authService.me(),
  updateMe: (data) => authService.updateMe(data),
  logout: () => authService.logout(),
  login: (credentials) => authService.login(credentials.email, credentials.password),
};

// Entities adapters
const Question = {
  list: (orderBy, limit) => questionService.list(orderBy, limit),
  get: (id) => questionService.get(id),
  create: (data) => questionService.create(data),
  update: (id, data) => questionService.update(id, data),
  delete: (id) => questionService.delete(id),
  filter: (filters) => questionService.filter(filters),
};

const Attempt = {
  list: (orderBy, limit) => attemptService.list(orderBy, limit),
  create: (data) => attemptService.create(data),
  getUserAttempts: (limit, offset) => attemptService.getUserAttempts(limit, offset),
};

const Notebook = {
  list: () => notebookService.list(),
  get: (id) => notebookService.get(id),
  create: (data) => notebookService.create(data),
  update: (id, data) => notebookService.update(id, data),
  delete: (id) => notebookService.delete(id),
  filter: (filters) => notebookService.filter(filters),
};

const Comment = {
  list: (questionId, orderBy) => commentService.list(questionId, orderBy),
  create: (data) => commentService.create(data),
  delete: (id) => commentService.delete(id),
  filter: (filters, orderBy) => commentService.filter(filters, orderBy),
};

const User = {
  list: () => userService.list(),
  get: (id) => userService.get(id),
  update: (id, data) => userService.update(id, data),
  delete: (id) => userService.delete(id),
};

// Integrations adapter
const Core = {
  InvokeLLM: ({ prompt }) => tutorService.invokeLLM(prompt),
};

// Export em formato base44
export const base44 = {
  auth: authAdapter,
  entities: {
    Question,
    Attempt,
    Notebook,
    Comment,
    User,
  },
  integrations: {
    Core,
  },
};

export default base44;



