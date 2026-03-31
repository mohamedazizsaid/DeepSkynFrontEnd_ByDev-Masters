import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, Calendar, Eye, Award, 
  ChevronLeft, ChevronRight, Filter, Clock, Target,
  Activity, ArrowRight, Zap, Shield, Heart,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
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

export function AnalysisHistory({ onClose }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof EVOLUTION_COLORS>('score');
  const [evolutionData, setEvolutionData] = useState<EvolutionDataPoint[]>([]);

  const loadAnalyses = async (page = 1) => {
    setLoading(true);
    try {
      const response: AnalysisListResponse = await analysisService.getAll(page, 12);
      const analysesData = response.analyses || [];
      
      setAnalyses(analysesData);
      setTotalPages(Math.ceil(response.total / 12)); // Using fixed limit of 12
      setCurrentPage(page);
      
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Historique des Analyses</h2>
                <p className="text-blue-100">Suivez l'évolution de votre peau</p>
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

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyses?.map((analysis, index) => {
                  const score = analysis.results?.healthScore ?? analysis.healthScore ?? 0;
                  const previousScore = analyses[index + 1]?.results?.healthScore ?? analyses[index + 1]?.healthScore;
                  
                  return (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getScoreBg(score)}`}>
                            <Award className={`w-4 h-4 ${getScoreColor(score)}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">
                                {formatAnalysisDate(analysis.createdAt)}
                              </span>
                              {getTrendIcon(score, previousScore)}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(analysis.createdAt).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Score Global</span>
                            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                              {score}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Condition principale */}
                        {(analysis.results?.conditions?.length > 0 || analysis.conditions?.length > 0) && (
                          <div className="mb-3">
                            <span className="text-xs text-gray-500">État Principal</span>
                            <p className="text-sm font-medium text-gray-700 capitalize">
                              {analysis.results?.conditions?.[0] || analysis.conditions?.[0] || 'Normal'}
                            </p>
                          </div>
                        )}

                        {/* Scores détaillés */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Acné</span>
                            <span className="font-medium">{analysis.results?.detailedAnalysis?.acne?.score ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Rides</span>
                            <span className="font-medium">{analysis.results?.detailedAnalysis?.wrinkles?.score ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Taches</span>
                            <span className="font-medium">{analysis.results?.detailedAnalysis?.pigmentation?.score ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Hydratation</span>
                            <span className="font-medium">{analysis.results?.detailedAnalysis?.hydration?.score ?? 0}</span>
                          </div>
                        </div>

                        {/* Images - Toutes affichées */}
                        {analysis.images?.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-gray-500 mb-2 block">Images d'analyse ({analysis.images.length})</span>
                            <div className="flex flex-wrap gap-1">
                              {analysis.images.map((imageUrl, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  className="w-12 h-12 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group relative overflow-hidden"
                                  style={{ backgroundImage: `url(${imageUrl})` }}
                                  onClick={() => window.open(imageUrl, '_blank')}
                                >
                                  {/* Overlay pour indiquer que c'est cliquable */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Eye className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAnalyses(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAnalyses(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}