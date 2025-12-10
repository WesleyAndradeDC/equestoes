import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class UserService {
  async list() {
    return apiClient.get(API_ENDPOINTS.USERS);
  }

  async get(id) {
    return apiClient.get(API_ENDPOINTS.USER_BY_ID(id));
  }

  async update(id, data) {
    return apiClient.put(API_ENDPOINTS.USER_BY_ID(id), data);
  }

  async delete(id) {
    return apiClient.delete(API_ENDPOINTS.USER_BY_ID(id));
  }
}

export const userService = new UserService();
export default userService;


