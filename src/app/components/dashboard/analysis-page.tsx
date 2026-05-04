import React, { useState, useEffect, useRef } from 'react';
import { generateAnalysisPdf } from '../../../lib/pdf/analysis-report';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft, Download, Sparkles, TrendingUp, TrendingDown,
  Upload, Camera, Loader2, RefreshCw, AlertTriangle,
  Droplets, Eye, CircleDot, Sun, Smile, Flame, Heart, Zap,
  Package, Leaf, Shield, Microscope, MapPin, Wind, Thermometer,
  Calendar, Clock, ChevronRight, Activity, Target, Award, ShieldX, GitCompare,
} from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { QuotaAlertBanner } from './quota-alert-banner';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Area, AreaChart
} from 'recharts';
import { analysisService } from '../../../lib/services/analysis.service';
import { subscriptionService } from '../../../lib/services/subscription.service';
import { faceVerificationService } from '../../../lib/services/face-verification.service';
import { contextualAnalysisService, type WeatherAlertResponse, type AIAdvice } from '../../../lib/services/contextual-analysis.service';
import { fetchCompleteWeatherData } from '../../../lib/services/weather.service';
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
import { AnalysisCompareModal } from './analysis-compare-modal';
import {
  PreocupentSelectorModal,
  type PreocupentZoneKey,
} from './preocupent-selector-modal';
import { PredictiveRoutineCard } from '../../../components/analysis';
import { AnalysisHistory } from './analysis-history';
import { FaceZoneVisualization } from './face-zone-visualization';
import { useFaceVerification } from '../../../lib/hooks/useFaceVerification';
import toast from 'react-hot-toast';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface AnalysisPageProps {
  onBack: () => void;
  onUpgrade?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToRoutine?: () => void;
}

// Icon map for metric keys
const METRIC_ICONS: Record<string, React.ReactNode> = {
  hydration: <Droplets className="w-6 h-6" />,
  texture: <Sparkles className="w-6 h-6" />,
  pores: <CircleDot className="w-6 h-6" />,
  pigmentation: <Sun className="w-6 h-6" />,
  wrinkles: <TrendingUp className="w-6 h-6" />,
  acne: <Flame className="w-6 h-6" />,
  redness: <Heart className="w-6 h-6" />,
  elasticity: <Zap className="w-6 h-6" />,
};

export function AnalysisPage({ onBack, onUpgrade, onNavigateToSettings, onNavigateToRoutine }: AnalysisPageProps) {
  // ─── State ───
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [preocupentModalOpen, setPreocupentModalOpen] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [uploadPreocupentSubmitting, setUploadPreocupentSubmitting] = useState(false);
  const [lastSelectedPreocupent, setLastSelectedPreocupent] = useState<PreocupentZoneKey[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [analysisLimit, setAnalysisLimit] = useState<number | null>(3);
  const [analysisUsed, setAnalysisUsed] = useState(0);
  const [analysisResetAt, setAnalysisResetAt] = useState<string | null>(null);
  const [verifyingUpload, setVerifyingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadRunIdRef = useRef(0);

  // Face verification hook
  const {
    isModelLoaded,
    loadModels,
    extractDescriptorFromImage,
    verifyFromImage,
  } = useFaceVerification();

  // Weather & AI state
  const [weatherData, setWeatherData] = useState<WeatherAlertResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [allAnalysesForCompare, setAllAnalysesForCompare] = useState<Analysis[]>([]);
  const { theme, contrastMode, reduceMotion, t } = useAccessibilityStore();
  const browserReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion || browserReducedMotion;

  const fullTitle = t('analysis.header.title');
  const [visibleTitleText, setVisibleTitleText] = useState('');
  const [titleLoopKey, setTitleLoopKey] = useState(0);

  const titleWords = fullTitle.split(' ');
  const titlePrefix = titleWords.length > 1
    ? titleWords.slice(0, -1).join(' ') + ' '
    : '';

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleTitleText(fullTitle);
      return;
    }

    setVisibleTitleText('');
    const charDelay = 45;
    const holdDelay = 10000; // 10s pour ne pas être trop répétitif
    const timeouts: NodeJS.Timeout[] = [];

    const type = (index: number) => {
      if (index <= fullTitle.length) {
        setVisibleTitleText(fullTitle.slice(0, index));
        timeouts.push(setTimeout(() => type(index + 1), charDelay));
      } else {
        timeouts.push(setTimeout(() => {
          setTitleLoopKey(prev => prev + 1);
        }, holdDelay));
      }
    };

    timeouts.push(setTimeout(() => type(1), 150));

    return () => timeouts.forEach(clearTimeout);
  }, [fullTitle, shouldReduceMotion, titleLoopKey]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Load face-api models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const formatResetDate = (value?: string | null): string => {
    if (!value) return t('common.soon');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const analysisRemaining = analysisLimit === null ? null : Math.max(0, analysisLimit - analysisUsed);
  const nearAnalysisLimit = !isPremium && analysisRemaining !== null && analysisRemaining > 0 && analysisRemaining <= 1;
  const analysisLimitReached = !isPremium && analysisRemaining !== null && analysisRemaining <= 0;

  const refreshUsage = async () => {
    try {
      const usage = await subscriptionService.getUsageSummary();
      setIsPremium(usage.isPremium);
      setAnalysisLimit(usage.quotas.analyses.limit);
      setAnalysisUsed(usage.quotas.analyses.used || 0);
      setAnalysisResetAt(usage.quotas.analyses.resetsAt);
    } catch {
      // keep previous usage if request fails
    }
  };

  const selectBestAnalysis = (
    latest: Analysis | null,
    list: Analysis[] | undefined,
  ): Analysis | null => {
    if (latest) return latest;
    if (!list?.length) return null;

    // Prefer a completed analysis for the main dashboard, fallback to most recent item.
    const latestCompleted = list.find((item) => item.status === 'completed');
    return latestCompleted ?? list[0] ?? null;
  };

  // ─── Load latest analysis + stats + advice ───
  const loadData = async () => {
    const runId = ++loadRunIdRef.current;
    setLoading(true);
    try {
      // Core data first to render fast blocks immediately.
      const [latestRes, usageRes] = await Promise.allSettled([
        analysisService.getLatest(),
        subscriptionService.getUsageSummary(),
      ]);

      if (loadRunIdRef.current !== runId) return;

      const latestAnalysis = latestRes.status === 'fulfilled' ? latestRes.value : null;
      setAnalysis(latestAnalysis);

      if (usageRes.status === 'fulfilled') {
        setIsPremium(usageRes.value.isPremium);
        setAnalysisLimit(usageRes.value.quotas.analyses.limit);
        setAnalysisUsed(usageRes.value.quotas.analyses.used || 0);
        setAnalysisResetAt(usageRes.value.quotas.analyses.resetsAt);
      }

      // Advice can be slow (Gemini): do it async and non-blocking.
      let adviceRequested = false;
      const requestAdvice = (candidate: Analysis | null) => {
        if (candidate?.status !== 'completed' || adviceRequested) return;
        adviceRequested = true;
        setAdviceLoading(true);

        void analysisService
          .getAdvice()
          .then((adv) => {
            if (loadRunIdRef.current !== runId) return;
            setAdvice(typeof adv === 'string' ? adv : null);
          })
          .catch(() => {
            // non-blocking
          })
          .finally(() => {
            if (loadRunIdRef.current !== runId) return;
            setAdviceLoading(false);
          });
      };

      requestAdvice(latestAnalysis);
      if (!latestAnalysis || latestAnalysis.status !== 'completed') {
        setAdvice(null);
        setAdviceLoading(false);
        setAnalysisHistory([]);
      }

      // Secondary sections continue loading in background.
      void Promise.allSettled([
        analysisService.getStats(),
        analysisService.getAll(1, 10),
      ]).then(([statsRes, historyRes]) => {
        if (loadRunIdRef.current !== runId) return;

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value);
        }

        const historyAnalyses =
          historyRes.status === 'fulfilled' && Array.isArray(historyRes.value?.analyses)
            ? historyRes.value.analyses
            : [];

        const selectedAnalysis = selectBestAnalysis(latestAnalysis, historyAnalyses);
        setAnalysis(selectedAnalysis);

        // Store full list for comparator
        setAllAnalysesForCompare(historyAnalyses.filter((a: Analysis) => a.status === 'completed'));

        if (historyAnalyses.length > 0) {
          setAnalysisHistory(
            historyAnalyses
              .filter((a: Analysis) => a.status === 'completed')
              .slice(0, 10)
              .reverse()
              .map((a: Analysis) => ({
                date: new Date(a.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
                score: a.healthScore || 0,
              })),
          );
        } else {
          setAnalysisHistory([]);
        }

        // Fallback: if latest endpoint had nothing completed but history does.
        requestAdvice(selectedAnalysis);
      });
    } catch {
      toast.error(t('analysis.messages.loadError'));
    } finally {
      if (loadRunIdRef.current !== runId) return;
      setLoading(false);
    }
  };
  // Load weather data with geolocation
  const loadWeatherData = async () => {
    setWeatherLoading(true);
    try {
      // 1. Récupérer les VRAIES données météo + conseil IA de la navbar
      const { weather, advice } = await fetchCompleteWeatherData();

      // 2. Envoyer ces vraies données au backend pour les alertes supplémentaires
      let alert = null;

      try {
        // Utiliser le service contextuel avec les vraies coordonnées pour les alertes
        const contextualData = await contextualAnalysisService.getWeatherAlert(
          weather.latitude,
          weather.longitude,
          weather.city
        );
        alert = contextualData.alert;
      } catch (err) {
        console.warn('Weather alerts unavailable, using weather data only:', err);
      }

      // 3. Combiner vraies données météo + conseil IA de la navbar + alertes du backend
      const combinedData = {
        alert,
        weather: {
          uvIndex: weather.uvIndex,
          aqi: null, // L'API frontend n'a pas l'AQI
          humidity: weather.humidity,
          temperature: weather.temperature, // VRAIE température de Tunis
        },
        location: {
          latitude: weather.latitude,
          longitude: weather.longitude,
          city: weather.city,
          country: weather.country,
        },
        // Utiliser le conseil généré par le système de la navbar
        aiAdvice: advice ? {
          personalizedMessage: advice.advice,
          skinCareRoutine: [],
          productsToUse: [],
          warnings: [],
          protectionLevel: advice.urgency as 'low' | 'medium' | 'high' | 'extreme',
        } : undefined,
      };

      setWeatherData(combinedData);
    } catch (err) {
      console.warn('Weather data unavailable:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => { loadData(); loadWeatherData(); }, []);

  const closeUploadPreocupentModal = () => {
    if (uploadPreocupentSubmitting) return;
    setPreocupentModalOpen(false);
    setPendingUploadFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitUploadWithPreocupent = async (zones: PreocupentZoneKey[]) => {
    if (!pendingUploadFiles.length) return;

    setUploadPreocupentSubmitting(true);
    setUploading(true);
    try {
      const result = await analysisService.uploadAndAnalyze(
        pendingUploadFiles,
        undefined,
        zones,
      );
      setAnalysis(result);
      setLastSelectedPreocupent(zones);
      toast.success(t('analysis.messages.started'));
      await refreshUsage();
      setTimeout(() => loadData(), 5000);
    } catch {
      toast.error(t('analysis.messages.uploadFailed'));
      await refreshUsage();
    } finally {
      setUploading(false);
      setUploadPreocupentSubmitting(false);
      setPreocupentModalOpen(false);
      setPendingUploadFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Upload handler with face verification ───
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (analysisLimitReached) {
      toast.error(t('analysis.messages.limitReachedTryAfter', { date: formatResetDate(analysisResetAt) }));
      return;
    }
    if (files.length > 5) {
      toast.error(t('analysis.messages.maxImages'));
      return;
    }

    // Step 1: Face verification on uploaded image
    if (isModelLoaded) {
      setVerifyingUpload(true);
      try {
        // Create an image from the first uploaded file to verify face
        const file = files[0];
        const imageUrl = URL.createObjectURL(file);

        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(t('analysis.messages.faceImageLoadError')));
          img.src = imageUrl;
        });

        // Extract face descriptor from uploaded image
        const descriptor = await extractDescriptorFromImage(img);
        URL.revokeObjectURL(imageUrl);

        if (!descriptor) {
          toast.error(t('analysis.messages.noFaceDetected'), {
            duration: 5000,
            icon: '👤',
          });
          setVerifyingUpload(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Verify face with backend
        const verification = await faceVerificationService.verify({ descriptor });

        if (!verification.verified) {
          if (verification.needsProfilePhoto) {
            toast.error(verification.message, {
              duration: 6000,
              icon: '⚙️',
            });
            // Redirect to settings if needed
            if (onNavigateToSettings) {
              setTimeout(() => onNavigateToSettings(), 2000);
            }
          } else {
            toast.error(verification.message, {
              duration: 5000,
              icon: '🚫',
            });
          }
          setVerifyingUpload(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Face verified!
        toast.success(verification.message, { duration: 2000, icon: '✅' });
      } catch (err) {
        console.error('Face verification error:', err);
        toast.error(t('analysis.messages.faceVerifyError'));
        setVerifyingUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      } finally {
        setVerifyingUpload(false);
      }
    }

    // Step 2: Ask for face concern zones before launching analysis
    setPendingUploadFiles(Array.from(files));
    setPreocupentModalOpen(true);
  };

  // ─── Derived data ───
  const results = analysis?.results ?? null;
  const overallScore = analysis?.healthScore ?? 0;
  const skinAge = analysis?.skinAge ?? null;
  const scoreChange = calculateScoreChange(stats);
  const radarData = buildRadarData(results);
  const detailedScores = extractDetailedScores(results);
  const hasAnalysis = analysis !== null && analysis.status === 'completed';

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [analysis?.id, analysis?.images?.length]);

  const getRadarBadge = (value: number) => {
    if (value > 75) {
      return {
        label: t('analysis.radar.badgeExcellent'),
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      };
    }
    if (value >= 50) {
      return {
        label: t('analysis.radar.badgeMedium'),
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
      };
    }
    return {
      label: t('analysis.radar.badgeLow'),
      className: 'bg-red-100 text-red-700 border border-red-200',
    };
  };

  const selectedImageSrc = analysis?.images?.[selectedImageIndex] || null;
  const analysisThumbDate = analysis?.createdAt
    ? new Date(analysis.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
    : '';

  const generatePdfFromElement = () => {
    if (!analysis) return;
    generateAnalysisPdf(analysis, `deepskyn-analysis-${analysis?.id || 'report'}.pdf`);
  };

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

  const insightCardClass = isHcHigh
    ? 'h-full relative overflow-hidden rounded-2xl p-6 bg-black border-2 border-yellow-400 shadow-none'
    : isDark
      ? 'h-full relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] border border-[#334155] shadow-[0_12px_28px_rgba(2,6,23,0.45)]'
      : 'h-full relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#ffffff] via-[#f8fbff] to-[#eef6ff] border border-[#dbe7f4] shadow-[0_12px_28px_rgba(56,138,221,0.10)]';

  const insightTitleClass = isHcHigh ? 'text-[15px] font-semibold text-yellow-300 mb-4' : isDark ? 'text-[15px] font-semibold text-[#e2e8f0] mb-4' : 'text-[15px] font-semibold text-[#0f172a] mb-4';

  const thumbBaseClass = isHcHigh
    ? 'border-yellow-400 bg-black'
    : isDark
      ? 'border-[#334155] bg-[#0f172a]'
      : 'border-[#e2e8f0] bg-white';

  const thumbDateClass = isHcHigh
    ? 'bg-black text-yellow-300'
    : isDark
      ? 'bg-[#0f172a] text-[#94a3b8]'
      : 'bg-white text-[#64748b]';

  const previewFrameClass = isHcHigh
    ? 'mt-4 rounded-xl overflow-hidden border-2 border-yellow-400'
    : isDark
      ? 'mt-4 rounded-xl overflow-hidden border border-[#334155]'
      : 'mt-4 rounded-xl overflow-hidden border border-[#e2e8f0]';

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto" />
          </motion.div>
          <p className="text-[#6B7280] mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  if (!hasAnalysis) {
    return (
      <div className="px-4 sm:px-8 pb-12 max-w-7xl mx-auto">
        {!isPremium && analysisRemaining !== null && (
          <div className="mb-6">
            <QuotaAlertBanner
              variant={analysisLimitReached ? 'blocked' : nearAnalysisLimit ? 'warning' : 'info'}
              title={analysisLimitReached ? t('analysis.quota.titleBlocked') : nearAnalysisLimit ? t('analysis.quota.titleWarning') : t('analysis.quota.titleInfo')}
              message={analysisLimitReached
                ? t('analysis.quota.resetDate', { date: formatResetDate(analysisResetAt) })
                : nearAnalysisLimit
                  ? t('analysis.quota.onlyLeft', { count: analysisRemaining ?? 0 })
                  : t('analysis.quota.usedThisMonth', { used: analysisUsed, limit: analysisLimit ?? 0 })}
              used={analysisUsed}
              limit={analysisLimit}
              onUpgrade={onUpgrade}
              upgradeLabel={t('analysis.quota.upgrade')}
            />
          </div>
        )}

        <Card className="mt-12 border-[#DBEAFE] bg-gradient-to-br from-white via-[#F8FBFF] to-[#F0F9FF] shadow-xl shadow-[#0EA5E9]/10">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center mb-6 shadow-lg shadow-[#0EA5E9]/30">
              <Microscope className="w-11 h-11 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-[#0F172A]">{t('analysis.empty.title')}</h2>
            <p className="text-[#64748B] mb-8 max-w-md leading-relaxed">
              {t('analysis.empty.description')}
            </p>
            <div className="flex gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading || verifyingUpload || analysisLimitReached}>
                {verifyingUpload ? (
                  <>
                    <ShieldX className="w-5 h-5 animate-pulse" />
                    {t('analysis.actions.verifying')}
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('analysis.actions.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    {analysisLimitReached ? t('analysis.actions.limitReached') : t('analysis.actions.uploadPhotos')}
                  </>
                )}
              </Button>
              <Button onClick={() => setScanOpen(true)} className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]">
                <Camera className="w-5 h-5" />
                {t('analysis.actions.liveScan')}
              </Button>
            </div>
            {analysis?.status === 'processing' && (
              <div className="mt-8 flex items-center gap-2 text-[#0EA5E9]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">{t('analysis.status.processing')}</span>
              </div>
            )}
            {analysis?.status === 'failed' && (
              <div className="mt-8 flex items-center gap-2 text-[#EF4444]">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{t('analysis.status.failed')}</span>
                <button
                  onClick={async () => {
                    try {
                      await analysisService.retry(analysis.id);
                      toast.success(t('analysis.status.retrying'));
                      setTimeout(() => loadData(), 5000);
                    } catch { toast.error(t('analysis.status.retryFailed')); }
                  }}
                  className="underline ml-1"
                >
                  {t('analysis.status.retry')}
                </button>
              </div>
            )}
          </div>
        </Card>
        <CameraScanModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onAnalysisSaved={loadData}
          canSaveAnalysis={!analysisLimitReached}
          analysisBlockedMessage={t('analysis.messages.limitReachedReset', { date: formatResetDate(analysisResetAt) })}
          onUpgrade={onUpgrade}
          onNavigateToSettings={onNavigateToSettings}
        />
        <PreocupentSelectorModal
          open={preocupentModalOpen}
          initialSelected={lastSelectedPreocupent}
          onClose={closeUploadPreocupentModal}
          onConfirm={submitUploadWithPreocupent}
          loading={uploadPreocupentSubmitting}
          confirmLabel={t('analysis.actions.startAnalysis')}
        />
      </div>
    );
  }

  // ─── Main analysis view ─── PROFESSIONAL UI/UX
  return (
    <div className="min-h-screen bg-transparent px-4 sm:px-8 pb-12">
      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
            rotate: [90, 0, 90]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-3xl"
        />
      </div>

      <div id="analysis-report-root" className="relative z-10 max-w-7xl mx-auto">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/50 to-cyan-400/50 rounded-2xl blur-xl" />
                  <Microscope className="w-8 h-8 text-white relative z-10" />
                </motion.div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent mb-1">
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {visibleTitleText.slice(0, titlePrefix.length)}
                      <span className={isHcHigh ? 'text-cyan-400' : 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent'}>
                        {visibleTitleText.length > titlePrefix.length
                          ? visibleTitleText.slice(titlePrefix.length)
                          : ''}
                      </span>
                      {visibleTitleText.length < fullTitle.length && !shouldReduceMotion && (
                        <motion.span
                          className="inline-block ml-0.5 text-[#0EA5E9]"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          |
                        </motion.span>
                      )}
                    </motion.span>
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{t('analysis.header.analyzedOn', { date: formatAnalysisDate(analysis.createdAt) })}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setScanOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{t('analysis.actions.liveScan')}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || verifyingUpload || analysisLimitReached}
                  className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium shadow-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingUpload ? (
                    <>
                      <ShieldX className="w-5 h-5 animate-pulse" />
                      <span>{t('analysis.actions.verifyingShort')}</span>
                    </>
                  ) : uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('analysis.actions.analyzingShort')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>{analysisLimitReached ? t('analysis.actions.limitShort') : t('analysis.actions.newShort')}</span>
                    </>
                  )}
                </motion.button>
                {allAnalysesForCompare.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCompareOpen(true)}
                    className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900/80 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/30 shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center gap-2"
                  >
                    <GitCompare className="w-5 h-5" />
                    <span>{t('analysis.compare.btnOpen')}</span>
                  </motion.button>
                )}

              </div>
            </div>
          </div>
        </motion.div>

        {!isPremium && analysisRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <QuotaAlertBanner
              variant={analysisLimitReached ? 'blocked' : nearAnalysisLimit ? 'warning' : 'info'}
              title={analysisLimitReached ? t('analysis.quota.titleBlocked') : nearAnalysisLimit ? t('analysis.quota.titleWarning') : t('analysis.quota.titleInfo')}
              message={analysisLimitReached
                ? t('analysis.quota.resetDate', { date: formatResetDate(analysisResetAt) })
                : nearAnalysisLimit
                  ? t('analysis.quota.onlyLeft', { count: analysisRemaining ?? 0 })
                  : t('analysis.quota.usedThisMonth', { used: analysisUsed, limit: analysisLimit ?? 0 })}
              used={analysisUsed}
              limit={analysisLimit}
              onUpgrade={onUpgrade}
              upgradeLabel={t('analysis.quota.upgrade')}
            />
          </motion.div>
        )}

        {/* Premium Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/80 via-blue-50/50 to-purple-50/50 dark:from-slate-900/80 dark:via-slate-800/50 dark:to-purple-900/30 border border-white/60 dark:border-slate-700/50 shadow-2xl">
            {/* Animated gradient orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  x: [0, 50, 0],
                  y: [0, 30, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.3, 1, 1.3],
                  x: [0, -30, 0],
                  y: [0, 50, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10 p-8 md:p-12">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-4">
                    {t('analysis.score.globalHealth')}
                  </h2>

                  {/* Circular progress score */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-200 dark:text-slate-700"
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
                        animate={{ strokeDasharray: `${(overallScore / 100) * 553} 553` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      >
                        {overallScore}
                      </motion.span>
                      <span className="text-slate-400 text-sm mt-1">/100</span>
                    </div>
                  </div>
                </motion.div>

                {/* Trend indicator */}
                {scoreChange !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm shadow-lg ${scoreChange > 0
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                        : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                      }`}
                  >
                    {scoreChange > 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span>
                      {t('analysis.score.deltaVsLast', { delta: `${scoreChange > 0 ? '+' : ''}${scoreChange}` })}
                    </span>
                  </motion.div>
                )}

                {/* Stats badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-6 flex flex-wrap justify-center gap-3"
                >
                  <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-blue-200/50 dark:border-slate-600/50 shadow-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalAnalyses || 0}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{t('analysis.score.totalAnalyses')}</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-200/50 dark:border-slate-600/50 shadow-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(stats?.averageHealthScore ?? overallScore)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{t('analysis.score.averageScore')}</div>
                  </div>
                  <button
                    onClick={() => setShowAnalysisHistory(true)}
                    className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-emerald-200/50 dark:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500" />
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">
                        {stats?.totalAnalyses || 0}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{t('analysis.score.viewHistory')}</div>
                  </button>
                  {skinAge !== null && (
                    <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-cyan-200/50 dark:border-slate-600/50 shadow-lg">
                      <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{skinAge}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{t('analysis.score.skinAge')}</div>
                    </div>
                  )}
                </motion.div>

                {/* Skin type */}
                {results?.skinType && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-sm text-slate-600 dark:text-slate-400 mt-4"
                  >
                    {t('analysis.score.skinType')}: <span className="font-bold text-slate-900 dark:text-white capitalize">{results.skinType}</span>
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Weather & Environment Section */}
        {(weatherData || weatherLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-sky-400/90 via-blue-500/90 to-indigo-600/90 dark:from-sky-600/80 dark:via-blue-700/80 dark:to-indigo-800/80 shadow-2xl border border-white/30">
              {/* Animated background effects */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-20 -right-20 w-60 h-60 bg-white/20 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1.5, 1, 1.5],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-300/20 rounded-full blur-3xl"
                />
              </div>

              <div className="relative z-10 p-6 md:p-8 text-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.6 }}
                      className="p-3 bg-white/25 rounded-2xl backdrop-blur-sm shadow-lg"
                    >
                      <Sun className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">{t('analysis.weather.title')}</h3>
                      {weatherData?.location.city && (
                        <div className="flex items-center gap-1.5 text-sm text-white/90">
                          <MapPin className="w-4 h-4" />
                          <span>{weatherData.location.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={loadWeatherData}
                    className="p-3 bg-white/25 rounded-2xl hover:bg-white/35 transition-colors backdrop-blur-sm shadow-lg"
                  >
                    <RefreshCw className={`w-5 h-5 ${weatherLoading ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>

                {weatherLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin mb-3" />
                    <span className="text-lg font-medium">{t('analysis.weather.loading')}</span>
                  </div>
                ) : weatherData ? (
                  <>
                    {/* Weather metrics grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl border border-white/30"
                      >
                        <Sun className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-3xl font-bold">{weatherData.weather.uvIndex.toFixed(1)}</div>
                        <div className="text-sm text-white/80 mt-1">{t('analysis.weather.uvIndex')}</div>
                      </motion.div>

                      {weatherData.weather.aqi !== null && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl border border-white/30"
                        >
                          <Wind className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-3xl font-bold">{weatherData.weather.aqi}</div>
                          <div className="text-sm text-white/80 mt-1">{t('analysis.weather.airQuality')}</div>
                        </motion.div>
                      )}

                      {weatherData.weather.humidity !== null && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          transition={{ delay: 0.3 }}
                          className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl border border-white/30"
                        >
                          <Droplets className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-3xl font-bold">{weatherData.weather.humidity}%</div>
                          <div className="text-sm text-white/80 mt-1">{t('analysis.weather.humidity')}</div>
                        </motion.div>
                      )}

                      {weatherData.weather.temperature !== null && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          transition={{ delay: 0.4 }}
                          className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl border border-white/30"
                        >
                          <Thermometer className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-3xl font-bold">{weatherData.weather.temperature.toFixed(0)}°</div>
                          <div className="text-sm text-white/80 mt-1">{t('analysis.weather.temperature')}</div>
                        </motion.div>
                      )}
                    </div>

                    {/* Premium AI Advice Card */}
                    {weatherData.aiAdvice && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/25 backdrop-blur-lg rounded-2xl p-6 border border-white/40 shadow-2xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-400/30 rounded-xl">
                              <Sparkles className="w-5 h-5 text-yellow-200" />
                            </div>
                            <span className="font-bold text-lg">{t('analysis.weather.aiAdviceTitle')}</span>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${weatherData.aiAdvice.protectionLevel === 'extreme' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                                weatherData.aiAdvice.protectionLevel === 'high' ? 'bg-gradient-to-r from-orange-500 to-amber-600' :
                                  weatherData.aiAdvice.protectionLevel === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                    'bg-gradient-to-r from-green-500 to-emerald-600'
                              }`}
                          >
                            {t('analysis.weather.protectionPrefix')} {weatherData.aiAdvice.protectionLevel === 'extreme' ? t('analysis.weather.protectionExtreme') :
                              weatherData.aiAdvice.protectionLevel === 'high' ? t('analysis.weather.protectionHigh') :
                                weatherData.aiAdvice.protectionLevel === 'medium' ? t('analysis.weather.protectionMedium') : t('analysis.weather.protectionLow')}
                          </motion.span>
                        </div>

                        <p className="text-base text-white/95 mb-4 leading-relaxed">
                          {weatherData.aiAdvice.personalizedMessage}
                        </p>

                        {weatherData.aiAdvice.skinCareRoutine.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <div className="text-sm font-semibold text-white/90 mb-2">{t('analysis.weather.recommendedRoutine')}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {weatherData.aiAdvice.skinCareRoutine.slice(0, 4).map((tip, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.6 + i * 0.1 }}
                                  className="flex items-start gap-2 px-3 py-2 bg-white/15 rounded-xl text-sm"
                                >
                                  <span className="text-green-300 mt-0.5">✓</span>
                                  <span className="text-white/90">{tip}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {weatherData.aiAdvice.warnings.length > 0 && (
                          <div className="mt-3 p-2 bg-red-500/30 rounded-lg">
                            {weatherData.aiAdvice.warnings.map((warning, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Enhanced Alert Banner */}
                    {weatherData.alert && (
                      <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className={`mt-4 p-4 rounded-2xl backdrop-blur-lg border-2 shadow-2xl ${weatherData.alert.severity === 'high'
                            ? 'bg-red-500/30 border-red-300/50' :
                            weatherData.alert.severity === 'medium'
                              ? 'bg-orange-500/30 border-orange-300/50' :
                              'bg-yellow-500/30 border-yellow-300/50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                          >
                            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                          </motion.div>
                          <div className="flex-1">
                            <div className="font-bold text-base mb-1">
                              {weatherData.alert.severity === 'high' ? t('analysis.weather.alertHigh') :
                                weatherData.alert.severity === 'medium' ? t('analysis.weather.alertMedium') : t('analysis.weather.alertInfo')}
                            </div>
                            <p className="text-sm text-white/95 leading-relaxed">{weatherData.alert.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}



        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Radar Chart */}

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className={insightCardClass}>

              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#378ADD] via-[#60A5FA] to-[#22D3EE]" />
              <div className="absolute -right-12 -top-10 w-32 h-32 rounded-full bg-[#378ADD]/10 blur-2xl" />
              <h3 className={insightTitleClass}>{t('analysis.radar.title')}</h3>
              {radarData.length > 0 ? (
                <div className="h-[340px] flex items-center justify-center">
                  <div className="w-full max-w-[430px] mx-auto">
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke={getGridStroke()} strokeDasharray="4 4" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fontSize: 13, fill: isHcHigh ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b', fontWeight: 500 }}
                          tickLine={false}
                          axisLine={false}
                          tickSize={14}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tickCount={5}
                          tick={{ fontSize: 10, fill: isHcHigh ? '#facc15' : isDark ? '#94a3b8' : '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          stroke={getGridStroke()}
                        />
                        <Radar
                          name={t('analysis.radar.score')}
                          dataKey="value"
                          stroke={isHcHigh ? '#00ffff' : '#378ADD'}
                          fill={isHcHigh ? 'rgba(0,255,255,0.18)' : 'rgba(56, 138, 221, 0.25)'}
                          strokeWidth={2}
                          dot={{ r: 5, fill: '#378ADD', stroke: '#ffffff', strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: '#378ADD', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0]?.payload as { category: string; value: number };
                            const value = Number(point?.value ?? 0);
                            const badge = getRadarBadge(value);
                            return (
                              <div className={`rounded-xl border px-3 py-2 shadow-lg ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>
                                <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#e2e8f0]' : 'text-[#0f172a]'}`}>{point?.category}</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>{value}/100</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => generatePdfFromElement()}
                      className="ml-auto px-5 py-2.5 rounded-xl bg-white text-[#0F172A] font-semibold border border-[#CFE3FB] shadow-sm hover:shadow-md hover:border-[#7DD3FC] transition-all flex items-center gap-2"
                    >
                      <Download className="w-5 h-5 text-[#0EA5E9]" />
                      <span>{t('profile.downloadReport')}</span>
                    </motion.button>
                  </div>

                </div>

              ) : (
                <div className="h-[340px] flex items-center justify-center text-[#6B7280]">
                  {t('analysis.radar.noMetrics')}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Analysis Images History */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className={insightCardClass}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#378ADD] via-[#60A5FA] to-[#22D3EE]" />
              <div className="absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-[#378ADD]/10 blur-2xl" />
              <h3 className={insightTitleClass}>{t('analysis.imagesHistory.title')}</h3>
              {analysis.images.length > 0 ? (
                <>
                  <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {analysis.images.map((imgSrc, idx) => (
                      <button
                        key={`${imgSrc}-${idx}`}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative flex-shrink-0 w-40 snap-start overflow-hidden rounded-xl transition-all duration-200 cursor-pointer border ${selectedImageIndex === idx
                            ? 'border-2 border-[#378ADD]'
                            : `${thumbBaseClass} hover:border-[#378ADD] hover:shadow-[0_8px_24px_rgba(56,138,221,0.2)] hover:scale-105`
                          }`}
                      >
                        <img
                          src={imgSrc}
                          alt={t('analysis.imagesHistory.imageAlt', { date: analysisThumbDate })}
                          className="w-full h-[140px] object-cover block"
                        />
                        <span className={`block text-[11px] text-center py-1.5 ${thumbDateClass} ${selectedImageIndex === idx ? 'text-[#378ADD] font-semibold' : 'font-medium'}`}>
                          {analysisThumbDate}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className={previewFrameClass}>
                    <AnimatePresence mode="wait">
                      {selectedImageSrc && (
                        <motion.img
                          key={selectedImageSrc}
                          src={selectedImageSrc}
                          alt={t('analysis.imagesHistory.imageAlt', { date: analysisThumbDate })}
                          className="w-full max-h-[280px] object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="w-full h-80 bg-[#F3F4F6] rounded-xl flex items-center justify-center text-[#6B7280]">
                  {t('analysis.imagesHistory.noImage')}
                </div>
              )}
            </Card>
          </motion.div>
        </div>



        {/* Recommendations */}
        {analysis.recommendations && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
            <Card className="border-[#E2E8F0] shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t('analysis.recommendations.title')}</h3>
                  <p className="text-xs text-[#6B7280]">{t('analysis.aiInsights.subtitle')}</p>

                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Products */}
                {analysis.recommendations.products?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-[#0EA5E9]" />
                      <h4 className="font-bold text-sm">{t('analysis.recommendations.products')}</h4>
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
                      <h4 className="font-bold text-sm">{t('analysis.recommendations.ingredients')}</h4>
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
                      <h4 className="font-bold text-sm">{t('analysis.recommendations.lifestyle')}</h4>
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
                    <h4 className="font-bold text-sm text-[#EF4444]">{t('analysis.recommendations.warnings')}</h4>
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
          <Card className="border-[#BFDBFE] bg-gradient-to-br from-white to-[#F8FBFF] shadow-lg shadow-[#0EA5E9]/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t('analysis.aiInsights.title')}</h3>
                <p className="text-xs text-[#6B7280]">{t('analysis.aiInsights.subtitle')}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-[#334155]">
              {adviceLoading ? (
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('analysis.aiInsights.generating')}</span>
                </div>
              ) : advice ? (
                <div className="rounded-2xl border border-[#DBEAFE] bg-white p-4">
                  <p className="whitespace-pre-line">{advice}</p>
                </div>
              ) : results?.summary ? (
                <div className="rounded-2xl border border-[#DBEAFE] bg-white p-4">
                  <p className="whitespace-pre-line">{results.summary}</p>
                </div>
              ) : (
                <p className="text-[#6B7280]">{t('analysis.aiInsights.empty')}</p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Face Zone Visualization — real scores mapped on first face photo */}
        {analysis.images.length > 0 && results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.88 }}
            className="mt-8 mb-8"
          >
            <FaceZoneVisualization
              imageSrc={analysis.images[0]}
              results={results}
              isDark={isDark}
              isHcHigh={isHcHigh}
            />
          </motion.div>
        )}
        <div style={{ height: "30px" }}></div>
        {/* Predictive Routine - NEW */}
        {hasAnalysis && analysis.id && results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <PredictiveRoutineCard
              analysisId={analysis.id}
              analysisResult={{
                condition: results.conditions?.[0] || t('analysis.defaultCondition'),
                detectedIssues: analysis.conditions || [],
                skinType: results.skinType || 'normal',
              }}
              onNavigateToRoutine={onNavigateToRoutine}
            />
          </motion.div>
        )}

        {/* Analysis History Modal */}
        <AnimatePresence>
          {showAnalysisHistory && (
            <AnalysisHistory onClose={() => setShowAnalysisHistory(false)} />
          )}
        </AnimatePresence>

        {/* Camera Scan Modal */}
        <CameraScanModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onAnalysisSaved={loadData}
          canSaveAnalysis={!analysisLimitReached}
          analysisBlockedMessage={t('analysis.messages.limitReachedReset', { date: formatResetDate(analysisResetAt) })}
          onUpgrade={onUpgrade}
          onNavigateToSettings={onNavigateToSettings}
        />
        <PreocupentSelectorModal
          open={preocupentModalOpen}
          initialSelected={lastSelectedPreocupent}
          onClose={closeUploadPreocupentModal}
          onConfirm={submitUploadWithPreocupent}
          loading={uploadPreocupentSubmitting}
          confirmLabel={t('analysis.actions.startAnalysis')}
        />
        <AnalysisCompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          allAnalyses={allAnalysesForCompare}
          initialA={analysis}
        />
      </div>
    </div>
  );
}
