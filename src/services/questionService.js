import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class QuestionService {
  async list(orderBy, limit) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.QUESTIONS}${query}`);
  }

  async get(id) {
    return apiClient.get(API_ENDPOINTS.QUESTION_BY_ID(id));
  }

  async create(data) {
    return apiClient.post(API_ENDPOINTS.QUESTIONS, data);
  }

  async update(id, data) {
    return apiClient.put(API_ENDPOINTS.QUESTION_BY_ID(id), data);
  }

  async delete(id) {
    return apiClient.delete(API_ENDPOINTS.QUESTION_BY_ID(id));
  }

  async filter(filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.QUESTIONS}${query}`);
  }
}

export const questionService = new QuestionService();
export default questionService;


