import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class TutorService {
  async invokeLLM(prompt) {
    const response = await apiClient.post(API_ENDPOINTS.TUTOR_INVOKE, { prompt });
    return response; // Backend retorna diretamente a string
  }
}

export const tutorService = new TutorService();
export default tutorService;




