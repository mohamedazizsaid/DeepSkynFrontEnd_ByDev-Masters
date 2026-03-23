// Composant pour afficher la méteo compacte dans la navbar
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, AlertCircle } from 'lucide-react';
import { useWeather } from '@/lib/hooks/useWeather';
import { showWeatherAdviceToast } from './weather-advice-toast';

interface WeatherNavbarProps {
  className?: string;
}

const WeatherNavbar: React.FC<WeatherNavbarProps> = ({ className = '' }) => {
  const { weather, advice, loading, error } = useWeather(true);
  const [showPopup, setShowPopup] = useState(false);

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
        onClick={() => setShowPopup(!showPopup)}
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
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div
              className={`p-4 text-white transition ${
                weather.weatherCode === 0 || weather.weatherCode === 1
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-400'
                  : weather.weatherCode >= 51 && weather.weatherCode <= 82
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-3xl font-bold">{Math.round(weather.temperature)}°C</div>
                  <div className="text-sm opacity-90">
                    {weather.city && `${weather.city}, `}
                    {weather.country}
                  </div>
                </div>
                <div className="text-4xl">{getWeatherIcon()}</div>
              </div>
              <div className="text-sm opacity-90">
                Ressenti: {Math.round(weather.feelsLike)}°C
              </div>
            </div>

            {/* Détails */}
            <div className="p-4 space-y-3">
              {/* Ligne 1: Humidité & Pression */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <div className="text-xs">
                    <div className="text-gray-600 dark:text-gray-400">Humidité</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {weather.humidity}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Wind className="w-4 h-4 text-teal-500" />
                  <div className="text-xs">
                    <div className="text-gray-600 dark:text-gray-400">Vent</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {Math.round(weather.windSpeed)} km/h
                    </div>
                  </div>
                </div>
              </div>

              {/* Ligne 2: UV & Visibilité */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <div className="text-xs">
                    <div className="text-gray-600 dark:text-gray-400">Indice UV</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {weather.uvIndex}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <div className="text-xs">
                    <div className="text-gray-600 dark:text-gray-400">Visibilité</div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {weather.visibility ? `${Math.round(weather.visibility / 1000)} km` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lever/Coucher du soleil */}
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>🌅 Lever: {new Date(weather.sunrise).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>🌇 Coucher: {new Date(weather.sunset).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Conseil IA */}
              {advice && (
                <motion.button
                  onClick={handleShowAdvice}
                  className="w-full p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {advice.emoji} Conseil IA
                </motion.button>
              )}
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
