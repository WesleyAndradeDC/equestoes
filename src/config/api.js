// API Configuration — E-Questões
// Produção: sempre /api (nginx proxy same-origin, zero CORS)
// Dev: localhost:5000 ou VITE_API_BASE_URL explícito
const envURL = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

function normalizeApiBaseUrl(url) {
  if (!url) return null;
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.startsWith('/')) return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function resolveApiBaseUrl() {
  if (isDev && isLocalhost) {
    return normalizeApiBaseUrl(envURL) || 'http://localhost:5000/api';
  }
  // Produção: path relativo → nginx repassa pro backend
  return '/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  CHECK_EMAIL: '/auth/check-email',
  SET_PASSWORD: '/auth/set-password',
  ME: '/auth/me',
  UPDATE_ME: '/auth/me',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',

  // Questions
  QUESTIONS: '/questions',
  QUESTION_FILTERS: '/questions/filters',
  QUESTION_BY_ID: (id) => `/questions/${id}`,
  QUESTION_BY_CODE: (code) => `/questions/by-code/${encodeURIComponent(code)}`,

  // Attempts
  ATTEMPTS: '/attempts',
  USER_ATTEMPTS: '/attempts/me',

  // Notebooks
  NOTEBOOKS: '/notebooks',
  NOTEBOOK_BY_ID: (id) => `/notebooks/${id}`,

  // Comments
  COMMENTS: '/comments',
  COMMENT_BY_ID: (id) => `/comments/${id}`,

  // Users (Admin)
  USERS: '/users',
  CREATE_USER: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  USER_RESET_PASSWORD: (id) => `/users/${id}/reset-password`,

  // Ranking
  RANKING: '/ranking',

  // Reports
  REPORTS: '/reports',
  REPORT_COUNTS: '/reports/counts',
  REPORT_BY_ID: (id) => `/reports/${id}`,

  // Tutor (E-Tutory)
  TUTOR_INVOKE: '/tutor/invoke',

  // Flashcards
  FLASHCARDS: '/flashcards',
  FLASHCARD_BY_ID: (id) => `/flashcards/${id}`,
  FLASHCARDS_DUE: '/flashcards/due',
  FLASHCARD_REVIEW: (id) => `/flashcards/${id}/review`,

  // Webhook
  WEBHOOK_WOOCOMMERCE: '/webhook/woocommerce',
};
