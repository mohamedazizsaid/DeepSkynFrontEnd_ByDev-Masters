import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Download, Sparkles, TrendingUp, TrendingDown,
  Upload, Camera, Loader2, RefreshCw, AlertTriangle,
  Droplets, Eye, CircleDot, Sun, Smile, Flame, Heart, Zap,
  Package, Leaf, Shield, Microscope,
} from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { analysisService } from '../../../lib/services/analysis.service';
import {
  extractDetailedScores,
  buildRadarData,
  calculateScoreChange,
  getStatusColorClass,
  formatAnalysisDate,
} from '../../../lib/analysis-helpers';
import type { Analysis, AnalysisStats, GeminiAnalysisResult } from '../../../lib/types';
import type { DetailedScoreItem } from '../../../lib/analysis-helpers';
import { CameraScanModal } from './camera-scan-modal';
import toast from 'react-hot-toast';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface AnalysisPageProps {
  onBack: () => void;
}

// Icon map for metric keys
const METRIC_ICONS: Record<string, React.ReactNode> = {
  hydration:    <Droplets className="w-6 h-6" />,
  texture:      <Sparkles className="w-6 h-6" />,
  pores:        <CircleDot className="w-6 h-6" />,
  pigmentation: <Sun className="w-6 h-6" />,
  wrinkles:     <TrendingUp className="w-6 h-6" />,
  acne:         <Flame className="w-6 h-6" />,
  redness:      <Heart className="w-6 h-6" />,
  elasticity:   <Zap className="w-6 h-6" />,
};

export function AnalysisPage({ onBack }: AnalysisPageProps) {
  // ─── State ───
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme, contrastMode } = useAccessibilityStore();

  // ─── Load latest analysis + stats + advice ───
  const loadData = async () => {
    setLoading(true);
    try {
      const [latestRes, statsRes] = await Promise.allSettled([
        analysisService.getLatest(),
        analysisService.getStats(),
      ]);
      if (latestRes.status === 'fulfilled') setAnalysis(latestRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);

      // Load advice separately (can be slower — Gemini call)
      if (latestRes.status === 'fulfilled') {
        setAdviceLoading(true);
        try {
          const adv = await analysisService.getAdvice();
          setAdvice(adv);
        } catch { /* non-blocking */ }
        finally { setAdviceLoading(false); }
      }
    } catch {
      toast.error('Failed to load analysis data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Upload handler ───
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed.');
      return;
    }
    setUploading(true);
    try {
      const result = await analysisService.uploadAndAnalyze(Array.from(files));
      setAnalysis(result);
      toast.success('Analysis started! Results will appear shortly.');
      // Reload to get processed results (analysis is async on backend)
      setTimeout(() => loadData(), 5000);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Derived data ───
  const results = analysis?.results ?? null;
  const overallScore = analysis?.healthScore ?? 0;
  const skinAge = analysis?.skinAge ?? null;
  const scoreChange = calculateScoreChange(stats);
  const radarData = buildRadarData(results);
  const detailedScores = extractDetailedScores(results);
  const hasAnalysis = analysis !== null && analysis.status === 'completed';

  // ─── Dynamic accessibility colors ───
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';
  const isHcMedium = contrastMode === 'medium';
  
  const getGridStroke = () => {
    if (isHcHigh) return '#FFD700';
    if (isHcMedium) return isDark ? '#c9a227' : '#8B6914';
    return isDark ? '#334155' : '#E5E7EB';
  };
  
  const getAxisStroke = () => {
    if (isHcHigh) return '#ffffff';
    if (isHcMedium) return isDark ? '#c0c0c0' : '#3d3d3d';
    return isDark ? '#94a3b8' : '#6B7280';
  };
  
  const getRadarStroke = () => {
    if (isHcHigh) return '#00ffff';
    return '#0EA5E9';
  };

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-6 mt-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#F3F4F6] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  if (!hasAnalysis) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center mt-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center mb-6">
            <Microscope className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Analysis Yet</h2>
          <p className="text-[#6B7280] mb-8 max-w-md">
            Upload photos of your skin or use the live camera scan to get your first AI-powered skin analysis.
          </p>
          <div className="flex gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Uploading...' : 'Upload Photos'}
            </Button>
            <Button onClick={() => setScanOpen(true)} className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]">
              <Camera className="w-5 h-5" />
              Live Scan
            </Button>
          </div>
          {analysis?.status === 'processing' && (
            <div className="mt-8 flex items-center gap-2 text-[#0EA5E9]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Analysis in progress...</span>
            </div>
          )}
          {analysis?.status === 'failed' && (
            <div className="mt-8 flex items-center gap-2 text-[#EF4444]">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Analysis failed.</span>
              <button
                onClick={async () => {
                  try {
                    await analysisService.retry(analysis.id);
                    toast.success('Retrying analysis...');
                    setTimeout(() => loadData(), 5000);
                  } catch { toast.error('Retry failed.'); }
                }}
                className="underline ml-1"
              >
                Retry
              </button>
            </div>
          )}
        </div>
        <CameraScanModal open={scanOpen} onClose={() => setScanOpen(false)} onAnalysisSaved={loadData} />
      </div>
    );
  }

  // ─── Main analysis view ─── with icon
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
            <Microscope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Detailed Skin Analysis</h1>
            <p className="text-[#6B7280]">Analyzed on {formatAnalysisDate(analysis.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button variant="outline" onClick={() => setScanOpen(true)}>
            <Camera className="w-5 h-5" />
            Live Scan
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? 'Analyzing...' : 'New Analysis'}
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-4">Overall Skin Health Score</h2>
            <div className="text-7xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent mb-4">
              {overallScore}
            </div>
            {scoreChange !== 0 && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
                scoreChange > 0
                  ? 'bg-[#10B981]/10 text-[#10B981]'
                  : 'bg-[#EF4444]/10 text-[#EF4444]'
              }`}>
                {scoreChange > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {scoreChange > 0 ? '+' : ''}{scoreChange} points from last analysis
              </div>
            )}
            {skinAge !== null && (
              <p className="text-sm text-[#6B7280] mt-3">
                Estimated Skin Age: <span className="font-bold text-[#374151]">{skinAge}</span>
                {results?.skinType && (
                  <> · Skin Type: <span className="font-bold text-[#374151] capitalize">{results.skinType}</span></>
                )}
              </p>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <h3 className="text-lg font-bold mb-6">Skin Profile Overview</h3>
            {radarData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={getGridStroke()} />
                    <PolarAngleAxis dataKey="category" stroke={getAxisStroke()} tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={getAxisStroke()} />
                    <Radar name="Score" dataKey="value" stroke={getRadarStroke()} fill={getRadarStroke()} fillOpacity={isHcHigh ? 0 : 0.3} strokeWidth={isHcHigh ? 3 : 2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-[#6B7280]">
                No detailed metrics available
              </div>
            )}
          </Card>
        </motion.div>

        {/* Face Map / Uploaded Image */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <h3 className="text-lg font-bold mb-6">
              {analysis.images.length > 0 ? 'Analyzed Image' : 'Face Mapping'}
            </h3>
            <div className="relative">
              {analysis.images.length > 0 ? (
                <img
                  src={analysis.images[0]}
                  alt="Analyzed skin"
                  className="w-full h-80 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-80 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#6B7280]">
                  No image available
                </div>
              )}

              {/* Condition badges overlay */}
              {analysis.conditions.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                  {analysis.conditions.slice(0, 4).map((condition, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-black/70 text-white text-xs rounded-full font-medium backdrop-blur-sm"
                    >
                      {condition}
                    </span>
                  ))}
                  {analysis.conditions.length > 4 && (
                    <span className="px-2.5 py-1 bg-black/70 text-white text-xs rounded-full font-medium backdrop-blur-sm">
                      +{analysis.conditions.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      {detailedScores.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <Card>
            <h3 className="text-lg font-bold mb-6">Detailed Breakdown</h3>
            <div className="space-y-6">
              {detailedScores.map((item: DetailedScoreItem, index: number) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className="border-b border-[#E5E7EB] last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: isHcHigh || isHcMedium ? 'transparent' : `${item.color}20`, color: isHcHigh ? '#00ffff' : item.color, border: isHcHigh || isHcMedium ? `2px solid ${isHcHigh ? '#FFD700' : item.color}` : 'none' }}
                      >
                        {METRIC_ICONS[item.key] ?? <Eye className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold">{item.category}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(item.status)}`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: item.color }}>
                        {item.score}
                      </div>
                      <div className="text-sm text-[#6B7280]">/ 100</div>
                    </div>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.08 }}
                    />
                  </div>
                  <p className="text-sm text-[#6B7280]">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
          <Card>
            <h3 className="text-lg font-bold mb-6">Personalized Recommendations</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Products */}
              {analysis.recommendations.products?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-[#0EA5E9]" />
                    <h4 className="font-bold text-sm">Recommended Products</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.recommendations.products.map((p, i) => (
                      <li key={i} className="text-sm text-[#374151] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] mt-1.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Ingredients */}
              {analysis.recommendations.ingredients?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="w-5 h-5 text-[#10B981]" />
                    <h4 className="font-bold text-sm">Key Ingredients</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendations.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-xs rounded-full font-medium">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Lifestyle */}
              {analysis.recommendations.lifestyle?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-[#F59E0B]" />
                    <h4 className="font-bold text-sm">Lifestyle Tips</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.recommendations.lifestyle.map((tip, i) => (
                      <li key={i} className="text-sm text-[#374151] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Warnings */}
            {analysis.recommendations.warnings?.length > 0 && (
              <div className="mt-6 p-4 bg-[#FEF2F2] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                  <h4 className="font-bold text-sm text-[#EF4444]">Warnings</h4>
                </div>
                <ul className="space-y-1">
                  {analysis.recommendations.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-[#991B1B]">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* AI Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI-Generated Insights</h3>
              <p className="text-xs text-[#6B7280]">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-[#374151]">
            {adviceLoading ? (
              <div className="flex items-center gap-2 text-[#6B7280]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating personalized advice...</span>
              </div>
            ) : advice ? (
              <p className="whitespace-pre-line">{advice}</p>
            ) : results?.summary ? (
              <p className="whitespace-pre-line">{results.summary}</p>
            ) : (
              <p className="text-[#6B7280]">No AI insights available for this analysis.</p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Camera Scan Modal */}
      <CameraScanModal open={scanOpen} onClose={() => setScanOpen(false)} onAnalysisSaved={loadData} />
    </div>
  );
}
