// ─── User / Skin Profile Types ───
export type SkinType = 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive';

export interface SkinProfile {
  id: string;
  userId: string;
  skinType: SkinType | null;
  fitzpatrickType: number | null;
  concerns: string[];
  sensitivities: string[];
  skinAge: number | null;
  healthScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkinProfileDto {
  skinType?: SkinType;
  fitzpatrickType?: number;
  concerns?: string[];
  sensitivities?: string[];
  skinAge?: number;
  healthScore?: number;
  lastAnalysisAt?: string;
}
