import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class NotebookService {
  async list() {
    return apiClient.get(API_ENDPOINTS.NOTEBOOKS);
  }

  async get(id) {
    return apiClient.get(API_ENDPOINTS.NOTEBOOK_BY_ID(id));
  }

  async create(data) {
    return apiClient.post(API_ENDPOINTS.NOTEBOOKS, data);
  }

  async update(id, data) {
    return apiClient.put(API_ENDPOINTS.NOTEBOOK_BY_ID(id), data);
  }

  async delete(id) {
    return apiClient.delete(API_ENDPOINTS.NOTEBOOK_BY_ID(id));
  }

  async filter(filters) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.NOTEBOOKS}${query}`);
  }
}

export const notebookService = new NotebookService();
export default notebookService;


