import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class AttemptService {
  async list(orderBy = '-created_date', limit) {
    const params = new URLSearchParams();
    if (orderBy) params.append('order', orderBy);
    if (limit) params.append('limit', limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.ATTEMPTS}${query}`);
  }

  async create(data) {
    return apiClient.post(API_ENDPOINTS.ATTEMPTS, data);
  }

  async getUserAttempts(limit, offset) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.USER_ATTEMPTS}${query}`);
  }
}

export const attemptService = new AttemptService();
export default attemptService;


