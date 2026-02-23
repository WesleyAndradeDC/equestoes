// API Configuration
const envURL = import.meta.env.VITE_API_BASE_URL;
const defaultURL = 'http://localhost:5000/api';
const productionURL = 'https://gconcursos-api.onrender.com/api';

// Se não tiver variável de ambiente e não estiver em localhost, usa produção
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

  // Ranking
  RANKING: '/ranking',

  // Tutor
  TUTOR_INVOKE: '/tutor/invoke',

  // Webhook
  WEBHOOK_WOOCOMMERCE: '/webhook/woocommerce',
};
