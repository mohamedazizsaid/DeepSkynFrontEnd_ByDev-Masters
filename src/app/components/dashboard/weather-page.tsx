// Page de dashboard pour le widget météo complet
'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Cloud, Droplets, Wind, Eye, AlertCircle, Sparkles } from 'lucide-react';
import WeatherDashboard from '../../../components/weather/weather-dashboard';

import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { useReducedMotion } from 'motion/react';

interface WeatherPageProps {
  onBack?: () => void;
}

export function WeatherPage({ onBack }: WeatherPageProps) {
  const { reduceMotion } = useAccessibilityStore();
  const browserReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion || browserReducedMotion;

  const pageTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.5 };
  const cardTransition = (idx: number) => shouldReduceMotion ? { duration: 0 } : { delay: 0.4 + idx * 0.1 };
  const hoverScale = shouldReduceMotion ? 1 : 1.05;
  const hoverY = shouldReduceMotion ? 0 : -5;

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={pageTransition}
        className="max-w-7xl mx-auto"
      >
        {/* Widget météo amélioré */}
        <div className="space-y-6 pt-4">
          <WeatherDashboard />
          
          {/* Tips section - Plus grande et détaillée */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: <Droplets className="w-7 h-7" />,
                title: "Humidité",
                description: "Adaptez votre hydratation",
                color: "#06B6D4",
                tips: "L'humidité affecte la barrière cutanée"
              },
              {
                icon: <Wind className="w-7 h-7" />,
                title: "Vent",
                description: "Protégez votre barrière cutanée",
                color: "#0EA5E9",
                tips: "Le vent déshydrate la peau"
              },
              {
                icon: <Eye className="w-7 h-7" />,
                title: "Visibilité",
                description: "Indicateur de pollution",
                color: "#8B5CF6",
                tips: "Pollution = irritation cutanée"
              },
              {
                icon: <Cloud className="w-7 h-7" />,
                title: "Nébulosité",
                description: "Protection UV nécessaire",
                color: "#F59E0B",
                tips: "Les nuages filtrent 30-50% des UV"
              }
            ].map((tip, idx) => (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={cardTransition(idx)}
                whileHover={{ scale: hoverScale, y: hoverY }}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div 
                  className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${tip.color}20`, color: tip.color }}
                >
                  {tip.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                  {tip.title}
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-gray-400 mb-3 leading-relaxed">
                  {tip.description}
                </p>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-500 italic">
                    💡 {tip.tips}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pro Tips - Plus détaillée */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5 }}
            className="rounded-3xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-[#0EA5E9]/5 via-transparent to-[#06B6D4]/5 p-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                💡 Conseils Skincare Personnalisés
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 hover:bg-white/70 dark:hover:bg-gray-800/50 transition">
                  <AlertCircle className="w-6 h-6 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      Adapté à la météo
                    </h3>
                    <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
                      Nos conseils changent en fonction des conditions météorologiques actuelles. Humidité, température et UV - tout est pris en compte.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 hover:bg-white/70 dark:hover:bg-gray-800/50 transition">
                  <Sparkles className="w-6 h-6 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      Basé sur IA
                    </h3>
                    <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
                      Recommandations générées par notre système d'IA avancé Gemini pour une précision maximale.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 hover:bg-white/70 dark:hover:bg-gray-800/50 transition">
                  <Cloud className="w-6 h-6 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      En temps réel
                    </h3>
                    <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
                      Les données météo se mettent à jour toutes les heures pour des conseils toujours actualisés.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 hover:bg-white/70 dark:hover:bg-gray-800/50 transition">
                  <Wind className="w-6 h-6 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      Personnalisé
                    </h3>
                    <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
                      Recommandations spécifiques à votre type de peau et vos conditions dermatologiques.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
