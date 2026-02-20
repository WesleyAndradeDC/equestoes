import { API_BASE_URL } from '@/config/api';

const isDev = import.meta.env.DEV;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  setToken(token) {
    localStorage.setItem('accessToken', token);
  }

  removeToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (token && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Token expirado: tenta renovar
      if (response.status === 401 && token && !options.skipRetry) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(endpoint, { ...options, skipRetry: true });
        } else {
          // Remove tokens e lança erro para ser tratado pelo AuthContext/ProtectedRoute
          this.removeToken();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Erro na requisição: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (isDev) {
        console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
      }
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setToken(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
