import { useState, useCallback, useEffect } from 'react';
import {
  contextualAnalysisService,
  type WeatherAlertResponse,
  type SeasonalPrediction,
  type SkinDailyLog,
  type CreateSkinLogDto,
  type SkinAlert,
} from '../lib/services';

interface UseContextualAnalysisReturn {
  // Weather Alert
  weatherAlert: WeatherAlertResponse | null;
  weatherLoading: boolean;
  weatherError: string | null;
  fetchWeatherAlert: () => Promise<void>;

  // Unread Alerts
  unreadAlerts: SkinAlert[];
  unreadCount: number;
  alertsLoading: boolean;
  alertsError: string | null;
  fetchUnreadAlerts: () => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Seasonal Prediction
  seasonalPrediction: SeasonalPrediction | null;
  predictionLoading: boolean;
  predictionError: string | null;
  fetchSeasonalPrediction: () => Promise<void>;

  // Skin Logs
  skinLogs: SkinDailyLog[];
  logsLoading: boolean;
  logsError: string | null;
  createSkinLog: (dto: CreateSkinLogDto) => Promise<SkinDailyLog | null>;
  fetchSkinLogs: (days?: number) => Promise<void>;
}

export function useContextualAnalysis(): UseContextualAnalysisReturn {
  // Weather Alert state
  const [weatherAlert, setWeatherAlert] = useState<WeatherAlertResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Alerts state
  const [unreadAlerts, setUnreadAlerts] = useState<SkinAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Seasonal Prediction state
  const [seasonalPrediction, setSeasonalPrediction] = useState<SeasonalPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Skin Logs state
  const [skinLogs, setSkinLogs] = useState<SkinDailyLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  /**
   * Fetch weather alert using browser geolocation
   */
  const fetchWeatherAlert = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Try to get city name via reverse geocoding (optional)
      let city: string | undefined;
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        );
        const geoData = await geoResponse.json();
        city = geoData.address?.city || geoData.address?.town || geoData.address?.village;
      } catch {
        // Ignore geocoding errors
      }

      const response = await contextualAnalysisService.getWeatherAlert(
        latitude,
        longitude,
        city,
      );

      setWeatherAlert(response);
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setWeatherError('Accès à la géolocalisation refusé. Activez-la dans vos paramètres.');
            break;
          case error.POSITION_UNAVAILABLE:
            setWeatherError('Position non disponible.');
            break;
          case error.TIMEOUT:
            setWeatherError('Délai de géolocalisation dépassé.');
            break;
        }
      } else {
        setWeatherError('Impossible de récupérer les données météo.');
      }
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  /**
   * Fetch unread alerts
   */
  const fetchUnreadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);

    try {
      const response = await contextualAnalysisService.getUnreadAlerts();
      setUnreadAlerts(response.alerts);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      setAlertsError('Impossible de récupérer les alertes.');
      console.error('Failed to fetch alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  /**
   * Mark a single alert as read
   */
  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await contextualAnalysisService.markAlertAsRead(alertId);
      setUnreadAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }, []);

  /**
   * Mark all alerts as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await contextualAnalysisService.markAllAlertsAsRead();
      setUnreadAlerts([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  }, []);

  /**
   * Fetch seasonal prediction
   */
  const fetchSeasonalPrediction = useCallback(async () => {
    setPredictionLoading(true);
    setPredictionError(null);

    try {
      const response = await contextualAnalysisService.getSeasonalPrediction();
      setSeasonalPrediction(response);
    } catch (error) {
      setPredictionError('Impossible de générer la prédiction saisonnière.');
      console.error('Failed to fetch seasonal prediction:', error);
    } finally {
      setPredictionLoading(false);
    }
  }, []);

  /**
   * Create a skin log
   */
  const createSkinLog = useCallback(async (dto: CreateSkinLogDto): Promise<SkinDailyLog | null> => {
    try {
      const log = await contextualAnalysisService.createSkinLog(dto);
      setSkinLogs((prev) => [log, ...prev.filter((l) => l.id !== log.id)]);
      // Refresh prediction after logging
      fetchSeasonalPrediction();
      return log;
    } catch (error) {
      console.error('Failed to create skin log:', error);
      return null;
    }
  }, [fetchSeasonalPrediction]);

  /**
   * Fetch skin logs history
   */
  const fetchSkinLogs = useCallback(async (days: number = 30) => {
    setLogsLoading(true);
    setLogsError(null);

    try {
      const logs = await contextualAnalysisService.getSkinLogs(days);
      setSkinLogs(logs);
    } catch (error) {
      setLogsError('Impossible de récupérer l\'historique.');
      console.error('Failed to fetch skin logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  return {
    // Weather
    weatherAlert,
    weatherLoading,
    weatherError,
    fetchWeatherAlert,
    // Alerts
    unreadAlerts,
    unreadCount,
    alertsLoading,
    alertsError,
    fetchUnreadAlerts,
    markAsRead,
    markAllAsRead,
    // Prediction
    seasonalPrediction,
    predictionLoading,
    predictionError,
    fetchSeasonalPrediction,
    // Logs
    skinLogs,
    logsLoading,
    logsError,
    createSkinLog,
    fetchSkinLogs,
  };
}
