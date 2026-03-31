import React, { useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { useContextualAnalysis } from '../../hooks/useContextualAnalysis';

interface SeasonalPredictionCardProps {
  className?: string;
  showHistory?: boolean;
}

export const SeasonalPredictionCard: React.FC<SeasonalPredictionCardProps> = ({
  className = '',
  showHistory = false,
}) => {
  const {
    seasonalPrediction,
    predictionLoading,
    predictionError,
    fetchSeasonalPrediction,
  } = useContextualAnalysis();

  useEffect(() => {
    fetchSeasonalPrediction();
  }, [fetchSeasonalPrediction]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'new':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'declining':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'new':
        return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { label: 'En amélioration', emoji: '📈' };
      case 'declining':
        return { label: 'En baisse', emoji: '📉' };
      case 'new':
        return { label: 'Première analyse', emoji: '✨' };
      default:
        return { label: 'Stable', emoji: '➡️' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (predictionLoading) {
    return (
      <div className={`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-gray-600 dark:text-gray-300">
            Analyse des patterns saisonniers...
          </span>
        </div>
      </div>
    );
  }

  if (predictionError) {
    return (
      <div className={`rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <span>{predictionError}</span>
          <button
            onClick={fetchSeasonalPrediction}
            className="ml-auto text-purple-500 hover:text-purple-600 flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  if (!seasonalPrediction) {
    return null;
  }

  const { currentMonth, currentScore, lastYearScore, prediction, historicalData } = seasonalPrediction;
  const trendInfo = getTrendLabel(prediction.trend);

  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Prédiction Saisonnière</span>
          </div>
          <button
            onClick={fetchSeasonalPrediction}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm opacity-90 mt-1 capitalize">{currentMonth}</p>
      </div>

      {/* Scores comparison */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cette année</div>
            {currentScore !== null ? (
              <div className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>
                {currentScore.toFixed(1)}/10
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Pas de données</div>
            )}
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">L'an dernier</div>
            {lastYearScore !== null ? (
              <div className={`text-2xl font-bold ${getScoreColor(lastYearScore)}`}>
                {lastYearScore.toFixed(1)}/10
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Pas de données</div>
            )}
          </div>
        </div>
      </div>

      {/* Trend badge & message */}
      <div className={`p-4 border-l-4 ${getTrendColor(prediction.trend)}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getTrendIcon(prediction.trend)}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {trendInfo.emoji} {trendInfo.label}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {prediction.message}
        </p>
      </div>

      {/* Recommendations */}
      {prediction.recommendations.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Conseils pour ce mois
            </span>
          </div>
          <ul className="space-y-2">
            {prediction.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <ChevronRight className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Historical data (optional) */}
      {showHistory && historicalData.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Historique des 12 derniers mois
          </h4>
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {historicalData.slice(0, 12).map((data, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-12 text-center"
                title={`${data.month} ${data.year}: ${data.score.toFixed(1)}/10${data.dominantIssue ? ` - ${data.dominantIssue}` : ''}`}
              >
                <div
                  className="mx-auto w-8 rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-400"
                  style={{ height: `${Math.max(20, data.score * 8)}px` }}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {data.month.slice(0, 3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
