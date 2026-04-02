import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Trophy,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Cloud,
  Droplets,
  Wind,
  Zap,
  Target,
  Award,
  Star,
  ChevronRight,
  Activity,
  Heart,
} from 'lucide-react';
import { useContextualAnalysis } from '../../hooks/useContextualAnalysis';

interface DayForecast {
  day: string;
  date: string;
  uvIndex: number;
  skinRisk: 'low' | 'medium' | 'high';
  recommendation: string;
  icon: React.ReactNode;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export const SkinHealthDashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { skinLogs, seasonalPrediction, fetchSkinLogs, fetchSeasonalPrediction } = useContextualAnalysis();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchSkinLogs(30);
    fetchSeasonalPrediction();
  }, [fetchSkinLogs, fetchSeasonalPrediction]);

  // Calculate current health score
  const healthScore = useMemo(() => {
    if (!skinLogs || skinLogs.length === 0) return 0;
    const recentLogs = skinLogs.slice(0, 7);
    const avg = recentLogs.reduce((sum, log) => sum + log.conditionScore, 0) / recentLogs.length;
    return Math.round(avg * 10);
  }, [skinLogs]);

  // Calculate streak
  useEffect(() => {
    if (!skinLogs || skinLogs.length === 0) {
      setCurrentStreak(0);
      return;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < skinLogs.length; i++) {
      const logDate = new Date(skinLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    setCurrentStreak(streak);
    if (streak >= 7 && streak % 7 === 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [skinLogs]);

  // Animate score
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = healthScore / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= healthScore) {
        setAnimatedScore(healthScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [healthScore]);

  // Calculate trend
  const trend = useMemo(() => {
    if (!skinLogs || skinLogs.length < 7) return 'stable';
    const recent = skinLogs.slice(0, 3).reduce((s, l) => s + l.conditionScore, 0) / 3;
    const older = skinLogs.slice(4, 7).reduce((s, l) => s + l.conditionScore, 0) / 3;
    if (recent - older > 0.5) return 'improving';
    if (older - recent > 0.5) return 'declining';
    return 'stable';
  }, [skinLogs]);

  // Generate 7-day forecast
  const weekForecast: DayForecast[] = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const forecast: DayForecast[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Simulated forecast based on patterns
      const baseUv = 5 + Math.sin(i * 0.5) * 3;
      const uvIndex = Math.round(baseUv + Math.random() * 2);
      
      let skinRisk: 'low' | 'medium' | 'high' = 'low';
      let recommendation = '';
      let icon: React.ReactNode = <Sun className="w-5 h-5 text-yellow-500" />;

      if (uvIndex >= 8) {
        skinRisk = 'high';
        recommendation = 'Protection maximale requise';
        icon = <Sun className="w-5 h-5 text-red-500" />;
      } else if (uvIndex >= 5) {
        skinRisk = 'medium';
        recommendation = 'SPF 50 recommandé';
        icon = <Cloud className="w-5 h-5 text-orange-500" />;
      } else {
        skinRisk = 'low';
        recommendation = 'Protection légère';
        icon = <Cloud className="w-5 h-5 text-blue-500" />;
      }

      forecast.push({
        day: i === 0 ? "Auj." : days[date.getDay()],
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        uvIndex,
        skinRisk,
        recommendation,
        icon,
      });
    }

    return forecast;
  }, []);

  // Achievements
  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'streak-7',
      title: 'Régularité',
      description: '7 jours consécutifs de suivi',
      icon: <Flame className="w-6 h-6" />,
      unlocked: currentStreak >= 7,
      progress: Math.min(currentStreak, 7),
      maxProgress: 7,
    },
    {
      id: 'streak-30',
      title: 'Discipline',
      description: '30 jours de suivi',
      icon: <Trophy className="w-6 h-6" />,
      unlocked: (skinLogs?.length || 0) >= 30,
      progress: Math.min(skinLogs?.length || 0, 30),
      maxProgress: 30,
    },
    {
      id: 'perfect-week',
      title: 'Semaine Parfaite',
      description: 'Score > 8 pendant 7 jours',
      icon: <Star className="w-6 h-6" />,
      unlocked: skinLogs?.slice(0, 7).every(l => l.conditionScore >= 8) || false,
      progress: skinLogs?.slice(0, 7).filter(l => l.conditionScore >= 8).length || 0,
      maxProgress: 7,
    },
    {
      id: 'improver',
      title: 'En Progression',
      description: 'Amélioration de 20% ce mois',
      icon: <TrendingUp className="w-6 h-6" />,
      unlocked: trend === 'improving',
      progress: trend === 'improving' ? 100 : 50,
      maxProgress: 100,
    },
  ], [currentStreak, skinLogs, trend]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-amber-500';
    if (score >= 40) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -20, 
                  x: Math.random() * window.innerWidth - window.innerWidth / 2,
                  scale: 0 
                }}
                animate={{ 
                  y: window.innerHeight + 20,
                  x: Math.random() * 200 - 100,
                  scale: 1,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 2 + Math.random(),
                  ease: "easeOut"
                }}
                className={`absolute w-3 h-3 rounded-full ${
                  ['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-400', 'bg-purple-400'][i % 5]
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br ${getScoreGradient(animatedScore)}`}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Score de Santé Peau</h2>
            </div>
            <div className="flex items-center space-x-2">
              {trend === 'improving' && <TrendingUp className="w-5 h-5 text-green-400" />}
              {trend === 'declining' && <TrendingDown className="w-5 h-5 text-red-400" />}
              {trend === 'stable' && <Minus className="w-5 h-5 text-gray-400" />}
              <span className="text-sm text-gray-300 capitalize">
                {trend === 'improving' ? 'En hausse' : trend === 'declining' ? 'En baisse' : 'Stable'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center my-8">
            <div className="relative">
              {/* Circular progress */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-700"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 553" }}
                  animate={{ strokeDasharray: `${(animatedScore / 100) * 553} 553` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Score display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className={`text-5xl font-bold ${getScoreColor(animatedScore)}`}
                  key={animatedScore}
                >
                  {animatedScore}
                </motion.span>
                <span className="text-gray-400 text-sm">/100</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm"
            >
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-xs text-gray-400">Jours streak</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm"
            >
              <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <div className="text-2xl font-bold">{skinLogs?.length || 0}</div>
              <div className="text-xs text-gray-400">Total logs</div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm"
            >
              <Heart className="w-5 h-5 mx-auto mb-1 text-pink-400" />
              <div className="text-2xl font-bold">
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </div>
              <div className="text-xs text-gray-400">Badges</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 7-Day Skin Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Prévision Peau 7 Jours
            </h3>
          </div>
          <span className="text-xs text-gray-500 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
            🔮 IA Prédictive
          </span>
        </div>

        <div className="flex overflow-x-auto space-x-3 pb-2 -mx-2 px-2 scrollbar-hide">
          {weekForecast.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`flex-shrink-0 w-24 p-3 rounded-xl text-center cursor-pointer transition-all ${
                index === 0 
                  ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className={`text-xs font-medium ${index === 0 ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {day.day}
              </div>
              <div className="my-2">{day.icon}</div>
              <div className={`text-lg font-bold ${index === 0 ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                UV {day.uvIndex}
              </div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${getRiskColor(day.skinRisk)}`}>
                {day.skinRisk === 'high' ? 'Risque' : day.skinRisk === 'medium' ? 'Modéré' : 'Bon'}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Badges & Succès</h3>
          </div>
          <span className="text-sm text-gray-500">
            {achievements.filter(a => a.unlocked).length}/{achievements.length} débloqués
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 opacity-60'
              }`}
            >
              {achievement.unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1"
                >
                  <Award className="w-4 h-4 text-white" />
                </motion.div>
              )}
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                achievement.unlocked 
                  ? 'bg-yellow-400 text-white' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
              }`}>
                {achievement.icon}
              </div>
              
              <h4 className={`font-semibold text-sm ${
                achievement.unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-500'
              }`}>
                {achievement.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {achievement.description}
              </p>
              
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full rounded-full ${
                    achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="text-xs text-right text-gray-400 mt-1">
                {achievement.progress}/{achievement.maxProgress}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Insight Card */}
      {seasonalPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800 dark:text-white">
                Insight IA du Mois
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {seasonalPrediction.prediction.message}
            </p>
            {seasonalPrediction.prediction.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                {seasonalPrediction.prediction.recommendations.slice(0, 3).map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <ChevronRight className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-300">{rec}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
