import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class AttemptService {
  async list(orderBy = '-created_date', limit) {
    console.log('📡 AttemptService.list() chamado', { orderBy, limit });
    
    const params = new URLSearchParams();
    if (orderBy) params.append('order', orderBy);
    if (limit) params.append('limit', limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_ENDPOINTS.ATTEMPTS}${query}`;
    
    console.log('🌐 URL completa:', url);
    
    try {
      const result = await apiClient.get(url);
      console.log('✅ Tentativas recebidas:', {
        type: typeof result,
        isArray: Array.isArray(result),
        length: result?.length,
        first: result?.[0]
      });
      return result;
    } catch (error) {
      console.error('❌ Erro no AttemptService:', error);
      throw error;
    }
  }

  async create(data) {
    console.log('📡 AttemptService.create() chamado', data);
    try {
      const result = await apiClient.post(API_ENDPOINTS.ATTEMPTS, data);
      console.log('✅ Tentativa criada:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar tentativa:', error);
      throw error;
    }
  }

  async getUserAttempts(limit, offset) {
    console.log('📡 AttemptService.getUserAttempts() chamado', { limit, offset });
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_ENDPOINTS.USER_ATTEMPTS}${query}`;
    
    console.log('🌐 URL completa:', url);
    
    try {
      const result = await apiClient.get(url);
      console.log('✅ Tentativas do usuário recebidas:', result?.length);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar tentativas do usuário:', error);
      throw error;
    }
  }
}

export const attemptService = new AttemptService();
export default attemptService;



