import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class UserService {
  async list() {
    console.log('📡 UserService.list() chamado');
    try {
      const result = await apiClient.get(API_ENDPOINTS.USERS);
      console.log('✅ Usuários recebidos:', {
        type: typeof result,
        isArray: Array.isArray(result),
        length: result?.length
      });
      return result;
    } catch (error) {
      console.error('❌ Erro no UserService.list():', error);
      throw error;
    }
  }

  async get(id) {
    console.log('📡 UserService.get() chamado', { id });
    try {
      const result = await apiClient.get(API_ENDPOINTS.USER_BY_ID(id));
      console.log('✅ Usuário recebido:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro no UserService.get():', error);
      throw error;
    }
  }

  async update(id, data) {
    console.log('📡 UserService.update() chamado', { id, data });
    try {
      const result = await apiClient.put(API_ENDPOINTS.USER_BY_ID(id), data);
      console.log('✅ Usuário atualizado:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro no UserService.update():', error);
      throw error;
    }
  }

  async delete(id) {
    console.log('📡 UserService.delete() chamado', { id });
    try {
      const result = await apiClient.delete(API_ENDPOINTS.USER_BY_ID(id));
      console.log('✅ Usuário deletado:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro no UserService.delete():', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;



