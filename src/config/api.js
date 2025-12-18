// API Configuration
const envURL = import.meta.env.VITE_API_BASE_URL;
const defaultURL = 'http://localhost:5000/api';
const productionURL = 'https://gconcursos-api.onrender.com/api';

// Se não tiver variável de ambiente e não estiver em localhost, usa produção
export const API_BASE_URL = envURL || 
  (window.location.hostname === 'localhost' ? defaultURL : productionURL);

console.log('🔧 API Config:', {
  envURL,
  defaultURL,
  productionURL,
  hostname: window.location.hostname,
  API_BASE_URL
});

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  CHECK_EMAIL: '/auth/check-email', // Nova
  SET_PASSWORD: '/auth/set-password', // Nova
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
  USER_BY_ID: (id) => `/users/${id}`,
  
  // Tutor
  TUTOR_INVOKE: '/tutor/invoke',
  
  // Webhook
  WEBHOOK_WOOCOMMERCE: '/webhook/woocommerce',
};



