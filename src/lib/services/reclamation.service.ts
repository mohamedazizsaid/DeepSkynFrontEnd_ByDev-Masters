import apiClient from '../api-client';

export interface CreateReclamationPayload {
  nom: string;
  email: string;
  type_reclamation: string;
  description: string;
}

export interface CreateReclamationResponse {
  success?: boolean;
  message?: string;
  id_reclamation?: string;
  date?: string;
}

export const reclamationService = {
  async create(
    payload: CreateReclamationPayload,
  ): Promise<CreateReclamationResponse> {
    const response = await apiClient.post<CreateReclamationResponse>(
      '/n8n/reclamation',
      payload,
    );
    return response.data;
  },
};
