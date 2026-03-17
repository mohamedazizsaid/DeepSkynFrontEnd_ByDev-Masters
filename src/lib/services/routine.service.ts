import apiClient from '../api-client';
import type {
  Routine,
  CreateRoutineDto,
  GenerateRoutineDto,
  AdviseRoutineDto,
  AIAdviceResponse,
} from '../types';

export const routineService = {
  async create(data: CreateRoutineDto): Promise<Routine> {
    const res = await apiClient.post<Routine>('/routines', data);
    return res.data;
  },

  async generateAI(data?: GenerateRoutineDto): Promise<Routine> {
    const res = await apiClient.post<Routine>('/routines/generate', data || { type: 'AM' });
    return res.data;
  },

  async getAll(params?: { type?: string; isActive?: boolean; isAIGenerated?: boolean }): Promise<Routine[]> {
    const res = await apiClient.get<Routine[]>('/routines', { params });
    return res.data;
  },

  async getById(id: string): Promise<Routine> {
    const res = await apiClient.get<Routine>(`/routines/${id}`);
    return res.data;
  },

  async getActive(type: string): Promise<Routine[]> {
    const res = await apiClient.get<Routine[]>(`/routines/active/${type}`);
    return res.data;
  },

  async getStatistics(): Promise<any> {
    const res = await apiClient.get('/routines/statistics');
    return res.data;
  },

  async update(id: string, data: Partial<CreateRoutineDto>): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}`, data);
    return res.data;
  },

  async toggleActive(id: string): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}/toggle`);
    return res.data;
  },

  async completeStep(id: string, stepOrder: number): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}/steps/${stepOrder}/complete`, { isCompleted: true });
    return res.data;
  },

  async resetSteps(id: string): Promise<Routine> {
    const res = await apiClient.post<Routine>(`/routines/${id}/reset`);
    return res.data;
  },

  async addStep(id: string, step: any): Promise<Routine> {
    const res = await apiClient.post<Routine>(`/routines/${id}/steps`, step);
    return res.data;
  },

  async removeStep(id: string, stepOrder: number): Promise<Routine> {
    const res = await apiClient.delete<Routine>(`/routines/${id}/steps/${stepOrder}`);
    return res.data;
  },

  async reorderSteps(id: string, newOrder: number[]): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}/reorder`, { newOrder });
    return res.data;
  },

  async duplicate(id: string): Promise<Routine> {
    const res = await apiClient.post<Routine>(`/routines/${id}/duplicate`);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/routines/${id}`);
  },

  async adviseOnChange(routineId: string, data: AdviseRoutineDto): Promise<AIAdviceResponse> {
    const res = await apiClient.post<AIAdviceResponse>(`/routines/${routineId}/advise`, data);
    return res.data;
  },
};
