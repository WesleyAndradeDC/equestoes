import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class AuthService {
  // ETAPA 1: Verificar se email existe e se é primeiro acesso
  async checkEmail(email) {
    console.log('📧 AuthService: Verificando email...', { email });
    try {
      const data = await apiClient.post(API_ENDPOINTS.CHECK_EMAIL, { email }, { skipAuth: true });
      console.log('✅ AuthService: Email verificado', data);
      return data;
    } catch (error) {
      console.log('❌ AuthService: Erro ao verificar email', error);
      
      // Se for 404, email não existe - mostrar convite
      if (error.response?.status === 404) {
        return {
          exists: false,
          message: error.response?.data?.message || 'Email não encontrado',
          action: 'join',
          joinUrl: error.response?.data?.joinUrl || 'https://gramatiquecursos.com/'
        };
      }
      
      throw error;
    }
  }

  // ETAPA 2A: Definir senha (primeiro acesso)
  async setPassword(email, password, password_confirm) {
    console.log('🔑 AuthService: Definindo senha...', { email });
    const data = await apiClient.post(API_ENDPOINTS.SET_PASSWORD, {
      email,
      password,
      password_confirm
    }, { skipAuth: true });
    console.log('✅ AuthService: Senha definida com sucesso', data);
    
    // Save tokens
    apiClient.setToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data.user;
  }

  // ETAPA 2B: Login com senha (não é primeiro acesso)
  async login(email, password) {
    console.log('🔐 AuthService: Fazendo login...', { email });
    const data = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password }, { skipAuth: true });
    console.log('✅ AuthService: Login bem-sucedido', data);
    
    // Save tokens
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

  // Logout completo: limpa tokens e força reload para /login
  // Usar apenas quando o usuário clica em "Sair"
  logout() {
    apiClient.removeToken();
    window.location.href = '/login';
  }

  // Limpa apenas os tokens sem forçar navegação
  // Usar em checkAuth() para evitar dupla navegação com apiClient
  clearAuth() {
    apiClient.removeToken();
  }

  isAuthenticated() {
    return !!apiClient.getToken();
  }
}

export const authService = new AuthService();
export default authService;




