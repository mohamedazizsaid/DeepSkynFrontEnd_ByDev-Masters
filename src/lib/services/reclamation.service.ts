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

export interface ProcessReclamationPayload {
  email: string;
  nom?: string;
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

  async markProcessed(payload: ProcessReclamationPayload): Promise<{ success?: boolean; message?: string }> {
    const response = await apiClient.post<{ success?: boolean; message?: string }>(
      '/n8n/reclamation/processed',
      payload,
    );
    return response.data;
  },
};
