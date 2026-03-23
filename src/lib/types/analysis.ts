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
