import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

class CronogramaService {
  // ── Cronogramas oficiais ────────────────────────────────────────────────────
  async listOfficial(params = {}) {
    const qs = new URLSearchParams({ official: 'true', status: 'active', ...params }).toString();
    return apiClient.get(`${API_ENDPOINTS.CRONOGRAMAS_OFFICIAL}?${qs}`);
  }

  async getById(id) {
    return apiClient.get(API_ENDPOINTS.CRONOGRAMA_BY_ID(id));
  }

  async adopt(cronogramId) {
    return apiClient.post(API_ENDPOINTS.CRONOGRAMAS_ADOPT(cronogramId));
  }

  async getAvailableDisciplines() {
    return apiClient.get(API_ENDPOINTS.CRONOGRAMAS_DISCIPLINES);
  }

  // ── Cronogramas do usuário ──────────────────────────────────────────────────
  async listMy() {
    return apiClient.get(API_ENDPOINTS.CRONOGRAMAS_MY);
  }

  async getMy(id) {
    return apiClient.get(API_ENDPOINTS.CRONOGRAMAS_MY_BY_ID(id));
  }

  async createMy(data) {
    return apiClient.post(API_ENDPOINTS.CRONOGRAMAS_MY, data);
  }

  async getDayTasks(id, date) {
    const qs = date ? `?date=${date}` : '';
    return apiClient.get(`${API_ENDPOINTS.CRONOGRAMAS_MY_TASKS(id)}${qs}`);
  }

  async updateTaskStatus(taskId, data) {
    return apiClient.patch(API_ENDPOINTS.CRONOGRAMAS_TASK_STATUS(taskId), data);
  }

  async updateSubjectProgress(cronogramId, subjectId, data) {
    return apiClient.patch(API_ENDPOINTS.CRONOGRAMAS_SUBJECT_PROGRESS(cronogramId, subjectId), data);
  }

  async getStats(id) {
    return apiClient.get(API_ENDPOINTS.CRONOGRAMAS_MY_STATS(id));
  }

  async getCalendar(id, month, year) {
    return apiClient.get(`${API_ENDPOINTS.CRONOGRAMAS_MY_CALENDAR(id)}?month=${month}&year=${year}`);
  }

  async recalculate(id) {
    return apiClient.post(API_ENDPOINTS.CRONOGRAMAS_MY_RECALCULATE(id));
  }

  // ── Admin: CRUD ─────────────────────────────────────────────────────────────
  async adminList(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`${API_ENDPOINTS.CRONOGRAMAS}?${qs}`);
  }

  async adminCreate(data) {
    return apiClient.post(API_ENDPOINTS.CRONOGRAMAS, data);
  }

  async adminUpdate(id, data) {
    return apiClient.put(API_ENDPOINTS.CRONOGRAMA_BY_ID(id), data);
  }

  async adminDelete(id) {
    return apiClient.delete(API_ENDPOINTS.CRONOGRAMA_BY_ID(id));
  }
}

export const cronogramaService = new CronogramaService();
export default cronogramaService;
