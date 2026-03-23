// API Configuration — E-Questões
const envURL = import.meta.env.VITE_API_BASE_URL;
const defaultURL = 'http://localhost:5000/api';
const productionURL = 'https://e-questoes-api.onrender.com/api';

export const API_BASE_URL =
  envURL ||
  (window.location.hostname === 'localhost' ? defaultURL : productionURL);

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
