import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class CommentService {
  async list(questionId, orderBy = '-created_date') {
    const params = new URLSearchParams();
    if (questionId) params.append('question_id', questionId);
    if (orderBy) params.append('order', orderBy);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.COMMENTS}${query}`);
  }

  async create(data) {
    return apiClient.post(API_ENDPOINTS.COMMENTS, data);
  }

  async delete(id) {
    return apiClient.delete(API_ENDPOINTS.COMMENT_BY_ID(id));
  }

  async filter(filters, orderBy) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    if (orderBy) params.append('order', orderBy);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.COMMENTS}${query}`);
  }
}

export const commentService = new CommentService();
export default commentService;




