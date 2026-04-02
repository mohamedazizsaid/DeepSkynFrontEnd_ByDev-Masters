import apiClient from '../api-client';

interface RoutineDay {
  day: string;
  morning: string[];
  evening: string[];
  tip: string;
  warning: string | null;
}

export interface GeneratedRoutine {
  days: RoutineDay[];
  globalAdvice: string;
}

export interface PredictiveRoutineResponse {
  id: string;
  routine: GeneratedRoutine;
  generatedAt: string;
  expiresAt: string;
}

export interface AnalysisResult {
  condition: string;
  detectedIssues: string[];
  skinType: string;
}

export interface GenerateRoutineRequest {
  analysisId: string;
  analysisResult: AnalysisResult;
  latitude: number;
  longitude: number;
}

export const predictiveRoutineService = {
  async generateRoutine(request: GenerateRoutineRequest): Promise<PredictiveRoutineResponse> {
    const res = await apiClient.post<PredictiveRoutineResponse>(
      '/predictive-routine/generate',
      request,
    );
    return res.data;
  },

  async validateAndActivateRoutine(routineId: string): Promise<{ success: boolean; routineId: string; message: string }> {
    const res = await apiClient.post<{ success: boolean; routineId: string; message: string }>(
      `/predictive-routine/${routineId}/validate`,
    );
    return res.data;
  },
};