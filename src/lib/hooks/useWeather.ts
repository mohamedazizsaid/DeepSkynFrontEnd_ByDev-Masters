// Hook pour gérer l'état et la logique du widget météo
import { useState, useEffect } from 'react';
import { WeatherData, AIAdviceResponse, fetchCompleteWeatherData } from '../services/weather.service';

export interface WeatherState {
  weather: WeatherData | null;
  advice: AIAdviceResponse | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export const useWeather = (autoFetch = true) => {
  const [state, setState] = useState<WeatherState>({
    weather: null,
    advice: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchWeather = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { weather, advice } = await fetchCompleteWeatherData();
      setState({
        weather,
        advice,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  };

  const refreshWeather = async () => {
    await fetchWeather();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchWeather();
      // Rafraîchir toutes les 10 minutes
      const interval = setInterval(fetchWeather, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoFetch]);

  return {
    ...state,
    fetchWeather,
    refreshWeather,
  };
};
