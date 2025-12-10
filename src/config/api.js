// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
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
};

