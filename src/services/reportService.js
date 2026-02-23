import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class ReportService {
  /** Aluno reporta uma questão */
  async create(question_id, reason) {
    return apiClient.post(API_ENDPOINTS.REPORTS, { question_id, reason });
  }

  /** Admin/Professor lista todos os reports */
  async list(status = 'pending') {
    return apiClient.get(`${API_ENDPOINTS.REPORTS}?status=${status}`);
  }

  /** Contagens por status para exibir badge */
  async counts() {
    return apiClient.get(API_ENDPOINTS.REPORT_COUNTS);
  }

  /** Admin/Professor atualiza status/nota */
  async update(id, data) {
    return apiClient.put(API_ENDPOINTS.REPORT_BY_ID(id), data);
  }

  /** Admin deleta report */
  async delete(id) {
    return apiClient.delete(API_ENDPOINTS.REPORT_BY_ID(id));
  }
}

export const reportService = new ReportService();
export default reportService;
