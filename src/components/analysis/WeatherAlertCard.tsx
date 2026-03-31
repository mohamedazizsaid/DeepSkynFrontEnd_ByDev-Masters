import React, { useEffect } from 'react';
import { Sun, Wind, Droplets, Thermometer, AlertTriangle, RefreshCw, MapPin, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { useContextualAnalysis } from '../../hooks/useContextualAnalysis';

interface WeatherAlertCardProps {
  onAlertGenerated?: (hasAlert: boolean) => void;
  className?: string;
}

export const WeatherAlertCard: React.FC<WeatherAlertCardProps> = ({
  onAlertGenerated,
  className = '',
}) => {
  const {
    weatherAlert,
    weatherLoading,
    weatherError,
    fetchWeatherAlert,
  } = useContextualAnalysis();

  useEffect(() => {
    fetchWeatherAlert();
  }, [fetchWeatherAlert]);

  useEffect(() => {
    if (onAlertGenerated && weatherAlert) {
      onAlertGenerated(!!weatherAlert.alert);
    }
  }, [weatherAlert, onAlertGenerated]);

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          badge: 'bg-red-500',
          icon: 'text-red-500',
        };
      case 'medium':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          badge: 'bg-orange-500',
          icon: 'text-orange-500',
        };
      default:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          badge: 'bg-yellow-500',
          icon: 'text-yellow-500',
        };
    }
  };

  const getProtectionLevelColor = (level: string) => {
    switch (level) {
      case 'extreme':
        return 'bg-purple-500';
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      default:
        return 'bg-green-500';
    }
  };

  const getProtectionLevelLabel = (level: string) => {
    switch (level) {
      case 'extreme':
        return 'Protection extrême requise';
      case 'high':
        return 'Protection élevée recommandée';
      case 'medium':
        return 'Protection modérée';
      default:
        return 'Protection légère';
    }
  };

  const getUvLevel = (uv: number): { label: string; color: string } => {
    if (uv >= 11) return { label: 'Extrême', color: 'text-purple-600' };
    if (uv >= 8) return { label: 'Très élevé', color: 'text-red-600' };
    if (uv >= 6) return { label: 'Élevé', color: 'text-orange-600' };
    if (uv >= 3) return { label: 'Modéré', color: 'text-yellow-600' };
    return { label: 'Faible', color: 'text-green-600' };
  };

  const getAqiLevel = (aqi: number): { label: string; color: string } => {
    if (aqi > 100) return { label: 'Très mauvais', color: 'text-red-600' };
    if (aqi > 75) return { label: 'Mauvais', color: 'text-orange-600' };
    if (aqi > 50) return { label: 'Moyen', color: 'text-yellow-600' };
    return { label: 'Bon', color: 'text-green-600' };
  };

  if (weatherLoading) {
    return (
      <div className={`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600 dark:text-gray-300">
            Analyse météo en cours avec l'IA...
          </span>
        </div>
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className={`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3 text-gray-500">
          <AlertTriangle className="w-5 h-5" />
          <span>{weatherError}</span>
          <button
            onClick={fetchWeatherAlert}
            className="ml-auto text-blue-500 hover:text-blue-600 flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  if (!weatherAlert) {
    return null;
  }

  const { weather, location, alert, aiAdvice } = weatherAlert;
  const uvLevel = getUvLevel(weather.uvIndex);

  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${className}`}>
      {/* Header with weather data */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">
              {location.city || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
            </span>
            <span className="text-xs opacity-75">• Données en temps réel</span>
          </div>
          <button
            onClick={fetchWeatherAlert}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* UV Index */}
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5" />
            <div>
              <div className="text-sm opacity-80">Indice UV</div>
              <div className="font-bold">{weather.uvIndex.toFixed(1)}</div>
            </div>
          </div>

          {/* AQI */}
          {weather.aqi !== null && (
            <div className="flex items-center space-x-2">
              <Wind className="w-5 h-5" />
              <div>
                <div className="text-sm opacity-80">Qualité air</div>
                <div className="font-bold">{weather.aqi}</div>
              </div>
            </div>
          )}

          {/* Humidity */}
          {weather.humidity !== null && (
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5" />
              <div>
                <div className="text-sm opacity-80">Humidité</div>
                <div className="font-bold">{weather.humidity}%</div>
              </div>
            </div>
          )}

          {/* Temperature */}
          {weather.temperature !== null && (
            <div className="flex items-center space-x-2">
              <Thermometer className="w-5 h-5" />
              <div>
                <div className="text-sm opacity-80">Température</div>
                <div className="font-bold">{weather.temperature.toFixed(1)}°C</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status indicators */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${uvLevel.color} bg-gray-100 dark:bg-gray-700`}>
            UV: {uvLevel.label}
          </span>
          {weather.aqi !== null && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAqiLevel(weather.aqi).color} bg-gray-100 dark:bg-gray-700`}>
              Air: {getAqiLevel(weather.aqi).label}
            </span>
          )}
          {aiAdvice && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getProtectionLevelColor(aiAdvice.protectionLevel)}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              {getProtectionLevelLabel(aiAdvice.protectionLevel)}
            </span>
          )}
        </div>
      </div>

      {/* AI-Powered Advice Section */}
      {aiAdvice && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b border-purple-100 dark:border-purple-800">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              Conseils IA personnalisés
            </span>
          </div>
          
          {/* Personalized Message */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {aiAdvice.personalizedMessage}
          </p>

          {/* Skin Care Routine */}
          {aiAdvice.skinCareRoutine.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Routine recommandée
              </h4>
              <ul className="space-y-1">
                {aiAdvice.skinCareRoutine.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Products to Use */}
          {aiAdvice.productsToUse.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {aiAdvice.productsToUse.map((product, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 shadow-sm"
                >
                  {product}
                </span>
              ))}
            </div>
          )}

          {/* Warnings */}
          {aiAdvice.warnings.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              {aiAdvice.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert message */}
      {alert ? (
        <div className={`p-4 ${getSeverityColors(alert.severity).bg} border-l-4 ${getSeverityColors(alert.severity).border}`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getSeverityColors(alert.severity).icon}`} />
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getSeverityColors(alert.severity).badge}`}>
                  {alert.severity === 'high' ? 'URGENT' : alert.severity === 'medium' ? 'ATTENTION' : 'INFO'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {alert.type === 'uv' ? '☀️ UV' : alert.type === 'pollution' ? '💨 Pollution' : '💧 Humidité'}
                </span>
              </div>
              <p className={`text-sm ${getSeverityColors(alert.severity).text}`}>
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-green-50 dark:bg-green-950/30">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✨</span>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Conditions météo favorables pour ta peau aujourd'hui ! N'oublie pas ta protection solaire quotidienne.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
