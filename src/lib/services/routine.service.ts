import apiClient from '../api-client';
import type { Routine, CreateRoutineDto } from '../types';

export const routineService = {
  async create(data: CreateRoutineDto): Promise<Routine> {
    const res = await apiClient.post<Routine>('/routines', data);
    return res.data;
  },

  async generateAI(): Promise<Routine> {
    const res = await apiClient.post<Routine>('/routines/generate');
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
    const res = await apiClient.patch<Routine>(`/routines/${id}/steps/${stepOrder}/complete`);
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

  async reorderSteps(id: string, stepOrders: number[]): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}/reorder`, { stepOrders });
    return res.data;
  },

  async duplicate(id: string): Promise<Routine> {
    const res = await apiClient.post<Routine>(`/routines/${id}/duplicate`);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/routines/${id}`);
  },
};
