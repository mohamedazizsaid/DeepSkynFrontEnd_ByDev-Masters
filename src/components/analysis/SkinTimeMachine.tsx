import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  CloudRain,
  Snowflake,
  Leaf,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { useContextualAnalysis } from '../../hooks/useContextualAnalysis';

interface TimelineEvent {
  date: Date;
  score: number;
  concerns: string[];
  notes?: string;
  weather?: {
    season: 'spring' | 'summer' | 'fall' | 'winter';
    uvIndex?: number;
  };
}

const seasonIcons = {
  spring: <Leaf className="w-4 h-4 text-green-500" />,
  summer: <Sun className="w-4 h-4 text-yellow-500" />,
  fall: <Leaf className="w-4 h-4 text-orange-500" />,
  winter: <Snowflake className="w-4 h-4 text-blue-500" />,
};

const seasonNames = {
  spring: 'Printemps',
  summer: 'Été',
  fall: 'Automne',
  winter: 'Hiver',
};

const getSeason = (date: Date): 'spring' | 'summer' | 'fall' | 'winter' => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

export const SkinTimeMachine: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { skinLogs, fetchSkinLogs } = useContextualAnalysis();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('timeline');
  const timelineRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSkinLogs(90); // Get last 90 days
  }, [fetchSkinLogs]);

  // Transform skin logs to timeline events
  const timelineEvents: TimelineEvent[] = React.useMemo(() => {
    if (!skinLogs || skinLogs.length === 0) return [];
    
    return skinLogs.map(log => ({
      date: new Date(log.date),
      score: log.conditionScore,
      concerns: log.concerns || [],
      notes: log.notes,
      weather: {
        season: getSeason(new Date(log.date)),
      },
    })).reverse(); // Oldest first
  }, [skinLogs]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && timelineEvents.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setSelectedIndex(prev => {
          if (prev >= timelineEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, timelineEvents.length]);

  const selectedEvent = timelineEvents[selectedIndex];
  const previousEvent = selectedIndex > 0 ? timelineEvents[selectedIndex - 1] : null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    if (score >= 6) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    if (score >= 4) return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
    return 'text-red-500 bg-red-100 dark:bg-red-900/30';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 9) return '🌟';
    if (score >= 8) return '😊';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    return '😟';
  };

  const calculateChange = () => {
    if (!previousEvent || !selectedEvent) return null;
    const change = selectedEvent.score - previousEvent.score;
    return {
      value: change,
      percentage: ((change / previousEvent.score) * 100).toFixed(1),
    };
  };

  const change = calculateChange();

  if (timelineEvents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ${className}`}
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Machine à Remonter le Temps
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Commence à logger ton état de peau quotidiennement pour débloquer la timeline interactive et voir ton évolution.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Machine à Remonter le Temps</h3>
          </div>
          <div className="flex items-center space-x-1 bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                viewMode === 'timeline' ? 'bg-white text-indigo-600' : 'text-white/80 hover:text-white'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                viewMode === 'comparison' ? 'bg-white text-indigo-600' : 'text-white/80 hover:text-white'
              }`}
            >
              Comparer
            </button>
          </div>
        </div>

        {/* Current selection info */}
        {selectedEvent && (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                {seasonIcons[selectedEvent.weather?.season || 'spring']}
                <span className="text-sm opacity-80">
                  {seasonNames[selectedEvent.weather?.season || 'spring']}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {selectedEvent.date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold flex items-center space-x-2">
                <span>{selectedEvent.score}</span>
                <span className="text-2xl">{getScoreEmoji(selectedEvent.score)}</span>
              </div>
              {change && (
                <div className={`flex items-center space-x-1 text-sm ${
                  change.value >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {change.value >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{change.value >= 0 ? '+' : ''}{change.value.toFixed(1)} pts</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      <div className="p-5">
        {/* Progress bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((selectedIndex + 1) / timelineEvents.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
          {/* Timeline dots */}
          {timelineEvents.map((event, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all ${
                index === selectedIndex
                  ? 'bg-white border-purple-500 scale-125 z-10'
                  : index < selectedIndex
                  ? 'bg-purple-500 border-purple-500'
                  : 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600'
              }`}
              style={{ left: `${(index / (timelineEvents.length - 1)) * 100}%` }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-purple-500 text-white shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSelectedIndex(0);
              setIsPlaying(false);
            }}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedIndex(Math.min(timelineEvents.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === timelineEvents.length - 1}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>

        {/* Event details */}
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Score visualization */}
              <div className="flex items-center space-x-4">
                <div className={`flex-1 h-16 rounded-xl flex items-center justify-center ${getScoreColor(selectedEvent.score)}`}>
                  <span className="text-3xl font-bold">{selectedEvent.score}/10</span>
                </div>
                {previousEvent && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">vs</span>
                    <span className={`font-semibold ${getScoreColor(previousEvent.score).split(' ')[0]}`}>
                      {previousEvent.score}/10
                    </span>
                  </div>
                )}
              </div>

              {/* Concerns */}
              {selectedEvent.concerns.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Préoccupations ce jour-là:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.concerns.map((concern, i) => (
                      <motion.span
                        key={concern}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm"
                      >
                        {concern}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
                  <p className="text-gray-700 dark:text-gray-300">{selectedEvent.notes}</p>
                </div>
              )}

              {/* AI Insight */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    Analyse IA rétrospective
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedEvent.score >= 8 
                    ? "Excellente journée pour ta peau ! Les conditions étaient optimales et ta routine a bien fonctionné."
                    : selectedEvent.score >= 6
                    ? "Journée correcte. Quelques facteurs environnementaux ont pu impacter légèrement ta peau."
                    : "Journée difficile pour ta peau. Analyse les facteurs externes qui ont pu causer ces problèmes."}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini timeline preview */}
        <div className="mt-6 overflow-x-auto" ref={timelineRef}>
          <div className="flex space-x-2 min-w-max pb-2">
            {timelineEvents.slice(Math.max(0, selectedIndex - 5), selectedIndex + 6).map((event, relIndex) => {
              const actualIndex = Math.max(0, selectedIndex - 5) + relIndex;
              return (
                <motion.button
                  key={actualIndex}
                  onClick={() => setSelectedIndex(actualIndex)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all min-w-[60px] ${
                    actualIndex === selectedIndex
                      ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {event.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-lg font-bold ${
                    event.score >= 8 ? 'text-green-500' :
                    event.score >= 6 ? 'text-yellow-500' :
                    event.score >= 4 ? 'text-orange-500' : 'text-red-500'
                  }`}>
                    {event.score}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
