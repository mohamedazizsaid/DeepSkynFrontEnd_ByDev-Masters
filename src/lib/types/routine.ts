// ─── Routine Types ───
export type RoutineType = 'AM' | 'PM' | 'weekly';

export interface RoutineStep {
  order: number;
  name: string;
  product?: string;
  productName?: string;
  productBrand?: string;
  category?: string;
  description?: string;
  duration?: number | string;
  completed?: boolean;
  isCompleted?: boolean;
  notes?: string;
  id?: string;
  ingredients?: string[];
  conflicts?: string[];
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  type: RoutineType | string;
  steps: RoutineStep[];
  ingredients?: string[];
  notes?: string;
  isAIGenerated: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineDto {
  name: string;
  type: RoutineType;
  steps: RoutineStep[];
  ingredients?: string[];
  notes?: string;
}

export interface GenerateRoutineDto {
  type: string;
  skinType?: string;
  concerns?: string[];
  sensitivities?: string[];
  budget?: string;
  preferredBrands?: string;
  additionalNotes?: string;
}

export type ChangeType = 'reorder' | 'add_step' | 'remove_step';

export interface AdviseRoutineDto {
  changeType: ChangeType;
  currentSteps: string[];
  changeDescription?: string;
  addedStepName?: string;
}

export interface AIAdviceResponse {
  advice: string;
  rating: 'good' | 'neutral' | 'caution';
  emoji: string;
}

export interface FaceZone {
  id: string;
  label: string;
  position: [number, number, number];
  categories: string[];
}

export interface RecommendProductDto {
  stepName: string;
  stepCategory: string;
  stepDescription?: string;
  skinType?: string;
  concerns?: string;
}

export interface ProductRecommendation {
  productName: string;
  brand: string;
  description: string;
  keyIngredients: string[];
  whyRecommended: string;
  estimatedPrice: string;
  purchaseUrl: string;
  qrCodeDataUrl: string;
  rating: 'excellent' | 'good' | 'alternative';
  sourceArticles: { title: string; url: string }[];
}

export interface ShareRoutineDto {
  routineId: string;
  customMessage?: string;
  coverImage?: string;
}
