// Widget météo complet pour le dashboard
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Zap,
  RefreshCw,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useWeather } from '@/lib/hooks/useWeather';
import { showWeatherAdviceToast } from './weather-advice-toast';

const WeatherDashboard: React.FC = () => {
  const { weather, advice, loading, error, refreshWeather } = useWeather(true);
  const [showAdvice, setShowAdvice] = useState(false);

  const getWeatherGradient = () => {
    if (!weather) return 'from-blue-400 to-blue-600';

    const code = weather.weatherCode;
    if (code === 0 || code === 1) return 'from-yellow-300 via-orange-400 to-orange-500';
    if (code === 2 || code === 3) return 'from-gray-400 to-gray-600';
    if (code >= 51 && code <= 82) return 'from-blue-500 to-blue-700';
    return 'from-indigo-400 to-indigo-600';
  };

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-24 h-24" />;

    const code = weather.weatherCode;
    if (code === 0 || code === 1) return <Sun className="w-24 h-24" />;
    if (code === 2 || code === 3) return <Cloud className="w-24 h-24" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-24 h-24" />;
    return <Cloud className="w-24 h-24" />;
  };

  const handleRefresh = async () => {
    await refreshWeather();
  };

  const handleShowAdvice = () => {
    if (advice) {
      showWeatherAdviceToast(advice.advice, advice.emoji, advice.urgency);
      setShowAdvice(false);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4"
      >
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Erreur météo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Impossible de charger les données météo
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Carte principale météo */}
      <div className={`relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br ${getWeatherGradient()} text-white`}>
        {/* Éléments décoratifs animés */}
        <motion.div
          className="absolute top-4 right-4 opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-32 h-32" />
        </motion.div>

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            {/* Section gauche - Principal */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-6"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Loader className="w-24 h-24 opacity-50" />
                  </motion.div>
                ) : (
                  getWeatherIcon()
                )}
              </motion.div>

              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="text-7xl font-bold"
                >
                  {weather ? `${Math.round(weather.temperature)}°` : '--°'}
                </motion.div>
                {weather && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg opacity-90 mt-2"
                  >
                    Ressenti {Math.round(weather.feelsLike)}°C
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Section droite - Localisation & Boutons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-right"
            >
              {weather && (
                <>
                  <div className="text-2xl font-semibold">
                    {weather.city && `${weather.city}, `}
                    {weather.country}
                  </div>
                  <div className="text-sm opacity-80 mt-2">
                    {new Date().toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {weather.humidity && (
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`}
                      />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Grille de détails */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Humidité */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                Humidité
              </span>
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {weather.humidity}%
            </motion.div>
            <div className="mt-2 h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${weather.humidity}%` }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
              />
            </div>
          </motion.div>

          {/* Vent */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">Vent</span>
              <Wind className="w-5 h-5 text-teal-500" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {Math.round(weather.windSpeed)}
            </motion.div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">km/h</div>
          </motion.div>

          {/* Indice UV */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                Indice UV
              </span>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {weather.uvIndex}
            </motion.div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {weather.uvIndex < 3
                ? 'Faible'
                : weather.uvIndex < 6
                  ? 'Modéré'
                  : weather.uvIndex < 8
                    ? 'Élevé'
                    : 'Très élevé'}
            </div>
          </motion.div>

          {/* Visibilité */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                Visibilité
              </span>
              <Eye className="w-5 h-5 text-purple-500" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {weather.visibility ? Math.round(weather.visibility / 1000) : 'N/A'}
            </motion.div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">km</div>
          </motion.div>
        </motion.div>
      )}

      {/* Lever et Coucher du soleil */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Lever du soleil */}
          <div className="bg-gradient-to-br from-orange-300 to-orange-500 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Sunrise className="w-6 h-6" />
              <span className="font-semibold">Lever du soleil</span>
            </div>
            <div className="text-3xl font-bold">
              {new Date(weather.sunrise).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Coucher du soleil */}
          <div className="bg-gradient-to-br from-red-400 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Sunset className="w-6 h-6" />
              <span className="font-semibold">Coucher du soleil</span>
            </div>
            <div className="text-3xl font-bold">
              {new Date(weather.sunset).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Pression */}
          <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Gauge className="w-6 h-6" />
              <span className="font-semibold">Pression</span>
            </div>
            <div className="text-3xl font-bold">{Math.round(weather.pressure)}</div>
            <div className="text-xs opacity-90 mt-1">hPa</div>
          </div>
        </motion.div>
      )}

      {/* Conseil IA */}
      <AnimatePresence>
        {advice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5 }}
            className={`rounded-xl p-6 shadow-lg border-l-4 ${
              advice.urgency === 'high'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                : advice.urgency === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-500'
            }`}
          >
            <button
              onClick={() => setShowAdvice(!showAdvice)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {advice.emoji} Conseil IA personnalisé
                  </h3>
                  <AnimatePresence>
                    {showAdvice && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-gray-700 dark:text-gray-300 leading-relaxed"
                      >
                        {advice.advice}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </button>

            {showAdvice && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleShowAdvice}
                className="mt-4 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                Afficher le conseil
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeatherDashboard;
