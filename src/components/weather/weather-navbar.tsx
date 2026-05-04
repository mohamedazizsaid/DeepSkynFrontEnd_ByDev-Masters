// Composant pour afficher la méteo compacte dans la navbar
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, AlertCircle, ArrowRight } from 'lucide-react';
import { useWeather } from '@/lib/hooks/useWeather';
import { showWeatherAdviceToast } from './weather-advice-toast';
import { useAccessibilityStore } from '@/stores/accessibility.store';

interface WeatherNavbarProps {
  className?: string;
}

const WeatherNavbar: React.FC<WeatherNavbarProps> = ({ className = '' }) => {
  const { weather, advice, loading, error, fetchWeather } = useWeather(false);
  const [showPopup, setShowPopup] = useState(false);
  const { t, reduceMotion } = useAccessibilityStore();
  const browserReducedMotion = useReducedMotion();
  const shouldReduceMotion = !!(reduceMotion || browserReducedMotion);

  // Charger météo quand popup s'ouvre
  const handleOpenPopup = () => {
    setShowPopup(true);
    if (!weather && !loading) {
      fetchWeather();
    }
  };

  // Mapper le code météo à une icône
  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-5 h-5" />;

    const code = weather.weatherCode;
    if (code === 0 || code === 1) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (code === 2 || code === 3) return <Cloud className="w-5 h-5 text-gray-400" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />;
    return <Cloud className="w-5 h-5 text-gray-400" />;
  };

  const handleShowAdvice = () => {
    if (advice && advice.advice) {
      showWeatherAdviceToast(advice.advice, advice.emoji, advice.urgency);
    }
  };

  if (error) {
    return (
      <motion.button
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition ${className}`}
        title="Erreur météo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle className="w-5 h-5 text-red-400" />
      </motion.button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bouton météo compacte */}
      <motion.button
        onClick={() => {
          if (!showPopup) {
            handleOpenPopup();
          } else {
            setShowPopup(false);
          }
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition duration-200 ${
          showPopup
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={loading}
      >
        {loading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <Cloud className="w-5 h-5" />
          </motion.div>
        ) : (
          getWeatherIcon()
        )}
        {weather && (
          <span className="text-sm font-semibold">{Math.round(weather.temperature)}°C</span>
        )}
      </motion.button>

      {/* Popup météo détaillé */}
      <AnimatePresence>
        {showPopup && weather && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                    style={{ maxWidth: '720px', width: 'calc(100vw - 40px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div
              className={`p-6 text-white transition ${
                weather.weatherCode === 0 || weather.weatherCode === 1
                  ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500'
                  : weather.weatherCode >= 51 && weather.weatherCode <= 82
                    ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-5xl font-bold mb-2">{Math.round(weather.temperature)}°C</div>
                  <div className="text-base opacity-95 font-semibold">
                    {weather.city && `${weather.city}, `}
                    {weather.country}
                  </div>
                  <div className="text-sm opacity-85 mt-1">
                    Ressenti: {Math.round(weather.feelsLike)}°C
                  </div>
                </div>
                <div className="text-6xl">{getWeatherIcon()}</div>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-white/40"
                />
              </div>
            </div>

            {/* Détails - Layout Horizontal */}
            <div className="p-4 px-6">
              {/* Toutes les métriques en une ligne */}
              <div className="flex flex-wrap gap-3">
                {/* Humidité */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex-1 min-w-[140px] flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600 dark:text-gray-400 font-semibold uppercase text-xs">Humidité</div>
                    <div className="font-bold text-gray-900 dark:text-white">{weather.humidity}%</div>
                  </div>
                </motion.div>

                {/* Vent */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex-1 min-w-[140px] flex items-center gap-2 p-3 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl border border-teal-200 dark:border-teal-700 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Wind className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600 dark:text-gray-400 font-semibold uppercase text-xs">Vent</div>
                    <div className="font-bold text-gray-900 dark:text-white">{Math.round(weather.windSpeed)} km/h</div>
                  </div>
                </motion.div>

                {/* Indice UV */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex-1 min-w-[140px] flex items-center gap-2 p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-700 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600 dark:text-gray-400 font-semibold uppercase text-xs">UV</div>
                    <div className="font-bold text-gray-900 dark:text-white">{weather.uvIndex}</div>
                  </div>
                </motion.div>

                {/* Visibilité */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex-1 min-w-[140px] flex items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700 hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600 dark:text-gray-400 font-semibold uppercase text-xs">Visibilité</div>
                    <div className="font-bold text-gray-900 dark:text-white">{weather.visibility ? `${Math.round(weather.visibility / 1000)} km` : 'N/A'}</div>
                  </div>
                </motion.div>
              </div>

              {/* Lever/Coucher + Conseil */}
              <div className="space-y-3 mt-3">
                <div className="flex gap-3">
                  {/* Lever du soleil */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex-1 min-w-[120px] p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-700 text-center text-sm"
                  >
                    <div className="text-lg mb-1">🌅</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">LEVER</div>
                    <div className="font-bold text-gray-900 dark:text-white text-xs">
                      {new Date(weather.sunrise).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>

                  {/* Coucher du soleil */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex-1 min-w-[120px] p-3 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl border border-pink-200 dark:border-pink-700 text-center text-sm"
                  >
                    <div className="text-lg mb-1">🌇</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-0.5">COUCHER</div>
                    <div className="font-bold text-gray-900 dark:text-white text-xs">
                      {new Date(weather.sunset).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                </div>

                {/* Conseil IA Compact */}
                {advice && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <motion.button
                      onClick={handleShowAdvice}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -1 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                      className="w-full py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-2xl shadow-lg shadow-[#0EA5E9]/20 font-bold text-sm hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all duration-300 flex items-center justify-center gap-3 group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{advice.emoji}</span>
                      <span className="tracking-wide uppercase text-[11px]">{t('weather.aiAdvice') || 'Conseil IA DeepSkyn'}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
        )}
      </AnimatePresence>

      {/* Backdrop pour fermer le popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowPopup(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeatherNavbar;
