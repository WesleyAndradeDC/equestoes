import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class AuthService {
  async login(email, password) {
    const data = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password }, { skipAuth: true });
    
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

  logout() {
    apiClient.removeToken();
    window.location.href = '/login';
  }

  isAuthenticated() {
    return !!apiClient.getToken();
  }
}

export const authService = new AuthService();
export default authService;



