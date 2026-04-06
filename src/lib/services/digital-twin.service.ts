import apiClient from '../api-client';

export interface DigitalTwin {
  id: string;
  userId: string;
  snapshotCount: number;
  confidence: number;
  currentState: any;
  trendAnalysis: any;
  improvementRate: number;
  seasonalPatterns: any;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkinSnapshot {
  id: string;
  digitalTwinId: string;
  analysisId: string;
  skinConditions: any;
  environmentalData: any;
  capturedAt: string;
}

export interface SkinPrediction {
  id: string;
  digitalTwinId: string;
  predictionType: 'SEVEN_DAY' | 'FOURTEEN_DAY' | 'THIRTY_DAY';
  predictedState: any;
  confidence: number;
  aiModel: string;
  validUntil: string;
  createdAt: string;
}

export interface ProductSimulation {
  id: string;
  digitalTwinId: string;
  productName: string;
  productCategory: string;
  ingredients: string[];
  simulationPeriod: number;
  predictedChanges: any;
  successProbability: number;
  riskFactors: string[];
  recommendations: string[];
  createdAt: string;
}

export interface SkinJourneyResponse {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
  latestAnalysis: {
    id: string;
    healthScore: number;
    skinAge: number;
    conditions: string[];
    createdAt: string;
  } | null;
  digitalTwin: {
    enabled: boolean;
    snapshotCount: number;
    confidence: number;
    predictionsUnlocked: boolean;
    currentState: any;
    trendAnalysis: any;
    improvementRate: number;
    lastUpdated: string;
    insights: string[];
  };
  predictiveRoutine: {
    id: string;
    status: 'PENDING' | 'VIEWED' | 'ACCEPTED';
    routine: any;
    twinEnhanced: boolean;
    confidence: number;
    generatedAt: string;
    expiresAt: string;
  } | null;
  activeRoutine: {
    id: string;
    name: string;
    type: string;
    steps: any;
    isActive: boolean;
    currentDay: number;
  } | null;
  systemState: 'NEW_USER' | 'BUILDING_TWIN' | 'TWIN_READY' | 'PREDICTIONS_UNLOCKED' | 'HIGH_CONFIDENCE';
  insights: string[];
  recommendations: {
    nextScan: string | null;
    actionItems: string[];
  };
}

export interface CreatePredictionRequest {
  predictionType: 'SEVEN_DAY' | 'FOURTEEN_DAY' | 'THIRTY_DAY';
  includeRoutineEffects?: boolean;
}

export interface SimulateProductRequest {
  productName: string;
  productCategory: string;
  productIngredients: string[];
  simulationPeriod?: number; // days, default 14
}

export const digitalTwinService = {
  // Endpoint unifié - Point d'entrée principal
  async getSkinJourney(): Promise<SkinJourneyResponse> {
    const res = await apiClient.get<SkinJourneyResponse>('/user/skin-journey');
    return res.data;
  },

  // Digital Twin operations
  async getOrCreateTwin(): Promise<DigitalTwin> {
    const res = await apiClient.get<DigitalTwin>('/digital-twin');
    return res.data;
  },

  async getSnapshots(limit = 30): Promise<SkinSnapshot[]> {
    const res = await apiClient.get<SkinSnapshot[]>('/digital-twin/snapshots', {
      params: { limit },
    });
    return res.data;
  },

  async getTwin(): Promise<DigitalTwin> {
    const res = await apiClient.get<DigitalTwin>('/digital-twin');
    return res.data;
  },

  // Predictions
  async createPrediction(request: CreatePredictionRequest): Promise<SkinPrediction> {
    const res = await apiClient.post<SkinPrediction>('/digital-twin/predict', request);
    return res.data;
  },

  async getPredictions(): Promise<SkinPrediction[]> {
    const res = await apiClient.get<SkinPrediction[]>('/digital-twin/predictions');
    return res.data;
  },

  async getPrediction(id: string): Promise<SkinPrediction> {
    const res = await apiClient.get<SkinPrediction>(`/digital-twin/predictions/${id}`);
    return res.data;
  },

  // Product Simulation
  async simulateProduct(request: SimulateProductRequest): Promise<ProductSimulation> {
    const res = await apiClient.post<ProductSimulation>('/digital-twin/simulate-product', request);
    return res.data;
  },

  async getSimulations(): Promise<ProductSimulation[]> {
    const res = await apiClient.get<ProductSimulation[]>('/digital-twin/simulations');
    return res.data;
  },

  async getSimulation(id: string): Promise<ProductSimulation> {
    const res = await apiClient.get<ProductSimulation>(`/digital-twin/simulations/${id}`);
    return res.data;
  },

  // Twin management
  async updateTwin(data: Partial<DigitalTwin>): Promise<DigitalTwin> {
    const res = await apiClient.patch<DigitalTwin>('/digital-twin', data);
    return res.data;
  },

  async deleteTwin(): Promise<void> {
    await apiClient.delete('/digital-twin');
  },
};