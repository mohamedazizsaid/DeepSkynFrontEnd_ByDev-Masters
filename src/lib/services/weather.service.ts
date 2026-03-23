// Service pour consommer l'API Open-Meteo (gratuite, sans clé API)
import apiClient from '../api-client';

export interface WeatherData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  cloudCover: number;
  weatherCode: number;
  precipitation?: number;
  visibility?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  isp?: string;
}

export interface AIAdviceResponse {
  advice: string;
  emoji: string;
  urgency: 'low' | 'medium' | 'high';
}

// Mapper les codes météo WMO vers des descriptions et conditions
const WMO_CODES: { [key: number]: { condition: string; icon: string; description: string } } = {
  0: { condition: 'clear', icon: '☀️', description: 'Dégagé' },
  1: { condition: 'mostly_clear', icon: '🌤️', description: 'Presque dégagé' },
  2: { condition: 'partly_cloudy', icon: '⛅', description: 'Partiellement nuageux' },
  3: { condition: 'overcast', icon: '☁️', description: 'Couvert' },
  45: { condition: 'foggy', icon: '🌫️', description: 'Brouillard' },
  48: { condition: 'foggy', icon: '🌫️', description: 'Brouillard givrant' },
  51: { condition: 'light_rain', icon: '🌧️', description: 'Bruine légère' },
  53: { condition: 'moderate_rain', icon: '🌧️', description: 'Bruine modérée' },
  55: { condition: 'heavy_rain', icon: '🌧️', description: 'Bruine intense' },
  61: { condition: 'light_rain', icon: '🌧️', description: 'Pluie légère' },
  63: { condition: 'moderate_rain', icon: '🌧️', description: 'Pluie modérée' },
  65: { condition: 'heavy_rain', icon: '⛈️', description: 'Pluie intense' },
  71: { condition: 'light_snow', icon: '🌨️', description: 'Neige légère' },
  73: { condition: 'moderate_snow', icon: '🌨️', description: 'Neige modérée' },
  75: { condition: 'heavy_snow', icon: '🌨️', description: 'Neige intense' },
  77: { condition: 'snow_grains', icon: '🌨️', description: 'Grains de neige' },
  80: { condition: 'light_rain_showers', icon: '🌧️', description: 'Averses légères' },
  81: { condition: 'moderate_rain_showers', icon: '🌧️', description: 'Averses modérées' },
  82: { condition: 'heavy_rain_showers', icon: '⛈️', description: 'Averses violentes' },
  85: { condition: 'light_snow_showers', icon: '🌨️', description: 'Averses de neige légères' },
  86: { condition: 'heavy_snow_showers', icon: '🌨️', description: 'Averses de neige intenses' },
  95: { condition: 'thunderstorm', icon: '⛈️', description: 'Orage' },
  96: { condition: 'thunderstorm_hail', icon: '⛈️', description: 'Orage avec grêle' },
  99: { condition: 'thunderstorm_heavy', icon: '⛈️', description: 'Orage violent' },
};

/**
 * Obtenir la position géographique de l'utilisateur
 * Utilise d'abord la Geolocation API du navigateur
 * En fallback, utilise le backend pour détecter via IP (pas de CORS issues)
 */
export const getLocation = async (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    // Essayer d'abord la Geolocation API du navigateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          // Fallback sur le backend pour détection IP
          getLocationFromBackend().then(resolve).catch(reject);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 10000,  // Augmenté de 5s à 10s pour laisser le temps à l'utilisateur 
          maximumAge: 0     // Toujours demander une nouvelle position (pas de cache)
        }
      );
    } else {
      // Fallback sur le backend si Geolocation non disponible
      getLocationFromBackend().then(resolve).catch(reject);
    }
  });
};

/**
 * Détection de position via backend (pas de CORS)
 */
const getLocationFromBackend = async (): Promise<LocationData> => {
  try {
    const response = await apiClient.post('/api/weather/location');
    return {
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      city: response.data.city,
      country: response.data.country,
    };
  } catch (error) {
    console.error('Backend geolocation error:', error);
    // Position par défaut (Tunis comme exemple)
    return {
      latitude: 36.8065,
      longitude: 10.1657,
      city: 'Tunis',
      country: 'Tunisia',
    };
  }
};

/**
 * Obtenir les données météo depuis Open-Meteo
 */
export const getWeatherData = async (latitude: number, longitude: number, city?: string, country?: string): Promise<WeatherData> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,cloud_cover,uv_index,is_day,visibility&daily=sunrise,sunset&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const weatherInfo = WMO_CODES[current.weather_code] || { condition: 'unknown', icon: '🌐', description: 'Inconnu' };

    return {
      latitude,
      longitude,
      city,
      country,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      condition: weatherInfo.condition,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      pressure: current.pressure_msl,
      uvIndex: current.uv_index,
      sunrise: daily.sunrise[0],
      sunset: daily.sunset[0],
      cloudCover: current.cloud_cover,
      weatherCode: current.weather_code,
      visibility: current.visibility,
      precipitation: current.precipitation || 0,
    };
  } catch (error) {
    console.error('Weather data fetch error:', error);
    throw error;
  }
};

/**
 * Obtenir un conseil IA basé sur les données météo
 */
export const getWeatherAdvice = async (weatherData: WeatherData): Promise<AIAdviceResponse> => {
  try {
    const response = await apiClient.post('/api/weather/advice', {
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      uvIndex: weatherData.uvIndex,
      city: weatherData.city || 'Votre localisation',
      country: weatherData.country,
    });
    return response.data;
  } catch (error) {
    console.error('Weather advice error:', error);
    // Fallback avec un conseil générique
    return {
      advice: `À ${weatherData.city || 'votre localisation'}, la température est de ${Math.round(weatherData.temperature)}°C. Prenez soin de vous!`,
      emoji: '🌍',
      urgency: 'low',
    };
  }
};

/**
 * Fonction principale pour obtenir toutes les données météo
 */
export const fetchCompleteWeatherData = async (): Promise<{ weather: WeatherData; advice: AIAdviceResponse }> => {
  const location = await getLocation();
  const weather = await getWeatherData(location.latitude, location.longitude, location.city, location.country);
  const advice = await getWeatherAdvice(weather);
  return { weather, advice };
};
