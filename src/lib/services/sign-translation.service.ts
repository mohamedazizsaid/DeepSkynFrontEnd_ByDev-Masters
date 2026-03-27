import apiClient from '../api-client';

export interface Keypoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface Frame {
  hand_right_keypoints: Keypoint[];
  hand_left_keypoints: Keypoint[];
  pose_keypoints: Keypoint[];
}

export interface SignTranslationMetadata {
  gloss: string;
  fps: number;
  total_frames: number;
  duration_ms?: number;
  sign_language?: string;
  translation_quality?: 'real' | 'mock';
  source?: string;
}

export interface SignTranslationResponse {
  frames: Frame[];
  metadata: SignTranslationMetadata;
  status: string;
  message?: string;
  error?: string;
}

export interface SignTranslationData {
  id: string;
  postId: string;
  transcript: string;
  language: string;
  frames: Frame[];
  metadata: SignTranslationMetadata;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const signTranslationService = {
  /**
   * Traduit un texte en langage des signes
   */
  async translateText(
    text: string,
    language: string = 'fr',
  ): Promise<SignTranslationResponse> {
    try {
      const res = await apiClient.post<SignTranslationResponse>(
        '/sign-translation/translate',
        { text, language },
      );
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la traduction en langage des signes',
      );
    }
  },

  /**
   * Traduit et sauvegarde un post vidéo
   */
  async translateVideoPost(
    postId: string,
    transcript: string,
    language: string = 'fr',
  ): Promise<SignTranslationData> {
    try {
      const res = await apiClient.post<SignTranslationData>(
        `/sign-translation/videopost/${postId}`,
        { transcript, language },
      );
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la traduction du post vidéo',
      );
    }
  },

  /**
   * Récupère la traduction d'un post vidéo
   */
  async getVideoPostTranslation(postId: string): Promise<SignTranslationData> {
    try {
      const res = await apiClient.get<SignTranslationData>(
        `/sign-translation/videopost/${postId}`,
      );
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la récupération de la traduction',
      );
    }
  },
};
