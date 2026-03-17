// ─── Auth Types ───
export interface LoginRequest {
  username: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  tokens?: TokenResponse;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleTokenRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

export interface UserProfile {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  avatar?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt?: string;
}

export interface TwoFactorGenerateResponse {
  secret: string;
  qrCode: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
}

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

// ─── Analysis Types ───
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Detailed sub-score from Gemini AI analysis */
export interface DetailedMetricScore {
  score: number;
  description: string;
}

/** Full result structure returned by Gemini skin analysis */
export interface GeminiAnalysisResult {
  skinType: string;
  skinAge: number;
  healthScore: number;
  conditions: string[];
  concerns: string[];
  recommendations: {
    products: string[];
    ingredients: string[];
    lifestyle: string[];
    warnings: string[];
  };
  detailedAnalysis: {
    hydration: DetailedMetricScore;
    texture: DetailedMetricScore;
    pores: DetailedMetricScore;
    pigmentation: DetailedMetricScore;
    wrinkles: DetailedMetricScore;
    acne: DetailedMetricScore;
    redness: DetailedMetricScore;
    elasticity: DetailedMetricScore;
  };
  fitzpatrickType: number;
  summary: string;
}

export interface Analysis {
  id: string;
  userId: string;
  images: string[];
  questionnaire: Record<string, unknown> | null;
  results: GeminiAnalysisResult | null;
  healthScore: number | null;
  skinAge: number | null;
  conditions: string[];
  recommendations: {
    products: string[];
    ingredients: string[];
    lifestyle: string[];
    warnings: string[];
  } | null;
  status: AnalysisStatus;
  processingTime: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Response from GET /analyses/stats */
export interface AnalysisStats {
  totalAnalyses: number;
  averageHealthScore: number;
  healthScoreHistory: Array<{ date: string; score: number }>;
  commonConditions: string[];
}

/** Response from GET /analyses/compare */
export interface AnalysisComparison {
  analysis1: Analysis;
  analysis2: Analysis;
  comparison: {
    healthScoreChange: number;
    skinAgeChange: number;
    newConditions: string[];
    resolvedConditions: string[];
  };
}

/** Response shape from GET /analyses (paginated) */
export interface AnalysisListResponse {
  analyses: Analysis[];
  total: number;
}

/** Request DTO for POST /analyses/scan */
export interface RealTimeScanDto {
  image: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  saveImage?: boolean;
  saveAnalysis?: boolean;
}

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

// ─── Chat Types ───
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatHistory {
  id: string;
  userId: string;
  message: string;
  imageUrl: string | null;
  modelUsed: string | null;
  assistantResponse: string | null;
  messages: ChatMessage[] | null;
  context: Record<string, unknown> | null;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageDto {
  message: string;
  chatId?: string;
  context?: Record<string, unknown>;
}

// ─── Subscription Types ───
export type SubscriptionPlan = 'free' | 'premium' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  autoRenew: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  features: string[];
}

// ─── Post / Community Types ───
export interface Post {
  id: string;
  userId: string;
  media: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; avatar: string | null };
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
}

export interface CreatePostDto {
  message: string;
  media?: string;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; avatar: string | null };
}

export interface CreateCommentDto {
  postId: string;
  comment: string;
}

// ─── Notification Types ───
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Paginated Response ───
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
