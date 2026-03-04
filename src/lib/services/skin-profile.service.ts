import apiClient from '../api-client';
import type { SkinProfile, CreateSkinProfileDto } from '../types';

export const skinProfileService = {
  async getMyProfile(): Promise<SkinProfile | null> {
    try {
      const res = await apiClient.get<SkinProfile>('/skin-profiles/me');
      return res.data;
    } catch {
      return null;
    }
  },

  async exists(): Promise<boolean> {
    const res = await apiClient.get<{ exists: boolean }>('/skin-profiles/me/exists');
    return res.data.exists;
  },

  async checkOnboardingStatus(): Promise<{ onboardingComplete: boolean; hasProfile: boolean }> {
    try {
      const res = await apiClient.get<{ onboardingComplete: boolean; hasProfile: boolean }>('/skin-profiles/me/onboarding-status');
      return res.data;
    } catch {
      return { onboardingComplete: false, hasProfile: false };
    }
  },

  async create(data: CreateSkinProfileDto): Promise<SkinProfile> {
    const res = await apiClient.post<SkinProfile>('/skin-profiles', data);
    return res.data;
  },

  async upsert(data: CreateSkinProfileDto): Promise<SkinProfile> {
    const res = await apiClient.post<SkinProfile>('/skin-profiles/upsert', data);
    return res.data;
  },

  async update(data: Partial<CreateSkinProfileDto>): Promise<SkinProfile> {
    const res = await apiClient.patch<SkinProfile>('/skin-profiles/me', data);
    return res.data;
  },

  async updateConcerns(concerns: string[]): Promise<SkinProfile> {
    const res = await apiClient.patch<SkinProfile>('/skin-profiles/me/concerns', { concerns });
    return res.data;
  },

  async addConcern(concern: string): Promise<SkinProfile> {
    const res = await apiClient.post<SkinProfile>(`/skin-profiles/me/concerns/${concern}`);
    return res.data;
  },

  async removeConcern(concern: string): Promise<SkinProfile> {
    const res = await apiClient.delete<SkinProfile>(`/skin-profiles/me/concerns/${concern}`);
    return res.data;
  },

  async updateSensitivities(sensitivities: string[]): Promise<SkinProfile> {
    const res = await apiClient.patch<SkinProfile>('/skin-profiles/me/sensitivities', { sensitivities });
    return res.data;
  },

  async deleteProfile(): Promise<void> {
    await apiClient.delete('/skin-profiles/me');
  },
};
