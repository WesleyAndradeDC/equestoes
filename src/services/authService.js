import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class AuthService {
  // ETAPA 1: Verificar se email existe e se é primeiro acesso
  async checkEmail(email) {
    try {
      return await apiClient.post(API_ENDPOINTS.CHECK_EMAIL, { email }, { skipAuth: true });
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          exists: false,
          message: error.response?.data?.message || 'Email não encontrado',
          action: 'join',
          joinUrl: error.response?.data?.joinUrl || 'https://gramatiquecursos.com/',
        };
      }
      throw error;
    }
  }

  // ETAPA 2A: Definir senha (primeiro acesso)
  async setPassword(email, password, password_confirm) {
    const data = await apiClient.post(
      API_ENDPOINTS.SET_PASSWORD,
      { email, password, password_confirm },
      { skipAuth: true },
    );
    apiClient.setToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.user;
  }

  // ETAPA 2B: Login com senha
  async login(email, password) {
    const data = await apiClient.post(
      API_ENDPOINTS.LOGIN,
      { email, password },
      { skipAuth: true },
    );
    apiClient.setToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.user;
  }

  async register(userData) {
    const data = await apiClient.post(API_ENDPOINTS.REGISTER, userData, { skipAuth: true });
    
    // Save tokens
    apiClient.setToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data.user;
  }

  async me() {
    return apiClient.get(API_ENDPOINTS.ME);
  }

  async updateMe(data) {
    return apiClient.put(API_ENDPOINTS.UPDATE_ME, data);
  }

  // Limpa tokens e estado de autenticação.
  // NÃO força window.location — a navegação para /login é feita pelo
  // ProtectedRoute via React Router (client-side, sem requisição ao servidor).
  logout() {
    this.clearAuth();
  }

  // Limpa apenas os tokens sem forçar navegação
  clearAuth() {
    apiClient.removeToken();
  }

  isAuthenticated() {
    return !!apiClient.getToken();
  }
}

export const authService = new AuthService();
export default authService;




