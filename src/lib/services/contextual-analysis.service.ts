import apiClient from '../api-client';

// Types
export interface WeatherData {
  uvIndex: number;
  aqi: number | null;
  humidity: number | null;
  temperature: number | null;
  weatherCode?: number;
  weatherDescription?: string;
}

export interface AIAdvice {
  personalizedMessage: string;
  skinCareRoutine: string[];
  productsToUse: string[];
  warnings: string[];
  protectionLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export interface SkinAlert {
  id: string;
  type: 'uv' | 'pollution' | 'seasonal' | 'humidity';
  message: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  date: string;
  metadata?: Record<string, unknown>;
}

export interface WeatherAlertResponse {
  alert: SkinAlert | null;
  weather: WeatherData;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  aiAdvice?: AIAdvice;
}

export interface UnreadAlertsResponse {
  alerts: SkinAlert[];
  unreadCount: number;
}

export interface PaginatedAlertsResponse {
  alerts: SkinAlert[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SeasonalPrediction {
  currentMonth: string;
  currentScore: number | null;
  lastYearScore: number | null;
  prediction: {
    message: string;
    recommendations: string[];
    trend: 'improving' | 'declining' | 'stable' | 'new';
  };
  historicalData: Array<{
    month: string;
    year: number;
    score: number;
    dominantIssue: string | null;
  }>;
}

export interface SkinDailyLog {
  id: string;
  conditionScore: number;
  notes?: string;
  concerns: string[];
  date: string;
}

export interface CreateSkinLogDto {
  conditionScore: number;
  notes?: string;
  concerns?: string[];
}

export const contextualAnalysisService = {
  /**
   * Get weather alert based on user location
   */
  async getWeatherAlert(
    latitude: number,
    longitude: number,
    city?: string,
    country?: string,
  ): Promise<WeatherAlertResponse> {
    const params: Record<string, string | number> = { latitude, longitude };
    if (city) params.city = city;
    if (country) params.country = country;

    const res = await apiClient.get<WeatherAlertResponse>(
      '/contextual-analysis/weather-alert',
      { params },
    );
    return res.data;
  },

  /**
   * Get all unread skin alerts
   */
  async getUnreadAlerts(): Promise<UnreadAlertsResponse> {
    const res = await apiClient.get<UnreadAlertsResponse>(
      '/contextual-analysis/alerts',
    );
    return res.data;
  },

  /**
   * Get all alerts with pagination
   */
  async getAllAlerts(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedAlertsResponse> {
    const res = await apiClient.get<PaginatedAlertsResponse>(
      '/contextual-analysis/alerts/all',
      { params: { page, limit } },
    );
    return res.data;
  },

  /**
   * Mark a specific alert as read
   */
  async markAlertAsRead(alertId: string): Promise<SkinAlert> {
    const res = await apiClient.patch<SkinAlert>(
      `/contextual-analysis/alerts/${alertId}/read`,
    );
    return res.data;
  },

  /**
   * Mark all alerts as read
   */
  async markAllAlertsAsRead(): Promise<{ message: string }> {
    const res = await apiClient.patch<{ message: string }>(
      '/contextual-analysis/alerts/read-all',
    );
    return res.data;
  },

  /**
   * Get seasonal prediction based on historical data
   */
  async getSeasonalPrediction(): Promise<SeasonalPrediction> {
    const res = await apiClient.get<SeasonalPrediction>(
      '/contextual-analysis/seasonal-prediction',
    );
    return res.data;
  },

  /**
   * Log daily skin condition
   */
  async createSkinLog(dto: CreateSkinLogDto): Promise<SkinDailyLog> {
    const res = await apiClient.post<SkinDailyLog>(
      '/contextual-analysis/skin-log',
      dto,
    );
    return res.data;
  },

  /**
   * Get skin logs history
   */
  async getSkinLogs(days: number = 30): Promise<SkinDailyLog[]> {
    const res = await apiClient.get<SkinDailyLog[]>(
      '/contextual-analysis/skin-logs',
      { params: { days } },
    );
    return res.data;
  },
};
