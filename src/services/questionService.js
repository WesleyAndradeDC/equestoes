import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class QuestionService {
  async list(orderBy, limit) {
    console.log('📡 QuestionService.list() chamado', { orderBy, limit });
    console.log('🔗 API_ENDPOINTS.QUESTIONS:', API_ENDPOINTS.QUESTIONS);
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_ENDPOINTS.QUESTIONS}${query}`;
    
    console.log('🌐 URL completa:', url);
    
    try {
      const result = await apiClient.get(url);
      console.log('✅ Resposta recebida:', {
        type: typeof result,
        isArray: Array.isArray(result),
        length: result?.length,
        first: result?.[0]
      });
      return result;
    } catch (error) {
      console.error('❌ Erro no QuestionService:', error);
      throw error;
    }
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

  async getFilters() {
    return apiClient.get(API_ENDPOINTS.QUESTION_FILTERS);
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



