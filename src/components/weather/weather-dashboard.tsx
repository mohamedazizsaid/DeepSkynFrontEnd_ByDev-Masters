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
      {/* Carte principale météo - Plus grande et détaillée */}
      <div className={`relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br ${getWeatherGradient()} text-white`}>
        {/* Éléments décoratifs animés */}
        <motion.div
          className="absolute top-4 right-4 opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-48 h-48" />
        </motion.div>

        <div className="relative z-10 p-12 md:p-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            {/* Section gauche - Principal avec plus de détails */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-8 flex-1"
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
                    <Loader className="w-32 h-32 opacity-50" />
                  </motion.div>
                ) : (
                  <div className="text-7xl">
                    {getWeatherIcon()}
                  </div>
                )}
              </motion.div>

              <div className="space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="text-8xl font-bold leading-none"
                >
                  {weather ? `${Math.round(weather.temperature)}°` : '--°'}
                </motion.div>
                {weather && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="text-2xl font-semibold opacity-90">
                      Ressenti {Math.round(weather.feelsLike)}°C
                    </div>
                    <div className="text-lg opacity-80">
                      {weather.weatherCode === 0 || weather.weatherCode === 1 ? '☀️ Ensoleillé' : weather.weatherCode === 2 || weather.weatherCode === 3 ? '☁️ Nuageux' : weather.weatherCode >= 51 && weather.weatherCode <= 82 ? '🌧️ Pluvieux' : '🌤️ Variable'}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Section droite - Localisation & Infos avec boutons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-right md:text-right"
            >
              {weather && (
                <>
                  <div className="text-3xl font-bold mb-2">
                    {weather.city && `${weather.city}, `}
                    {weather.country}
                  </div>
                  <div className="text-lg opacity-85 mb-6">
                    {new Date().toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-end gap-3 opacity-90">
                      <span className="text-sm">Température réelle: {Math.round(weather.temperature)}°C</span>
                    </div>
                    <div className="flex items-center justify-end gap-3 opacity-90">
                      <span className="text-sm">Humidité: {weather.humidity}%</span>
                    </div>
                  </div>
                  {weather.humidity && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={handleRefresh}
                      disabled={loading}
                      className="px-6 py-3 bg-white/25 hover:bg-white/35 backdrop-blur-sm rounded-xl transition disabled:opacity-50 font-semibold flex items-center gap-2 justify-center"
                    >
                      <RefreshCw
                        className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                      />
                      {loading ? 'Actualisation...' : 'Actualiser'}
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Grille de détails - Plus grande et détaillée */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Humidité */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-8 shadow-lg border border-blue-200 dark:border-blue-700 cursor-pointer hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Humidité
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Confort cutané</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-3"
            >
              {weather.humidity}%
            </motion.div>
            <div className="space-y-2">
              <div className="h-3 bg-white/50 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weather.humidity}%` }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {weather.humidity < 30 ? '⚠️ Très sec' : weather.humidity < 50 ? '✓ Optimal' : weather.humidity < 70 ? '✓ Bon' : '⚠️ Humide'}
              </p>
            </div>
          </motion.div>

          {/* Vent */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 rounded-2xl p-8 shadow-lg border border-teal-200 dark:border-teal-700 cursor-pointer hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Vent
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Barrière lipidique</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Wind className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-3"
            >
              {Math.round(weather.windSpeed)}
            </motion.div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">km/h</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round(weather.windSpeed) < 10 ? '✓ Calme' : Math.round(weather.windSpeed) < 30 ? '⚠️ Modéré' : '⚠️ Venteux'}
              </p>
            </div>
          </motion.div>

          {/* Indice UV */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl p-8 shadow-lg border border-yellow-200 dark:border-yellow-700 cursor-pointer hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Indice UV
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Protection requise</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-3"
            >
              {weather.uvIndex}
            </motion.div>
            <div className="space-y-2">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < weather.uvIndex ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {weather.uvIndex < 3
                  ? 'Faible'
                  : weather.uvIndex < 6
                    ? 'Modéré'
                    : weather.uvIndex < 8
                      ? 'Élevé'
                      : 'Très élevé'}
              </p>
            </div>
          </motion.div>

          {/* Visibilité */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-700 cursor-pointer hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  Visibilité
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Qualité de l'air</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-3"
            >
              {weather.visibility ? Math.round(weather.visibility / 1000) : 'N/A'}
            </motion.div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">km</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {weather.visibility ? (Math.round(weather.visibility / 1000) > 20 ? '✓ Excellente' : '⚠️ Polluée') : 'N/A'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Lever et Coucher du soleil + Infos détaillées */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Lever du soleil */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white rounded-2xl p-8 shadow-xl border border-orange-400/30 hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">Lever du soleil</p>
                <p className="text-xs opacity-75 mt-1">Premier rayons</p>
              </div>
              <Sunrise className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-5xl font-bold mb-3">
              {new Date(weather.sunrise).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <p className="text-xs opacity-80">
              {new Date(weather.sunrise).toLocaleDateString('fr-FR', { weekday: 'long' })}
            </p>
          </motion.div>

          {/* Coucher du soleil */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-red-400 via-purple-500 to-indigo-600 text-white rounded-2xl p-8 shadow-xl border border-purple-400/30 hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">Coucher du soleil</p>
                <p className="text-xs opacity-75 mt-1">Fin du jour</p>
              </div>
              <Sunset className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-5xl font-bold mb-3">
              {new Date(weather.sunset).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <p className="text-xs opacity-80">
              {new Date(weather.sunset).toLocaleDateString('fr-FR', { weekday: 'long' })}
            </p>
          </motion.div>

          {/* Pression atmosphérique */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-indigo-500 via-blue-600 to-teal-500 text-white rounded-2xl p-8 shadow-xl border border-indigo-400/30 hover:shadow-2xl transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">Pression</p>
                <p className="text-xs opacity-75 mt-1">Atmosphérique</p>
              </div>
              <Gauge className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-5xl font-bold mb-3">{Math.round(weather.pressure)}</div>
            <div className="space-y-2">
              <p className="text-sm opacity-90">hPa</p>
              <p className="text-xs opacity-75">
                {Math.round(weather.pressure) > 1013 ? 'Haute pression 🔆' : 'Basse pression 🌧️'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Conseil IA - Plus détaillé */}
      <AnimatePresence>
        {advice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5 }}
            className={`rounded-2xl p-8 shadow-xl border-l-4 ${
              advice.urgency === 'high'
                ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-500'
                : advice.urgency === 'medium'
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-500'
                  : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-500'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl flex-shrink-0">{advice.emoji}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-2xl mb-1">Conseil IA personnalisé</h3>
                    <span
                      className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                        advice.urgency === 'high'
                          ? 'bg-red-500 text-white'
                          : advice.urgency === 'medium'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                      }`}
                    >
                      {advice.urgency === 'high' ? 'Urgent' : advice.urgency === 'medium' ? 'Recommandé' : 'Info'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4 text-base">
                  {advice.advice}
                </p>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleShowAdvice}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                >
                  ✨ Voir les détails complets
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeatherDashboard;
