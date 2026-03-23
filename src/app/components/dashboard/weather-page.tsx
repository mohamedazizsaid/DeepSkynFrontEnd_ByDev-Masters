// Page de dashboard pour le widget météo complet
'use client';

import React from 'react';
import { motion } from 'motion/react';
import WeatherDashboard from '../../../components/weather/weather-dashboard';

interface WeatherPageProps {
  onBack?: () => void;
}

export function WeatherPage({ onBack }: WeatherPageProps) {
  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🌤️ Météo & Conseils
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Découvrez la météo en temps réel et des conseils de soins de la peau personnalisés générés par IA
          </p>
        </div>

        {/* Widget météo */}
        <WeatherDashboard />
      </motion.div>
    </div>
  );
}
