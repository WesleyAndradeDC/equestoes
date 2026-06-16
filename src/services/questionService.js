import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class QuestionService {
  async listPaginated({ page = 1, limit = 10, ...filters } = {}) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    return apiClient.get(`${API_ENDPOINTS.QUESTIONS}?${params.toString()}`);
  }

  async list(orderBy, limit) {
    return this.listPaginated({ page: 1, limit: limit || 10 });
  }

  async get(id) {
    return apiClient.get(API_ENDPOINTS.QUESTION_BY_ID(id));
  }

  async getByCode(code) {
    return apiClient.get(API_ENDPOINTS.QUESTION_BY_CODE(code));
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

  async getFilters() {
    return apiClient.get(API_ENDPOINTS.QUESTION_FILTERS);
  }

  async filter(filters) {
    return this.listPaginated({ page: 1, limit: 10, ...filters });
  }
}

export const questionService = new QuestionService();
export default questionService;
