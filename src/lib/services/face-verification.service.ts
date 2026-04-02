import apiClient from '../api-client';

export interface FaceVerificationResult {
  verified: boolean;
  confidence: number;
  message: string;
  needsProfilePhoto: boolean;
}

export interface FaceReferenceStatus {
  hasFaceReference: boolean;
  hasProfilePhoto: boolean;
  profilePhotoUrl: string | null;
  faceReference: {
    id: string;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface VerifyFaceDto {
  descriptor: number[];
  imageBase64?: string;
}

export const faceVerificationService = {
  /**
   * Vérifie si le visage correspond à l'utilisateur connecté
   */
  async verify(data: VerifyFaceDto): Promise<FaceVerificationResult> {
    const response = await apiClient.post<FaceVerificationResult>(
      '/face-verification/verify',
      data
    );
    return response.data;
  },

  /**
   * Récupère le statut de la référence faciale
   */
  async getStatus(): Promise<FaceReferenceStatus> {
    const response = await apiClient.get<FaceReferenceStatus>(
      '/face-verification/status'
    );
    return response.data;
  },

  /**
   * Enregistre la référence faciale depuis la photo de profil
   */
  async registerFromProfile(data: VerifyFaceDto): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/face-verification/register-from-profile',
      data
    );
    return response.data;
  },

  /**
   * Enregistre une nouvelle référence faciale
   */
  async register(data: VerifyFaceDto): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/face-verification/register',
      data
    );
    return response.data;
  },

  /**
   * Réinitialise la référence faciale
   */
  async reset(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      '/face-verification/reset'
    );
    return response.data;
  },
};
