import { API_BASE_URL } from '@/config/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🔧 ApiClient inicializado com baseURL:', this.baseURL);
    console.log('🌍 import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
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

    console.log('🔗 ApiClient Request:', {
      baseURL: this.baseURL,
      endpoint,
      fullURL: url,
      hasToken: !!token,
      method: options.method || 'GET'
    });

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authorization header if token exists
    if (token && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log('📤 Fazendo requisição para:', url);
      const response = await fetch(url, config);
      console.log('📥 Resposta recebida:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      // Handle 401 Unauthorized (token expired)
      if (response.status === 401 && token && !options.skipRetry) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          return this.request(endpoint, { ...options, skipRetry: true });
        } else {
          // Refresh failed, logout
          this.removeToken();
          window.location.href = '/login';
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Erro na requisição: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
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
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
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
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;



