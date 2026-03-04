import apiClient from '../api-client';
import type {
  Analysis,
  AnalysisStats,
  AnalysisComparison,
  AnalysisListResponse,
  GeminiAnalysisResult,
  RealTimeScanDto,
} from '../types';

export const analysisService = {
  /** Upload images and create a new AI skin analysis */
  async uploadAndAnalyze(
    files: File[],
    questionnaire?: Record<string, unknown>,
  ): Promise<Analysis> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (questionnaire) {
      formData.append('questionnaire', JSON.stringify(questionnaire));
    }
    const res = await apiClient.post<Analysis>('/analyses/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return res.data;
  },

  /** Create analysis from existing image URLs */
  async createFromUrls(imageUrls: string[]): Promise<Analysis> {
    const res = await apiClient.post<Analysis>('/analyses', { images: imageUrls });
    return res.data;
  },

  /** Process a real-time face scan (base64 image → Gemini) */
  async scan(dto: RealTimeScanDto): Promise<GeminiAnalysisResult> {
    const res = await apiClient.post<GeminiAnalysisResult>('/analyses/scan', dto, {
      timeout: 120_000,
    });
    return res.data;
  },

  /** Get paginated list of user's analyses */
  async getAll(page = 1, limit = 10): Promise<AnalysisListResponse> {
    const res = await apiClient.get<AnalysisListResponse>('/analyses', {
      params: { page, limit },
    });
    return res.data;
  },

  /** Get a single analysis by ID */
  async getById(id: string): Promise<Analysis> {
    const res = await apiClient.get<Analysis>(`/analyses/${id}`);
    return res.data;
  },

  /** Get the most recent completed analysis */
  async getLatest(): Promise<Analysis> {
    const res = await apiClient.get<Analysis>('/analyses/latest');
    return res.data;
  },

  /** Get user's analysis statistics (score history, conditions, etc.) */
  async getStats(): Promise<AnalysisStats> {
    const res = await apiClient.get<AnalysisStats>('/analyses/stats');
    return res.data;
  },

  /** Get AI-generated personalized skincare advice */
  async getAdvice(): Promise<string> {
    const res = await apiClient.get<string>('/analyses/advice');
    return res.data;
  },

  /** Compare two analyses and get the diff */
  async compare(id1: string, id2: string): Promise<AnalysisComparison> {
    const res = await apiClient.get<AnalysisComparison>('/analyses/compare', {
      params: { id1, id2 },
    });
    return res.data;
  },

  /** Retry a failed analysis */
  async retry(id: string): Promise<Analysis> {
    const res = await apiClient.post<Analysis>(`/analyses/${id}/retry`);
    return res.data;
  },

  /** Delete an analysis */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/analyses/${id}`);
  },
};
