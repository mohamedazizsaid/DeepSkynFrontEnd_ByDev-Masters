import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, Calendar, Eye,
  ChevronLeft, ChevronRight, Clock, Target,
  Activity,
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from '../card';
import { Button } from '../button';
import { analysisService } from '../../../lib/services/analysis.service';
import { formatAnalysisDate } from '../../../lib/analysis-helpers';
import type { Analysis, AnalysisListResponse } from '../../../lib/types';

interface AnalysisHistoryProps {
  onClose: () => void;
}

interface EvolutionDataPoint {
  date: string;
  score: number;
  acne: number;
  wrinkles: number;
  spots: number;
  hydration: number;
}

const EVOLUTION_COLORS = {
  score: '#3B82F6',
  acne: '#EF4444', 
  wrinkles: '#8B5CF6',
  spots: '#F59E0B',
  hydration: '#10B981',
};

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
`;

export function AnalysisHistory({ onClose }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof EVOLUTION_COLORS>('score');
  const [evolutionData, setEvolutionData] = useState<EvolutionDataPoint[]>([]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      // Charger toutes les analyses pour les afficher en tabs
      const response: AnalysisListResponse = await analysisService.getAll(1, 100);
      const analysesData = response.analyses || [];
      
      setAnalyses(analysesData);
      
      // Préparer les données d'évolution
      if (analysesData.length > 0) {
        const evolutionPoints: EvolutionDataPoint[] = analysesData.map(analysis => ({
          date: formatAnalysisDate(analysis.createdAt),
          score: analysis.results?.healthScore ?? analysis.healthScore ?? 0,
          acne: analysis.results?.detailedAnalysis?.acne?.score ?? 0,
          wrinkles: analysis.results?.detailedAnalysis?.wrinkles?.score ?? 0,
          spots: analysis.results?.detailedAnalysis?.pigmentation?.score ?? 0,
          hydration: analysis.results?.detailedAnalysis?.hydration?.score ?? 0,
        })).reverse(); // Plus récent à droite

        setEvolutionData(evolutionPoints);
      } else {
        setEvolutionData([]);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 2) return null; // Pas de changement significatif
    
    return diff > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Inject scrollbar styles */}
      <style>{scrollbarStyles}</style>
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1300] flex items-start justify-center overflow-y-auto pt-20 pb-4 custom-scrollbar">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-4 my-4 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] text-white p-6 flex-shrink-0 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Historique des Analyses</h2>
                <p className="text-blue-100 text-sm">
                  {analyses.length > 0 ? `${analyses.length} analyse${analyses.length > 1 ? 's' : ''} trouvée${analyses.length > 1 ? 's' : ''}` : 'Suivez l\'évolution de votre peau'}
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Evolution Chart */}
          {evolutionData && evolutionData.length > 1 && (
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" />
                <h3 className="font-semibold">Évolution des Scores</h3>
                <div className="flex gap-2 ml-auto">
                  {Object.entries(EVOLUTION_COLORS).map(([key, color]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMetric(key as keyof typeof EVOLUTION_COLORS)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        selectedMetric === key
                          ? 'bg-white text-gray-700'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {key === 'score' ? 'Global' : key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={EVOLUTION_COLORS[selectedMetric]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={EVOLUTION_COLORS[selectedMetric]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={EVOLUTION_COLORS[selectedMetric]}
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Content with Tabs - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune analyse trouvée</h3>
              <p className="text-gray-500">Commencez votre première analyse de peau !</p>
            </div>
          ) : (
            <>
              {/* Tabs Navigation - Fixed */}
              <div className="px-6 pt-4 flex-shrink-0 border-b border-gray-200">
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                  {analyses?.map((analysis, index) => {
                    const score = analysis.results?.healthScore ?? analysis.healthScore ?? 0;
                    const isSelected = selectedAnalysisIndex === index;
                    
                    return (
                      <button
                        key={analysis.id}
                        onClick={() => setSelectedAnalysisIndex(index)}
                        className={`flex-shrink-0 px-4 py-3 rounded-t-xl font-medium text-sm transition-all duration-200 border-b-2 ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-600'
                            : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            score >= 80 ? 'bg-green-100 text-green-700' : 
                            score >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {score}
                          </div>
                          <span className="whitespace-nowrap">
                            {formatAnalysisDate(analysis.createdAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Analysis Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {analyses[selectedAnalysisIndex] && (() => {
                    const analysis = analyses[selectedAnalysisIndex];
                    const score = analysis.results?.healthScore ?? analysis.healthScore ?? 0;
                    const previousScore = analyses[selectedAnalysisIndex + 1]?.results?.healthScore ?? analyses[selectedAnalysisIndex + 1]?.healthScore;

                    return (
                      <motion.div
                        key={analysis.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4"
                      >
                      {/* Score Principal */}
                      <Card className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${getScoreBg(score)}`}>
                            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">Score Global</h3>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{formatAnalysisDate(analysis.createdAt)}</span>
                              {getTrendIcon(score, previousScore)}
                            </div>
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <Clock className="w-3 h-3" />
                              {new Date(analysis.createdAt).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-6">
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>

                        {/* Condition principale */}
                        {(analysis.results?.conditions?.length > 0 || analysis.conditions?.length > 0) && (
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-500">État Principal</span>
                            <p className="text-lg font-semibold text-gray-800 capitalize">
                              {analysis.results?.conditions?.[0] || analysis.conditions?.[0] || 'Normal'}
                            </p>
                          </div>
                        )}
                      </Card>

                      {/* Scores Détaillés */}
                      <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          Analyse Détaillée
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Acné', value: analysis.results?.detailedAnalysis?.acne?.score ?? 0, color: 'red' },
                            { label: 'Rides', value: analysis.results?.detailedAnalysis?.wrinkles?.score ?? 0, color: 'purple' },
                            { label: 'Taches', value: analysis.results?.detailedAnalysis?.pigmentation?.score ?? 0, color: 'amber' },
                            { label: 'Hydratation', value: analysis.results?.detailedAnalysis?.hydration?.score ?? 0, color: 'emerald' },
                            { label: 'Texture', value: analysis.results?.detailedAnalysis?.texture?.score ?? 0, color: 'blue' },
                            { label: 'Pores', value: analysis.results?.detailedAnalysis?.pores?.score ?? 0, color: 'indigo' },
                            { label: 'Rougeurs', value: analysis.results?.detailedAnalysis?.redness?.score ?? 0, color: 'rose' },
                            { label: 'Élasticité', value: analysis.results?.detailedAnalysis?.elasticity?.score ?? 0, color: 'teal' },
                          ].map((metric) => (
                            <div key={metric.label} className="p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">{metric.label}</span>
                                <span className="font-bold text-gray-800">{metric.value}</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full bg-${metric.color}-500 rounded-full`}
                                  style={{ backgroundColor: metric.value >= 70 ? '#22c55e' : metric.value >= 40 ? '#eab308' : '#ef4444' }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${metric.value}%` }}
                                  transition={{ duration: 0.8 }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Images */}
                      {analysis.images?.length > 0 && (
                        <Card className="p-6 lg:col-span-2">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            Images de l'analyse ({analysis.images.length})
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {analysis.images.map((imageUrl, imgIndex) => (
                              <motion.div
                                key={imgIndex}
                                whileHover={{ scale: 1.05 }}
                                className="w-24 h-24 rounded-xl bg-gray-100 bg-cover bg-center border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer shadow-sm overflow-hidden"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                                onClick={() => window.open(imageUrl, '_blank')}
                              >
                                <div className="w-full h-full bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </motion.div>
                  );
                })()}
                </AnimatePresence>
              </div>

              {/* Navigation entre analyses - Fixed Bottom */}
              <div className="px-6 pb-4 pt-3 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAnalysisIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedAnalysisIndex === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédente
                  </Button>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                    {selectedAnalysisIndex + 1} / {analyses.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAnalysisIndex(prev => Math.min(analyses.length - 1, prev + 1))}
                    disabled={selectedAnalysisIndex === analyses.length - 1}
                    className="flex items-center gap-2"
                  >
                    Suivante
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
      </div>
    </>,
    document.body,
  );
}
