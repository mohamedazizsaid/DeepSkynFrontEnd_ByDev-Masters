import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Scan, Calendar, MessageCircle, TrendingUp, TrendingDown, Sparkles,
  ArrowRight, Droplets, Fingerprint, Sun, Activity, Clock, Star,
  Shield, Zap, Eye, Heart, Brain, Target, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Images, X
} from 'lucide-react';
import { Button } from '../button';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../../stores/auth.store';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { analysisService } from '../../../lib/services/analysis.service';
import { skinProfileService } from '../../../lib/services/skin-profile.service';
import { calculateScoreChange, formatChartDate, formatAnalysisDate } from '../../../lib/analysis-helpers';
import type { SkinProfile, Analysis, AnalysisStats } from '../../../lib/types';
import { DigitalTwinDashboard } from '../../../components/DigitalTwinDashboard';
import { useSkinJourney } from '../../../hooks/useSkinJourney';
import { SkinSimulationCanvas } from '../../../components/SkinSimulationCanvas';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuthStore();
  const { theme, contrastMode, reduceMotion, t } = useAccessibilityStore();
  const browserReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion || browserReducedMotion;
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Digital Twin hook
  const { 
    journey, 
    isLoading: twinLoading, 
    createPrediction,
    isCreatingPrediction,
  } = useSkinJourney();
  
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<any>(null);
  const [selectedTimelineAnalysisIndex, setSelectedTimelineAnalysisIndex] = useState<number | null>(null);
  const [timelinePhotoViewer, setTimelinePhotoViewer] = useState<{ analysisIndex: number; photoIndex: number } | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineDetailsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, analysis, statsRes, allAnalysesRes] = await Promise.allSettled([
          skinProfileService.getMyProfile(),
          analysisService.getLatest(),
          analysisService.getStats(),
          analysisService.getAll(1, 8),
        ]);
        if (profile.status === 'fulfilled') setSkinProfile(profile.value);
        if (analysis.status === 'fulfilled') setLatestAnalysis(analysis.value);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (allAnalysesRes.status === 'fulfilled') {
          setRecentAnalyses(
            allAnalysesRes.value.analyses.filter((a) => a.status === 'completed').slice(0, 6),
          );
        }
      } catch { /* fallback */ } finally { setDataLoading(false); }
    };
    loadData();
  }, []);

  const skinHealthScore = latestAnalysis?.healthScore ?? skinProfile?.healthScore ?? 0;
  const skinAge = latestAnalysis?.skinAge ?? skinProfile?.skinAge ?? null;
  const userName = user?.given_name || user?.name?.split(' ')[0] || t('nav.profile');
  const scoreChange = calculateScoreChange(stats);

  const realAge = (() => {
    const dob = (user as any)?.dateOfBirth || (skinProfile as any)?.dateOfBirth;
    if (!dob) return 30;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  })();

  const gaugeData = [{ name: 'Score', value: skinHealthScore, fill: 'var(--primary)' }];

  const evolutionData = useMemo(() => {
    if (!stats?.healthScoreHistory?.length) return [];
    const recent = stats.healthScoreHistory.slice(-6);
    return recent.map((entry) => ({
      date: formatChartDate(entry.date),
      score: entry.score,
    }));
  }, [stats]);

  const weeklyTrend = useMemo(() => {
    const history = stats?.healthScoreHistory;
    if (!history || history.length < 2) return null;
    const [prev, curr] = history.slice(-2);
    const diff = curr.score - prev.score;
    return {
      diff,
      up: diff > 0,
      down: diff < 0,
    };
  }, [stats]);

  const scoreInitial = useMemo(() => {
    const history = stats?.healthScoreHistory;
    if (!history?.length) return skinHealthScore;
    return history[0]?.score ?? skinHealthScore;
  }, [stats, skinHealthScore]);

  const scoreProgressFromStart = skinHealthScore - scoreInitial;
  const scoreTopPercentile = Math.max(5, Math.min(95, 110 - skinHealthScore));

  const skinAgeDelta = skinAge !== null ? skinAge - realAge : null;
  const previousSkinAge = recentAnalyses.length > 1 ? (recentAnalyses[1]?.skinAge ?? null) : null;
  const skinAgeTrendDelta = skinAge !== null && previousSkinAge !== null ? skinAge - previousSkinAge : null;
  const skinAgeTrendLabel =
    skinAgeTrendDelta === null ? t('common.stable') : skinAgeTrendDelta < 0 ? 'Amelioration' : skinAgeTrendDelta > 0 ? 'A surveiller' : t('common.stable');

  const detailed = latestAnalysis?.results?.detailedAnalysis;
  const skinMetrics = [
    { label: t('dashboard.hydration'), value: detailed?.hydration?.score ?? 0, color: 'var(--accent-secondary)', icon: <Droplets className="w-4 h-4" /> },
    { label: t('dashboard.texture'), value: detailed?.texture?.score ?? 0, color: 'var(--primary)', icon: <Fingerprint className="w-4 h-4" /> },
    { label: t('dashboard.pigmentation'), value: detailed?.pigmentation?.score ?? 0, color: '#F9A8D4', icon: <Sun className="w-4 h-4" /> },
    { label: t('dashboard.wrinkles'), value: detailed?.wrinkles?.score ?? 0, color: '#FBBF24', icon: <Activity className="w-4 h-4" /> },
  ];

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: t('dashboard.scoreLevel.excellent'), emoji: '🌟', color: '#10B981' };
    if (score >= 60) return { label: t('dashboard.scoreLevel.good'), emoji: '✨', color: 'var(--primary)' };
    if (score >= 40) return { label: t('dashboard.scoreLevel.average'), emoji: '💪', color: '#F59E0B' };
    return { label: t('dashboard.scoreLevel.needsImprovement'), emoji: '🔥', color: '#EF4444' };
  };
  const scoreLevel = getScoreLevel(skinHealthScore);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.greeting.morning');
    if (h < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const greetingPrefix = useMemo(() => `${getGreeting()}, `, [t]);
  const greetingText = useMemo(() => `${greetingPrefix}${userName}`, [greetingPrefix, userName]);

  const [visibleGreetingText, setVisibleGreetingText] = useState('');
  const [shouldWaveGreetingEmoji, setShouldWaveGreetingEmoji] = useState(false);
  const [greetingLoopKey, setGreetingLoopKey] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleGreetingText(greetingText);
      setShouldWaveGreetingEmoji(false);
      return;
    }

    const timeouts: Array<ReturnType<typeof setTimeout>> = [];
    setVisibleGreetingText('');
    setShouldWaveGreetingEmoji(false);

    if (!greetingText.length) return;

    const charDelay = 52;
    const startDelay = 180;
    const holdDelayAfterWave = 3000;

    const revealChars = (index: number) => {
      if (index <= greetingText.length) {
        setVisibleGreetingText(greetingText.slice(0, index));
        timeouts.push(setTimeout(() => revealChars(index + 1), charDelay));
        return;
      }

      setShouldWaveGreetingEmoji(true);
      timeouts.push(
        setTimeout(() => {
          setShouldWaveGreetingEmoji(false);
          setGreetingLoopKey((prev) => prev + 1);
        }, holdDelayAfterWave),
      );
    };

    timeouts.push(setTimeout(() => revealChars(1), startDelay));

    return () => {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [greetingText, greetingLoopKey, shouldReduceMotion]);

  // ─── Accessibility colors ───
  const cardBg = isHcHigh ? 'bg-black border-2 border-yellow-400' : isDark ? 'bg-[#1e293b]/80 backdrop-blur-sm border-[#334155]' : 'bg-white/80 backdrop-blur-sm border-[#E5E7EB]';
  const textPrimary = isHcHigh ? 'text-cyan-400' : isDark ? 'text-gray-100' : 'text-[#111827]';
  const textSecondary = isHcHigh ? 'text-yellow-300' : isDark ? 'text-gray-400' : 'text-[#6B7280]';
  const panelClass = `${cardBg} shadow-lg`;

  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
    borderRadius: '14px',
    color: isDark ? '#e2e8f0' : '#111827',
    boxShadow: isDark ? '0 12px 24px rgba(2,6,23,0.45)' : '0 12px 24px rgba(15,23,42,0.12)',
  };

  const normalizedPredictionState = useMemo(() => {
    const predictedState = currentPrediction?.predictedState;
    if (!predictedState) return null;

    const toNumber = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const baseScore = toNumber(predictedState.healthScore);
    const baseAge = toNumber(predictedState.skinAge);
    const baseRadiance = toNumber(predictedState.radianceScore);

    return {
      healthScore: baseScore !== null ? Math.max(0, Math.min(100, Math.round(baseScore))) : null,
      skinAge: baseAge !== null ? Math.max(14, Math.min(90, Math.round(baseAge))) : null,
      radianceScore:
        baseRadiance !== null ? Math.max(0, Math.min(100, Math.round(baseRadiance))) : null,
    };
  }, [currentPrediction]);

  const predictionVisualFilters = useMemo(() => {
    if (!normalizedPredictionState) return null;

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const predictedHealth = normalizedPredictionState.healthScore ?? skinHealthScore;
    const predictedRadiance = normalizedPredictionState.radianceScore ?? predictedHealth;
    const scoreBoost = predictedHealth - skinHealthScore;

    return {
      smoothness: clamp(20 + scoreBoost * 1.2, 8, 38),
      brightness: clamp((predictedRadiance - 70) / 2.8, -6, 14),
      redness: clamp(-10 - scoreBoost * 0.7, -20, 0),
      saturation: clamp((predictedRadiance - 60) / 10, -6, 8),
      acneReduction: clamp(14 + scoreBoost * 1.4, 6, 34),
      hydration: clamp(18 + (predictedRadiance - 55) * 0.45, 8, 36),
      evenness: clamp(14 + scoreBoost * 0.9, 6, 32),
    };
  }, [normalizedPredictionState, skinHealthScore]);

  const topStats = [
    {
      label: t('dashboard.skinHealth'),
      value: `${skinHealthScore}`,
      icon: <Shield className="w-5 h-5" />,
      color: 'var(--primary)',
      suffix: `/${100}`,
    },
    {
      label: t('dashboard.skinAge'),
      value: skinAge ? `${skinAge}` : '—',
      icon: <Zap className="w-5 h-5" />,
      color: '#0284C7',
      suffix: ` ${t('common.years')}`,
    },
    {
      label: t('dashboard.analyses'),
      value: `${stats?.totalAnalyses ?? 0}`,
      icon: <Eye className="w-5 h-5" />,
      color: 'var(--accent-secondary)',
      suffix: '',
    },
    {
      label: t('dashboard.averageScore'),
      value: `${stats?.averageHealthScore ?? 0}`,
      icon: <Star className="w-5 h-5" />,
      color: 'var(--accent-secondary)',
      suffix: '%',
    },
  ];

  const topStatCardClass = isHcHigh
    ? `${cardBg}`
    : isDark
      ? 'border-[#334155] bg-gradient-to-br from-[#0f172a] via-[#13263a] to-[#0f172a]'
      : 'border-[#E2E8F0] bg-gradient-to-br from-[#F8FBFF] via-[#FFFFFF] to-[#F3FAFF]';

  const mergedScoreAgeCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 relative overflow-hidden border-[#334155] bg-gradient-to-br from-[#0f172a] via-[#13263a] to-[#0f172a] shadow-[0_20px_44px_rgba(14,165,233,0.20)]'
      : 'rounded-2xl border p-6 relative overflow-hidden border-[#E2E8F0] bg-gradient-to-br from-[#F8FBFF] via-[#FFFFFF] to-[#F4FAFF] shadow-[0_16px_34px_rgba(14,165,233,0.10)]';
  const scoreTitleClass = isHcHigh ? textPrimary : isDark ? 'text-white' : 'text-[#0F172A]';
  const scoreInfoClass = isHcHigh ? textSecondary : isDark ? 'text-white/80' : 'text-[#0F172A]/65';
  const scoreIconShellClass = isHcHigh ? 'bg-yellow-400 text-black' : isDark ? 'bg-white/20 text-white' : 'bg-[#0EA5E9]/15 text-[#0284C7]';
  const scoreValueClass = isHcHigh ? 'text-cyan-400' : isDark ? 'text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]' : 'bg-gradient-to-r from-[#0284C7] to-[#06B6D4] bg-clip-text text-transparent';
  const scoreOutOfClass = isHcHigh ? textSecondary : isDark ? 'text-white/85' : 'text-[#334155]';
  const scoreDividerClass = isHcHigh ? 'bg-gradient-to-r from-transparent via-[#0EA5E9]/30 to-transparent' : isDark ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent' : 'bg-gradient-to-r from-transparent via-[#0EA5E9]/35 to-transparent';

  const analysisButtonClass = isHcHigh
    ? 'gap-2 bg-yellow-400 text-black hover:bg-yellow-300'
    : 'gap-2 text-white border-0 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#06B6D4] shadow-[0_12px_26px_rgba(14,165,233,0.35)] hover:shadow-[0_16px_30px_rgba(14,165,233,0.45)]';

  const mergedSubCardClass = isHcHigh
    ? 'rounded-2xl p-4 border border-yellow-400/60 bg-black/10'
    : isDark
      ? 'rounded-2xl p-4 border border-white/15 bg-white/5 backdrop-blur-sm'
      : 'rounded-2xl p-4 border border-white/70 bg-white/65 backdrop-blur-sm shadow-[0_10px_24px_rgba(14,165,233,0.12)]';

  const metricsCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#10222f] via-[#111827] to-[#1a2432] shadow-[0_14px_30px_rgba(6,182,212,0.20)]'
      : 'rounded-2xl border p-6 border-[#E2E8F0] bg-gradient-to-br from-[#F8FBFF] via-[#FFFFFF] to-[#F3FAFF] shadow-[0_12px_26px_rgba(14,165,233,0.10)]';

  const evolutionCardClass = isHcHigh
    ? `rounded-2xl border p-6 mb-8 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 mb-8 border-[#334155] bg-gradient-to-br from-[#0f1d2d] via-[#11263a] to-[#0f1d2d] shadow-[0_16px_32px_rgba(14,165,233,0.18)]'
      : 'rounded-2xl border p-6 mb-8 border-[#E2E8F0] bg-gradient-to-br from-[#F3FAFF] via-[#FFFFFF] to-[#F3FAFF] shadow-[0_14px_30px_rgba(14,165,233,0.10)]';

  const evolutionChartLineColor = isHcHigh ? '#111827' : 'var(--primary)';
  const evolutionChartGridColor = isHcHigh ? (isDark ? '#334155' : '#E5E7EB') : isDark ? 'rgba(148,163,184,0.24)' : 'rgba(148,163,184,0.28)';
  const evolutionChartAxisColor = isHcHigh ? (isDark ? '#E2E8F0' : '#374151') : isDark ? 'rgba(226,232,240,0.88)' : 'rgba(71,85,105,0.85)';
  const evolutionTitleClass = isHcHigh ? textPrimary : isDark ? 'text-white' : 'text-[#0F172A]';
  const evolutionSubtitleClass = isHcHigh ? textSecondary : isDark ? 'text-slate-300' : 'text-[#475569]';
  const evolutionButtonClass = isHcHigh
    ? ''
    : isDark
      ? 'text-slate-100 hover:text-white hover:bg-white/10 border border-white/20'
      : 'text-[#0EA5E9] hover:text-[#0284C7] hover:bg-[#E0F2FE] border border-[#BAE6FD]';

  const quickActionsCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#132334] via-[#0f172a] to-[#1a2236] shadow-[0_14px_30px_rgba(14,165,233,0.16)]'
      : 'rounded-2xl border p-6 border-[#E2E8F0] bg-gradient-to-br from-[#F8FBFF] via-[#FFFFFF] to-[#F3FAFF] shadow-[0_12px_26px_rgba(14,165,233,0.10)]';
  const quickActionsHeroClass = isHcHigh
    ? 'w-full p-4 sm:p-5 rounded-2xl border border-yellow-400 transition-all duration-200 hover:shadow-md group text-left hover:bg-yellow-400/10'
    : isDark
      ? 'w-full p-4 sm:p-5 rounded-2xl border border-[#334155] transition-all duration-200 hover:shadow-md group text-left hover:border-[#22D3EE] bg-gradient-to-r from-[#0f172a]/90 to-[#12283a]/70'
      : 'w-full p-4 sm:p-5 rounded-2xl border border-[#DBEAFE] transition-all duration-200 hover:shadow-md group text-left bg-gradient-to-r from-[#F7FBFF] via-[#FFFFFF]/80 to-[#F0F9FF] hover:border-[#7DD3FC]';
  const quickActionsCompactClass = isHcHigh
    ? 'flex flex-col items-center gap-3 p-4 rounded-xl border border-yellow-400 transition-all duration-200 hover:shadow-md group hover:bg-yellow-400/10'
    : isDark
      ? 'flex flex-col items-center gap-3 p-4 rounded-xl border border-[#334155] transition-all duration-200 hover:shadow-md group hover:border-[#22D3EE] bg-gradient-to-b from-[#0f172a]/90 to-[#13293b]/70'
      : 'flex flex-col items-center gap-3 p-4 rounded-xl border border-[#DBEAFE] transition-all duration-200 hover:shadow-md group bg-gradient-to-b from-[#F8FBFF] to-[#F0F9FF] hover:border-[#7DD3FC]';

  const quickActionsInnerShellClass = isHcHigh
    ? 'rounded-2xl border border-yellow-400/60 p-3'
    : isDark
      ? 'rounded-2xl border border-[#334155] p-3 bg-black/10'
      : 'rounded-2xl border border-[#DBEAFE] p-3 bg-gradient-to-br from-white/70 via-[#F8FBFF]/70 to-[#F0F9FF]/75';

  const activityCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#0f1d2d] via-[#111827] to-[#17263a] shadow-[0_14px_30px_rgba(14,165,233,0.16)]'
      : 'rounded-2xl border p-6 border-[#E2E8F0] bg-gradient-to-br from-[#F4FAFF] via-[#FFFFFF] to-[#F5FAFF] shadow-[0_12px_26px_rgba(14,165,233,0.10)]';

  const activityItemClass = isHcHigh
    ? 'flex items-start gap-3 p-3 rounded-xl border border-yellow-400/50'
    : isDark
      ? 'flex items-start gap-3 p-3 rounded-xl border border-[#334155] bg-gradient-to-r from-[#0f172a]/85 to-[#172033]/70'
      : 'flex items-start gap-3 p-3 rounded-xl border border-white/80 bg-gradient-to-r from-white to-[#F8FAFC] shadow-[0_8px_18px_rgba(15,23,42,0.06)]';

  const detailSurfaceClass = isHcHigh
    ? 'rounded-xl p-4 text-center border border-yellow-400/50'
    : isDark
      ? 'rounded-xl p-4 text-center border border-[#334155] bg-gradient-to-r from-[#111827] to-[#1a2233]'
      : 'rounded-xl p-4 text-center border border-[#E5E7EB] bg-gradient-to-r from-white to-[#F8FAFC]';

  const ageRowClass = isHcHigh
    ? 'rounded-xl p-3 border border-yellow-400/50'
    : isDark
      ? 'rounded-xl p-3 border border-[#334155] bg-gradient-to-r from-[#0f172a]/80 to-[#172033]/65'
      : 'rounded-xl p-3 border border-[#E5E7EB] bg-gradient-to-r from-white to-[#F8FAFC]';

  const metricsRowClass = isHcHigh
    ? 'rounded-xl p-3 border border-yellow-400/50'
    : isDark
      ? 'rounded-xl p-3 border border-[#334155] bg-gradient-to-r from-[#0f172a]/80 to-[#152436]/60'
      : 'rounded-xl p-3 border border-[#E5E7EB] bg-gradient-to-r from-white to-[#F0FDFF]';

  const quickActions = [
    {
      id: 'analysis',
      icon: <Scan className="w-5 h-5" />,
      title: t('dashboard.newAnalysis'),
      description: t('dashboard.scanFace'),
      gradient: 'from-[#0EA5E9] to-[#06B6D4]',
      onClick: () => onNavigate('analysis')
    },
    {
      id: 'routine',
      icon: <Calendar className="w-5 h-5" />,
      title: t('dashboard.myRoutine'),
      description: t('dashboard.dailySteps'),
      gradient: 'from-[#2563EB] to-[#0EA5E9]',
      onClick: () => onNavigate('routine')
    },
    {
      id: 'chat',
      icon: <MessageCircle className="w-5 h-5" />,
      title: t('dashboard.aiCoach'),
      description: t('dashboard.personalizedAdvice'),
      gradient: 'from-[#0EA5E9] to-[#06B6D4]',
      onClick: () => onNavigate('chat')
    },
    {
      id: 'community',
      icon: <Heart className="w-5 h-5" />,
      title: t('dashboard.communityAction'),
      description: t('dashboard.shareDiscover'),
      gradient: 'from-[#0369A1] to-[#0EA5E9]',
      onClick: () => onNavigate('community')
    },
  ];

  const quickActionById = (id: 'analysis' | 'routine' | 'chat' | 'community') =>
    quickActions.find((action) => action.id === id) ?? quickActions[0];

  const quickActionItems = useMemo(() => {
    const latestDate = latestAnalysis?.createdAt ? formatAnalysisDate(latestAnalysis.createdAt) : 'Aucune';
    const trendLabel = scoreChange > 0 ? `+${scoreChange}` : scoreChange < 0 ? `${scoreChange}` : 'Stable';
    const trendTone = scoreChange > 0 ? 'text-[#10B981]' : scoreChange < 0 ? 'text-[#EF4444]' : textPrimary;

    return [
      {
        label: 'Dernier score',
        value: `${latestAnalysis?.healthScore ?? skinHealthScore}/100`,
        icon: <Shield className="w-3.5 h-3.5" />,
        valueClass: textPrimary,
      },
      {
        label: 'Tendance',
        value: trendLabel,
        icon: scoreChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />,
        valueClass: trendTone,
      },
      {
        label: 'Analyses',
        value: `${stats?.totalAnalyses ?? 0}`,
        icon: <Activity className="w-3.5 h-3.5" />,
        valueClass: textPrimary,
      },
      {
        label: 'Dernier scan',
        value: latestDate,
        icon: <Clock className="w-3.5 h-3.5" />,
        valueClass: textPrimary,
      },
    ];
  }, [latestAnalysis, skinHealthScore, scoreChange, stats, textPrimary]);

  const heroAction = useMemo(() => {
    const totalAnalyses = stats?.totalAnalyses ?? 0;

    // First-time users should be guided to their first analysis.
    if (!latestAnalysis || totalAnalyses === 0) {
      return quickActionById('analysis');
    }

    // If analysis is running, guide users to AI coach while waiting.
    if (latestAnalysis.status === 'processing') {
      return quickActionById('chat');
    }

    // Low score: prioritize coaching recommendations.
    if (skinHealthScore < 55) {
      return quickActionById('chat');
    }

    // Negative trend: encourage a new scan.
    if (scoreChange < 0) {
      return quickActionById('analysis');
    }

    // Otherwise suggest routine continuity.
    return quickActionById('routine');
  }, [latestAnalysis, stats, skinHealthScore, scoreChange, quickActions]);

  const compactActions = quickActions.filter((action) => action.id !== heroAction.id);

  const selectedTimelineAnalysis =
    selectedTimelineAnalysisIndex !== null ? recentAnalyses[selectedTimelineAnalysisIndex] : null;
  const previousTimelineAnalysis =
    selectedTimelineAnalysisIndex !== null ? recentAnalyses[selectedTimelineAnalysisIndex + 1] : null;
  const timelineAnalyses = useMemo(
    () =>
      recentAnalyses.map((analysis, index) => {
        const d = new Date(analysis.createdAt);
        return {
          ...analysis,
          index,
          monthLabel: new Intl.DateTimeFormat('fr-FR', { month: 'short' })
            .format(d)
            .replace('.', ''),
          dayLabel: new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(d),
        };
      }),
    [recentAnalyses],
  );
  const activeTimelineAnalysis = selectedTimelineAnalysis ?? recentAnalyses[0] ?? null;
  const timelineViewerAnalysis =
    timelinePhotoViewer !== null ? recentAnalyses[timelinePhotoViewer.analysisIndex] ?? null : null;
  const timelineViewerImages = timelineViewerAnalysis?.images ?? [];
  const activeTimelineViewerPhoto =
    timelinePhotoViewer !== null
      ? timelineViewerImages[timelinePhotoViewer.photoIndex] ?? timelineViewerImages[0] ?? null
      : null;

  const openTimelinePhotoViewer = (analysisIndex: number, photoIndex = 0) => {
    setTimelinePhotoViewer({ analysisIndex, photoIndex });
  };

  const scrollTimeline = (direction: 'left' | 'right') => {
    const node = timelineScrollRef.current;
    if (!node) return;
    node.scrollBy({ left: direction === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  const scrollTimelineDetails = (direction: 'up' | 'down') => {
    const node = timelineDetailsScrollRef.current;
    if (!node) return;
    node.scrollBy({ top: direction === 'up' ? -220 : 220, behavior: 'smooth' });
  };

  const timelineEvolution = useMemo(() => {
    if (!selectedTimelineAnalysis || !previousTimelineAnalysis) {
      return {
        hasPrevious: false,
        hasEvolution: false,
        healthScoreChange: 0,
        skinAgeChange: 0,
        newConditions: [] as string[],
        resolvedConditions: [] as string[],
      };
    }

    const healthScoreChange =
      (selectedTimelineAnalysis.healthScore ?? 0) - (previousTimelineAnalysis.healthScore ?? 0);
    const skinAgeChange =
      (selectedTimelineAnalysis.skinAge ?? 0) - (previousTimelineAnalysis.skinAge ?? 0);
    const currentConditions = new Set(selectedTimelineAnalysis.conditions || []);
    const prevConditions = new Set(previousTimelineAnalysis.conditions || []);
    const newConditions = [...currentConditions].filter((c) => !prevConditions.has(c));
    const resolvedConditions = [...prevConditions].filter((c) => !currentConditions.has(c));
    const hasEvolution =
      healthScoreChange !== 0 ||
      skinAgeChange !== 0 ||
      newConditions.length > 0 ||
      resolvedConditions.length > 0;

    return {
      hasPrevious: true,
      hasEvolution,
      healthScoreChange,
      skinAgeChange,
      newConditions,
      resolvedConditions,
    };
  }, [selectedTimelineAnalysis, previousTimelineAnalysis]);

  if (dataLoading) {
    return (
      <div className="px-4 sm:px-8 pb-12 max-w-7xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className={`h-10 w-72 rounded-xl ${isDark ? 'bg-[#334155]' : 'bg-[#E5E7EB]'}`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${cardBg}`}>
                <div className={`h-4 w-28 rounded ${isDark ? 'bg-[#334155]' : 'bg-[#E5E7EB]'}`} />
                <div className={`h-8 w-20 rounded mt-3 ${isDark ? 'bg-[#334155]' : 'bg-[#E5E7EB]'}`} />
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-80 rounded-2xl border ${cardBg}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-8 pb-12 max-w-7xl mx-auto">

      {/* ═══ Welcome Header ═══ */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>
              <motion.span
                key={`typed-greeting-${greetingLoopKey}`}
                initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="inline"
              >
                {visibleGreetingText.slice(0, greetingPrefix.length)}
                <span className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                  {visibleGreetingText.length > greetingPrefix.length
                    ? visibleGreetingText.slice(greetingPrefix.length)
                    : ''}
                </span>
              </motion.span>
              {visibleGreetingText.length < greetingText.length && (
                <motion.span
                  className="inline-block ml-1 text-[#0EA5E9]"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                >
                  |
                </motion.span>
              )}
              <span className="inline-block w-2" />
              <motion.span
                className="inline-block"
                animate={
                  shouldWaveGreetingEmoji
                    ? { rotate: [0, 18, -10, 18, -6, 0], y: [0, -2, 0] }
                    : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.9, ease: 'easeInOut' }}
              >
                👋
              </motion.span>
            </h1>
            <p className={`${textSecondary} mt-1`}>{t('dashboard.skinOverview')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${isDark ? 'bg-[#0f172a] text-[#93C5FD]' : 'bg-[#EFF6FF] text-[#0EA5E9]'}`}>
                <Activity className="w-3.5 h-3.5" />
                {t('dashboard.analyses')}: {stats?.totalAnalyses ?? 0}
              </span>
              {latestAnalysis?.createdAt && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${isDark ? 'bg-[#0f172a] text-gray-300' : 'bg-[#F3F4F6] text-[#374151]'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {formatAnalysisDate(latestAnalysis.createdAt)}
                </span>
              )}
            </div>
          </div>
          <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
            <Button onClick={() => onNavigate('analysis')} className={analysisButtonClass}>
              <Scan className="w-4 h-4" />
              {t('dashboard.newAnalysis')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ Top Stats Row ═══ */}
      <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {topStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.05 * i, duration: 0.35, ease: 'easeOut' }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-lg ${topStatCardClass}`}
          >
            {!isHcHigh && (
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#38BDF8] via-[#22D3EE] to-[#0EA5E9]" />
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: stat.color + '15' }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              <span className={`text-xs font-medium ${textSecondary}`}>{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</span>
              <span className={`text-xs ${textSecondary}`}>{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ Main Content Grid ═══ */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Score + Age Combined Premium Card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.1, duration: 0.4, ease: 'easeOut' }}
          className={`lg:col-span-2 ${mergedScoreAgeCardClass}`}
          data-tour="dashboard-score"
        >
          {!isHcHigh && (
            <>
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#38BDF8] via-[#22D3EE] to-[#0EA5E9]" />
              <div className="pointer-events-none absolute -top-14 -right-10 w-40 h-40 rounded-full bg-[#0EA5E9]/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-[#06B6D4]/10 blur-3xl" />
            </>
          )}
          <div className="relative z-10 grid md:grid-cols-2 gap-4 pt-1">
            <div className={mergedSubCardClass}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${scoreIconShellClass}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className={`text-base font-bold ${scoreTitleClass}`}>{t('dashboard.globalScore')}</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: scoreLevel.color + '15', color: scoreLevel.color }}>
                  {scoreLevel.emoji} {scoreLevel.label}
                </span>
              </div>
              {!isHcHigh && (
                <p className={`text-[11px] font-medium mb-2 ${scoreInfoClass}`}>Indicateur principal de votre progression cutanee</p>
              )}
              <div className="relative w-44 h-44 mx-auto my-2">
                {!isHcHigh && <div className="absolute inset-2 rounded-full border border-white/30 shadow-[inset_0_0_30px_rgba(255,255,255,0.12)]" />}
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                    <RadialBar dataKey="value" cornerRadius={12} fill="url(#scoreGrad)" background={{ fill: isDark ? '#334155' : '#F3F4F6' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className={`text-4xl font-bold ${scoreValueClass}`}>{skinHealthScore}</div>
                  <div className={`text-xs ${scoreOutOfClass}`}>{t('common.outOf100')}</div>
                </div>
              </div>
              <div className={`h-px w-full my-3 ${scoreDividerClass}`} />
              <div className="flex flex-wrap items-center justify-center gap-2">
                {weeklyTrend && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${weeklyTrend.up ? 'bg-[#10B981]/10 text-[#10B981]' : weeklyTrend.down ? 'bg-[#EF4444]/10 text-[#EF4444]' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    {weeklyTrend.up ? <TrendingUp className="w-3 h-3" /> : weeklyTrend.down ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                    Hebdo {weeklyTrend.diff > 0 ? '+' : ''}{weeklyTrend.diff}
                  </span>
                )}
                {scoreChange !== 0 ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    scoreChange > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                  }`}>
                    {scoreChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {scoreChange > 0 ? '+' : ''}{scoreChange} {t('common.thisMonth')}
                  </span>
                ) : stats && stats.totalAnalyses > 0 ? (
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    → {t('common.stable')}
                  </span>
                ) : null}
              </div>
              <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'} grid grid-cols-3 gap-2`}>
                <div className="text-center">
                  <p className={`text-lg font-bold ${textPrimary}`}>{scoreInitial}</p>
                  <p className={`text-[11px] ${textSecondary}`}>Score initial</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${scoreProgressFromStart >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {scoreProgressFromStart > 0 ? '+' : ''}{scoreProgressFromStart}
                  </p>
                  <p className={`text-[11px] ${textSecondary}`}>Progression</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${textPrimary}`}>{stats?.totalAnalyses ?? 0}</p>
                  <p className={`text-[11px] ${textSecondary}`}>{t('dashboard.analyses')}</p>
                </div>
              </div>
            </div>

            <div className={mergedSubCardClass}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-base font-bold ${textPrimary} flex items-center gap-2`}>
                  <Clock className="w-4 h-4 text-[#0EA5E9]" />
                  {t('dashboard.ageComparison')}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isDark ? 'bg-[#0EA5E9]/15 text-[#7DD3FC]' : 'bg-[#E0F2FE] text-[#0369A1]'}`}>
                  Age Insight
                </span>
              </div>
              <div className="space-y-5">
                <div className={ageRowClass}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${textSecondary} flex items-center gap-2`}><Clock className="w-3.5 h-3.5" /> {t('dashboard.realAge')}</span>
                    <span className={`text-xl font-bold ${textPrimary}`}>{realAge}</span>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
                    <motion.div className="h-full bg-gradient-to-r from-[#6B7280] to-[#9CA3AF] rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(realAge, 100)}%` }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.2 }} />
                  </div>
                </div>
                <div className={ageRowClass}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${textSecondary} flex items-center gap-2`}><Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" /> {t('dashboard.skinAge')}</span>
                    <span className="text-xl font-bold text-[#0EA5E9]">{skinAge ?? '—'}</span>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
                    <motion.div className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(skinAge ?? 0, 100)}%` }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.3 }} />
                  </div>
                </div>
                {skinAge !== null ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className={`rounded-xl p-4 text-center ${realAge > skinAge ? 'bg-[#10B981]/10' : realAge === skinAge ? (isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]') : 'bg-[#F59E0B]/10'}`}>
                    <p className={`text-sm font-semibold ${realAge > skinAge ? 'text-[#10B981]' : realAge === skinAge ? textSecondary : 'text-[#F59E0B]'}`}>
                      {realAge > skinAge
                        ? t('dashboard.skinYounger').replace('{years}', (realAge - skinAge).toString())
                        : realAge === skinAge
                          ? t('dashboard.skinSameAge')
                          : t('dashboard.skinOlder').replace('{years}', (skinAge - realAge).toString())}
                    </p>
                  </motion.div>
                ) : (
                  <div className={detailSurfaceClass}>
                    <p className={`text-sm ${textSecondary}`}>{t('dashboard.doAnalysis')}</p>
                  </div>
                )}

                <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'} grid grid-cols-3 gap-2`}>
                  <div>
                    <p className={`text-lg font-bold ${textPrimary}`}>{skinAgeDelta === null ? '—' : `${skinAgeDelta > 0 ? '+' : ''}${skinAgeDelta}`}</p>
                    <p className={`text-[11px] ${textSecondary}`}>Ecart</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${skinAgeTrendDelta === null ? textPrimary : skinAgeTrendDelta < 0 ? 'text-[#10B981]' : skinAgeTrendDelta > 0 ? 'text-[#F59E0B]' : textPrimary}`}>
                      {skinAgeTrendLabel}
                    </p>
                    <p className={`text-[11px] ${textSecondary}`}>Tendance</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${textPrimary}`}>Top {scoreTopPercentile}%</p>
                    <p className={`text-[11px] ${textSecondary}`}>Percentile</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skin Metrics */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.3, duration: 0.4, ease: 'easeOut' }}
          className={`relative overflow-hidden ${metricsCardClass}`}
        >
          {!isHcHigh && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#06B6D4] via-[#0EA5E9] to-[#F9A8D4]" />}
          <div className="flex items-center justify-between mb-5 pt-1">
            <h3 className={`text-base font-bold ${textPrimary} flex items-center gap-2`}>
              <Activity className="w-4 h-4 text-[#06B6D4]" />
              {t('dashboard.skinMetrics')}
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isDark ? 'bg-[#06B6D4]/15 text-[#67E8F9]' : 'bg-[#ECFEFF] text-[#0E7490]'}`}>
              Live Metrics
            </span>
          </div>
          <div className="space-y-4">
            {skinMetrics.map((metric, index) => (
              <div key={index} className={metricsRowClass}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${textSecondary} flex items-center gap-2`}>
                    <span style={{ color: metric.color }}>{metric.icon}</span>
                    {metric.label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: metric.color }}>{metric.value}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: metric.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.35 + index * 0.08 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => onNavigate('analysis')}
            className={`w-full mt-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              isHcHigh ? 'bg-yellow-400 text-black' : 'bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20'
            }`}
          >
            {t('dashboard.seeDetails')} <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      </div>

      {/* ═══ Evolution Chart ═══ */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.4, duration: 0.4, ease: 'easeOut' }}
        className={evolutionCardClass}
        data-tour="dashboard-evolution"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-base font-bold ${evolutionTitleClass}`}>{t('dashboard.healthEvolution')}</h3>
            <p className={`text-xs ${evolutionSubtitleClass} mt-0.5`}>{t('dashboard.progressionOverTime')}</p>
          </div>
          <Button variant="ghost" size="sm" className={evolutionButtonClass} onClick={() => onNavigate('evolution')}>
            {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="h-56">
          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={evolutionChartLineColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={evolutionChartLineColor} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={evolutionChartGridColor} />
                <XAxis dataKey="date" stroke={evolutionChartAxisColor} fontSize={12} />
                <YAxis stroke={evolutionChartAxisColor} domain={[0, 100]} fontSize={12} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                  formatter={(value) => [`${value}/100`, t('dashboard.globalScore')]}
                  labelFormatter={(label) => `${t('common.date')}: ${label}`}
                />
                <Area type="monotone" dataKey="score" stroke={evolutionChartLineColor} strokeWidth={3} fill="url(#areaFill)" dot={{ fill: evolutionChartLineColor, r: 5, strokeWidth: 2, stroke: isHcHigh ? '#111827' : '#0E7490' }} activeDot={{ r: 7, fill: evolutionChartLineColor, stroke: isHcHigh ? '#111827' : '#0E7490' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center gap-3 ${textSecondary}`}>
              <Activity className="w-10 h-10 opacity-30" />
              <p className="text-sm text-center">{t('dashboard.completeAnalyses')}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ Quick Actions + Recent Activity ═══ */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5, duration: 0.4, ease: 'easeOut' }}
          className={`relative overflow-hidden ${quickActionsCardClass}`}
          data-tour="dashboard-quick-actions"
        >
          {!isHcHigh && (
            <>
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0EA5E9] via-[#22D3EE] to-[#0EA5E9]" />
              <div className="pointer-events-none absolute -right-10 -top-12 w-32 h-32 rounded-full bg-[#0EA5E9]/8 blur-2xl" />
              <div className="pointer-events-none absolute -left-8 bottom-8 w-24 h-24 rounded-full bg-[#22D3EE]/8 blur-2xl" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(14,165,233,0.28) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            </>
          )}
          <div className="flex items-center justify-between mb-4 pt-1">
            <h3 className={`text-base font-bold ${textPrimary} flex items-center gap-2`}>
              <Zap className="w-4 h-4 text-[#0EA5E9]" />
              {t('dashboard.quickActions')}
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isDark ? 'bg-[#06B6D4]/15 text-[#67E8F9]' : 'bg-[#EFF6FF] text-[#0369A1] border border-[#BAE6FD]/80'}`}>
              Smart Flow
            </span>
          </div>
          <div className={`relative z-10 space-y-4 ${quickActionsInnerShellClass}`}>
            <motion.button
              onClick={heroAction.onClick}
              className={quickActionsHeroClass}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${heroAction.gradient} shadow-sm`}>
                    {heroAction.icon}
                  </div>
                  <div>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-1.5 ${isDark ? 'bg-[#0EA5E9]/15 text-[#7DD3FC]' : 'bg-[#E0F2FE] text-[#0369A1]'}`}>
                      Recommandé
                    </div>
                    <div className={`text-sm font-bold ${textPrimary} group-hover:text-[#0EA5E9] transition-colors`}>{heroAction.title}</div>
                    <div className={`text-xs ${textSecondary} mt-0.5`}>{heroAction.description}</div>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 ${isHcHigh ? 'text-yellow-400' : 'text-[#0EA5E9]'}`} />
              </div>
            </motion.button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {compactActions.map((action, index) => (
              <motion.button
                key={index + 1}
                onClick={action.onClick}
                className={quickActionsCompactClass}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${action.gradient} shadow-sm`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${textPrimary} group-hover:text-[#0EA5E9] transition-colors`}>{action.title}</div>
                  <div className={`text-[10px] ${textSecondary} mt-0.5`}>{action.description}</div>
                </div>
              </motion.button>
            ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {quickActionItems.map((item, itemIndex) => (
                <div
                  key={`quick-item-${itemIndex}`}
                  className={`rounded-lg border px-2.5 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-[#DBEAFE] bg-white/70'}`}
                >
                  <p className={`text-[10px] ${textSecondary} flex items-center gap-1.5`}>
                    <span className={`${isDark ? 'text-[#67E8F9]' : 'text-[#0EA5E9]'}`}>{item.icon}</span>
                    {item.label}
                  </p>
                  <p className={`text-[12px] font-semibold mt-1 ${item.valueClass}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.6, duration: 0.4, ease: 'easeOut' }}
          className={`relative overflow-hidden ${activityCardClass}`}
        >
          {!isHcHigh && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0EA5E9] via-[#22D3EE] to-[#0EA5E9]" />}
          <div className="flex items-center justify-between mb-4 pt-1">
            <h3 className={`text-base font-bold ${textPrimary} flex items-center gap-2`}>
              <Activity className="w-4 h-4 text-[#0EA5E9]" />
              {t('dashboard.recentActivity')}
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isDark ? 'bg-[#0EA5E9]/15 text-[#7DD3FC]' : 'bg-[#EFF6FF] text-[#0369A1] border border-[#BAE6FD]/80'}`}>
              Timeline IA
            </span>
          </div>
          <div className="space-y-4">
            {recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-[#334155] bg-transparent' : 'border-[#DBEAFE] bg-transparent'}`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className={`text-xs font-medium ${textSecondary}`}>Parcourez vos scans dans le temps</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollTimeline('left')}
                        className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${isDark ? 'border-white/15 hover:bg-white/10 text-gray-300' : 'border-[#D1D5DB] hover:bg-[#E5E7EB] text-[#4B5563]'}`}
                        aria-label="Faire défiler vers la gauche"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollTimeline('right')}
                        className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${isDark ? 'border-white/15 hover:bg-white/10 text-gray-300' : 'border-[#D1D5DB] hover:bg-[#E5E7EB] text-[#4B5563]'}`}
                        aria-label="Faire défiler vers la droite"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    {!isHcHigh && (
                      <>
                        <div className={`pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 ${isDark ? 'bg-gradient-to-r from-[#111827] to-transparent' : 'bg-gradient-to-r from-[#F8FBFF] to-transparent'}`} />
                        <div className={`pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 ${isDark ? 'bg-gradient-to-l from-[#111827] to-transparent' : 'bg-gradient-to-l from-[#F8FBFF] to-transparent'}`} />
                      </>
                    )}

                    <div
                      ref={timelineScrollRef}
                      className="relative overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]"
                      style={{ scrollbarColor: isDark ? '#475569 transparent' : '#94A3B8 transparent' }}
                    >
                    <div className="relative min-w-[640px] px-3 pt-20 pb-10">
                      <div className={`absolute left-3 right-3 top-[118px] h-px ${isDark ? 'bg-[#475569]' : 'bg-[#CBD5E1]'}`} />
                      <div className="relative flex items-end justify-between gap-6">
                        {timelineAnalyses.map((item, index) => {
                          const active = selectedTimelineAnalysisIndex === index;
                          return (
                            <motion.button
                              type="button"
                              key={item.id}
                              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.62 + index * 0.05, duration: 0.25 }}
                              onClick={() => setSelectedTimelineAnalysisIndex(index)}
                              className="relative flex min-w-[84px] snap-center flex-col items-center text-center"
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openTimelinePhotoViewer(index, 0);
                                }}
                                className={`absolute -top-[76px] w-14 h-14 rounded-2xl overflow-hidden border shadow-md transition-all ${
                                  active
                                    ? 'scale-105 border-[#0EA5E9] shadow-[0_12px_20px_rgba(14,165,233,0.28)]'
                                    : isDark
                                      ? 'border-white/25'
                                      : 'border-white'
                                }`}
                                aria-label="Voir la photo agrandie"
                              >
                                {item.images?.[0] ? (
                                  <img src={item.images[0]} alt="analysis" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#1e293b]' : 'bg-[#F3F4F6]'}`}>
                                    <Scan className="w-4 h-4 text-[#0EA5E9]" />
                                  </div>
                                )}
                              </button>

                              <div className={`mb-2 h-10 w-px ${active ? 'bg-[#0EA5E9]' : isDark ? 'bg-[#64748B]' : 'bg-[#94A3B8]'}`} />
                              <div
                                className={`z-10 h-3 w-3 rounded-full transition-all ${
                                  active
                                    ? 'bg-[#0EA5E9] ring-4 ring-[#0EA5E9]/25'
                                    : isDark
                                      ? 'bg-[#94A3B8]'
                                      : 'bg-[#64748B]'
                                }`}
                              />

                              <div className="mt-3">
                                <p className={`text-[11px] uppercase tracking-wide font-semibold ${active ? 'text-[#0EA5E9]' : textSecondary}`}>
                                  {item.monthLabel}
                                </p>
                                <p className={`text-xs font-medium ${textSecondary}`}>{item.dayLabel}</p>
                              </div>

                              <span
                                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  active
                                    ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/20'
                                    : isDark
                                      ? 'bg-white/10 text-gray-300 border border-white/10'
                                      : 'bg-transparent text-[#334155] border border-[#CBD5E1]'
                                }`}
                              >
                                {item.healthScore ?? 0}/100
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className={`mt-3 rounded-xl border p-3 ${isDark ? 'border-[#334155] bg-[#111827]/50' : 'border-[#E2E8F0] bg-transparent'}`}>
                    {activeTimelineAnalysis && (
                      <>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-sm font-semibold ${textPrimary}`}>Analyse cutanée</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0EA5E9]/15 to-[#8B5CF6]/10 text-[#0EA5E9] border border-[#0EA5E9]/20">
                            {activeTimelineAnalysis.healthScore ?? 0}/100
                          </span>
                          <span className={`text-[11px] ${textSecondary}`}>
                            {formatAnalysisDate(activeTimelineAnalysis.createdAt)}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'border-[#334155] text-gray-300 bg-white/5' : 'border-[#CBD5E1] text-[#475569] bg-transparent'}`}>
                            <Images className="w-3 h-3" />
                            {activeTimelineAnalysis.images?.length ?? 0} photo(s)
                          </span>
                        </div>

                        {!!activeTimelineAnalysis.images?.length && (
                          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" style={{ scrollbarColor: isDark ? '#475569 transparent' : '#94A3B8 transparent' }}>
                            {activeTimelineAnalysis.images.map((image, imageIndex) => (
                              <button
                                key={`${activeTimelineAnalysis.id}-thumb-${imageIndex}`}
                                type="button"
                                onClick={() =>
                                  openTimelinePhotoViewer(
                                    selectedTimelineAnalysisIndex ?? 0,
                                    imageIndex,
                                  )
                                }
                                className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border transition-all hover:scale-105 ${isDark ? 'border-white/20' : 'border-[#CBD5E1]'}`}
                                aria-label={`Voir la photo ${imageIndex + 1}`}
                              >
                                <img src={image} alt={`analysis ${imageIndex + 1}`} className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className={`rounded-lg px-2.5 py-2 border ${isDark ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                            <p className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Score santé</p>
                            <p className={`text-sm font-semibold ${textPrimary}`}>{activeTimelineAnalysis.healthScore ?? 0}/100</p>
                          </div>
                          <div className={`rounded-lg px-2.5 py-2 border ${isDark ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                            <p className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Âge cutané</p>
                            <p className={`text-sm font-semibold ${textPrimary}`}>{activeTimelineAnalysis.skinAge ?? '—'} ans</p>
                          </div>
                          <div className={`rounded-lg px-2.5 py-2 border ${isDark ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                            <p className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Conditions</p>
                            <p className={`text-sm font-semibold ${textPrimary}`}>
                              {activeTimelineAnalysis.conditions?.length
                                ? activeTimelineAnalysis.conditions.slice(0, 2).join(' • ')
                                : 'Aucune signalée'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-8 ${textSecondary}`}>
                <Scan className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('dashboard.noActivity')}</p>
                <p className="text-xs mt-1">{t('dashboard.startAnalysis')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ Digital Twin Section ═══ */}
      {journey && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5, duration: 0.4, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
           
          </div>
          <DigitalTwinDashboard
            journey={journey}
            onScanMore={() => onNavigate('analysis')}
            onViewTimeline={() => onNavigate('evolution')}
            onCreatePrediction={async () => {
              try {
                const prediction = await createPrediction({ 
                  predictionType: 'SEVEN_DAY',
                  includeRoutineEffects: true 
                });
                setCurrentPrediction(prediction);
                setShowPredictionModal(true);
              } catch (error) {
                console.error('Prediction failed:', error);
              }
            }}
          />
        </motion.div>
      )}

      {/* Loading state for Digital Twin */}
      {twinLoading && !journey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl border p-6 mb-6 ${panelClass}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center animate-pulse">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className={`h-4 w-32 rounded ${isDark ? 'bg-[#334155]' : 'bg-[#E5E7EB]'} animate-pulse`} />

          {timelinePhotoViewer && timelineViewerAnalysis && activeTimelineViewerPhoto && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 transition-all duration-300">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
                  isDark
                    ? 'bg-[#0f172a]/95 border-white/10 shadow-black/50 border'
                    : 'bg-gradient-to-br from-[#F8FBFF]/95 via-white/95 to-[#F3FAFF]/95 border-[#E2E8F0] border shadow-xl'
                } backdrop-blur-xl`}
              >
                {/* Header with Title and Close Button */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
                  <div>
                    <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Détails de l'analyse
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatAnalysisDate(timelineViewerAnalysis.createdAt)} • {timelineViewerImages.length} photo(s)
                    </p>
                  </div>
                  <button
                    onClick={() => setTimelinePhotoViewer(null)}
                    className={`p-2 rounded-full transition-colors ${
                      isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                    }`}
                    aria-label="Fermer la galerie"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Photo Area */}
                <div className={`relative w-full flex-grow flex items-center justify-center overflow-hidden ${isDark ? 'bg-black/35' : 'bg-[#F8FBFF]'}`}>
                  <img
                    src={activeTimelineViewerPhoto}
                    alt="Photo d'analyse agrandie"
                    className="max-h-[70vh] w-auto max-w-full object-contain drop-shadow-2xl"
                  />
                  
                  {timelineViewerImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTimelinePhotoViewer((prev) => {
                            if (!prev) return prev;
                            const nextIndex =
                              (prev.photoIndex - 1 + timelineViewerImages.length) % timelineViewerImages.length;
                            return { ...prev, photoIndex: nextIndex };
                          });
                        }}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all shadow-lg ${
                          isDark
                            ? 'bg-black/25 text-white hover:bg-black/45 border border-white/10'
                            : 'bg-white/85 text-[#0369A1] hover:bg-white border border-[#BAE6FD]'
                        }`}
                        aria-label="Photo précédente"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTimelinePhotoViewer((prev) => {
                            if (!prev) return prev;
                            const nextIndex = (prev.photoIndex + 1) % timelineViewerImages.length;
                            return { ...prev, photoIndex: nextIndex };
                          });
                        }}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all shadow-lg ${
                          isDark
                            ? 'bg-black/25 text-white hover:bg-black/45 border border-white/10'
                            : 'bg-white/85 text-[#0369A1] hover:bg-white border border-[#BAE6FD]'
                        }`}
                        aria-label="Photo suivante"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Footer */}
                {timelineViewerImages.length > 1 && (
                  <div className={`px-6 py-4 border-t ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {timelineViewerImages.map((image, imageIndex) => {
                        const isActive = timelinePhotoViewer.photoIndex === imageIndex;
                        return (
                          <button
                            key={`${timelineViewerAnalysis.id}-gallery-${imageIndex}`}
                            type="button"
                            onClick={() =>
                              setTimelinePhotoViewer((prev) => (prev ? { ...prev, photoIndex: imageIndex } : prev))
                            }
                            className={`relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${
                              isActive
                                ? isDark
                                  ? 'ring-2 ring-[#0EA5E9] ring-offset-2 ring-offset-[#0f172a] scale-105'
                                  : 'ring-2 ring-[#0EA5E9] ring-offset-2 ring-offset-white scale-105'
                                : isDark
                                  ? 'opacity-70 border border-white/15 hover:opacity-100 hover:scale-105'
                                  : 'opacity-75 border border-[#DBEAFE] hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            <img src={image} alt={`Miniature ${imageIndex + 1}`} className="h-full w-full object-cover" />
                            {isActive && <div className="absolute inset-0 bg-[#0EA5E9]/12" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
              <div className={`h-3 w-48 rounded mt-2 ${isDark ? 'bg-[#334155]' : 'bg-[#E5E7EB]'} animate-pulse`} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Prediction Modal */}
      {selectedTimelineAnalysis && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-3xl flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#0f172a]/95 border-white/10 shadow-black/50' : 'bg-white/95 border-gray-200 shadow-xl'
            } backdrop-blur-xl max-h-[88vh]`}
          >
            {/* Header */}
            {!isHcHigh && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0EA5E9] via-[#22D3EE] to-[#0EA5E9]" />}
            <div className={`px-6 py-5 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative group">
                  {selectedTimelineAnalysis.images?.[0] ? (
                    <img src={selectedTimelineAnalysis.images[0]} alt="analysis" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Scan className="w-5 h-5 text-[#0EA5E9]" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Récap IA de l’analyse</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatAnalysisDate(selectedTimelineAnalysis.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTimelineAnalysisIndex(null)}
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pointer-events-none absolute right-3 top-[6.25rem] bottom-4 z-20 hidden sm:flex flex-col justify-between">
              <button
                type="button"
                onClick={() => scrollTimelineDetails('up')}
                className={`pointer-events-auto h-9 w-9 rounded-full border shadow-lg backdrop-blur-sm transition-all hover:scale-105 ${
                  isDark
                    ? 'border-white/20 bg-black/45 text-white hover:bg-black/65'
                    : 'border-gray-200 bg-white/90 text-gray-700 hover:bg-white'
                }`}
                aria-label="Scroller vers le haut"
              >
                <ChevronUp className="mx-auto h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTimelineDetails('down')}
                className={`pointer-events-auto h-9 w-9 rounded-full border shadow-lg backdrop-blur-sm transition-all hover:scale-105 ${
                  isDark
                    ? 'border-white/20 bg-black/45 text-white hover:bg-black/65'
                    : 'border-gray-200 bg-white/90 text-gray-700 hover:bg-white'
                }`}
                aria-label="Scroller vers le bas"
              >
                <ChevronDown className="mx-auto h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              ref={timelineDetailsScrollRef}
              className="p-6 overflow-y-auto flex-grow [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="grid md:grid-cols-[1.35fr_1fr] gap-6 mb-6">
                <div className="flex flex-col gap-4">
                  {/* Photo main */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTimelineAnalysisIndex !== null && selectedTimelineAnalysis.images?.length) {
                        openTimelinePhotoViewer(selectedTimelineAnalysisIndex, 0);
                      }
                    }}
                    className={`relative group rounded-2xl overflow-hidden border transition-all ${
                      isDark ? 'border-white/10 bg-black/20 hover:border-white/20' : 'border-gray-200 bg-gray-50 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {selectedTimelineAnalysis.images?.[0] ? (
                      <>
                        <img src={selectedTimelineAnalysis.images[0]} alt="Analyse sélectionnée" className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                          <span className="mb-4 ml-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> Cliquez pour agrandir
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-56 flex flex-col items-center justify-center text-gray-400">
                        <Scan className="w-10 h-10 mb-2 opacity-50 text-[#0EA5E9]" />
                        <span className="text-sm font-medium">Aucune photo</span>
                      </div>
                    )}
                  </button>

                  {/* Thumbnail slider */}
                  {!!selectedTimelineAnalysis.images?.length && selectedTimelineAnalysis.images.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {selectedTimelineAnalysis.images.map((image, imageIndex) => (
                        <button
                          key={`${selectedTimelineAnalysis.id}-modal-image-${imageIndex}`}
                          type="button"
                          onClick={() => {
                            if (selectedTimelineAnalysisIndex !== null) {
                              openTimelinePhotoViewer(selectedTimelineAnalysisIndex, imageIndex);
                            }
                          }}
                          className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                            isDark ? 'border-transparent hover:border-white/30' : 'border-transparent hover:border-gray-300 shadow-sm'
                          } hover:scale-105 hover:shadow-lg`}
                        >
                          <img src={image} alt={`Photo liée ${imageIndex + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score & quick details */}
                <div className={`rounded-2xl p-5 border flex flex-col ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-white shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Points Clés</h4>
                  </div>
                  
                  <div className="space-y-3 flex-grow">
                    <div className={`p-3 rounded-xl flex items-center justify-between border ${isDark ? 'border-white/5 bg-black/20' : 'border-gray-50 bg-gray-50'}`}>
                      <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Score Santé</span>
                      <span className="text-sm font-bold text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-1 rounded-md border border-[#0EA5E9]/20">{selectedTimelineAnalysis.healthScore ?? 0}/100</span>
                    </div>

                    <div className={`p-3 rounded-xl flex items-center justify-between border ${isDark ? 'border-white/5 bg-black/20' : 'border-gray-50 bg-gray-50'}`}>
                      <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Âge Cutané</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-md border ${isDark ? 'border-white/10 bg-white/10 text-gray-200' : 'border-gray-200 bg-white text-gray-700 shadow-sm'}`}>
                        {selectedTimelineAnalysis.skinAge ?? '—'} ans
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl flex items-start flex-col gap-1.5 border ${isDark ? 'border-white/5 bg-black/20' : 'border-gray-50 bg-gray-50'}`}>
                      <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Conditions</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTimelineAnalysis.conditions?.length
                          ? selectedTimelineAnalysis.conditions.slice(0, 2).join(' • ')
                          : 'Aucune signalée'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 mb-8 border ${isDark ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-[#0EA5E9]" />
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Résumé IA</h4>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedTimelineAnalysis.results?.summary ||
                    'Aucun résumé détaillé disponible pour cette analyse.'}
                </p>
              </div>

              <div className={`rounded-2xl p-6 mb-8 border ${
                  timelineEvolution.hasPrevious
                    ? isDark
                      ? 'border-[#334155] bg-white/5'
                      : 'border-[#E2E8F0] bg-[#F8FBFF] shadow-sm'
                    : isDark
                      ? 'border-white/10 bg-white/5'
                      : 'border-[#E2E8F0] bg-white shadow-sm'
                }`}>
                <div className="flex items-center gap-2 mb-4">
                  {timelineEvolution.hasPrevious && timelineEvolution.hasEvolution ? (
                    <TrendingUp className="w-5 h-5 text-[#0EA5E9]" />
                  ) : (
                    <Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  )}
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Évolution détectée : {timelineEvolution.hasPrevious ? (timelineEvolution.hasEvolution ? 'Améliorations notables' : 'Stable') : 'Analyse initiale'}
                  </h4>
                </div>
                
                {timelineEvolution.hasPrevious ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/80 border-white shadow-sm'}`}>
                      <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Score santé</div>
                      <div className={`text-lg font-bold flex items-center gap-1 ${timelineEvolution.healthScoreChange !== 0 ? 'text-[#0EA5E9]' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {timelineEvolution.healthScoreChange > 0 ? '+' : ''}{timelineEvolution.healthScoreChange} pts
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/80 border-white shadow-sm'}`}>
                      <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Âge cutané</div>
                      <div className={`text-lg font-bold flex items-center gap-1 ${timelineEvolution.skinAgeChange !== 0 ? 'text-[#0EA5E9]' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {timelineEvolution.skinAgeChange > 0 ? '+' : ''}{timelineEvolution.skinAgeChange} ans
                      </div>
                    </div>
                    {(!!timelineEvolution.newConditions.length || !!timelineEvolution.resolvedConditions.length) && (
                      <div className={`col-span-2 p-3 mt-1 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/80 border-white shadow-sm'} text-sm`}>
                        {!!timelineEvolution.newConditions.length && (
                          <div className="flex items-start gap-2">
                            <span className="text-[#0EA5E9] font-bold">•</span>
                            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Apparus: <span className="font-normal">{timelineEvolution.newConditions.join(', ')}</span></span>
                          </div>
                        )}
                        {!!timelineEvolution.resolvedConditions.length && (
                          <div className="flex items-start gap-2">
                            <span className="text-[#0EA5E9] font-bold">✓</span>
                            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Résolus: <span className="font-normal">{timelineEvolution.resolvedConditions.join(', ')}</span></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Il faudra de futures analyses pour comparer l'évolution de votre peau.</p>
                )}
              </div>

              {selectedTimelineAnalysis.results?.recommendations && (
                <div className={`rounded-2xl p-6 border ${isDark ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-white shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className={`w-5 h-5 text-[#0EA5E9]`} />
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Conseil IA recommandé</h4>
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {(selectedTimelineAnalysis.results.recommendations.lifestyle?.[0] ||
                      selectedTimelineAnalysis.results.recommendations.products?.[0] ||
                      selectedTimelineAnalysis.results.recommendations.ingredients?.[0] ||
                      'Continuez une routine régulière pour suivre votre évolution.')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showPredictionModal && currentPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative flex w-full max-w-2xl flex-col rounded-2xl border p-6 max-h-[calc(100vh-2rem)] ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}
          >
            <button
              onClick={() => setShowPredictionModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>Projection du Jumeau Après Routine</h3>
                <p className={`text-sm ${textSecondary}`}>{currentPrediction?.basedOnDays || 7} jours • Confiance: {Math.round((currentPrediction.confidence || 0.1) * 100)}%</p>
              </div>
            </div>
            <div className="space-y-4 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {latestAnalysis?.images?.[0] && predictionVisualFilters && (
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                  <SkinSimulationCanvas
                    imageUrl={latestAnalysis.images[0]}
                    filters={predictionVisualFilters}
                    productName="Routine recommandée"
                    simulationPeriod={currentPrediction?.basedOnDays || 7}
                  />
                </div>
              )}

              {normalizedPredictionState && (
                <>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium ${textSecondary} mb-2`}>Score Visage Amélioré</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-emerald-500">
                          {normalizedPredictionState.healthScore ?? '—'}
                      </span>
                      <span className={textSecondary}>/100</span>
                    </div>
                    </div>

                    {(normalizedPredictionState.radianceScore !== null || normalizedPredictionState.skinAge !== null) && (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-medium ${textSecondary} mb-2`}>Projection esthétique</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className={`text-xs ${textSecondary}`}>Éclat projeté</p>
                            <p className="text-xl font-semibold text-sky-500">
                              {normalizedPredictionState.radianceScore ?? '—'}/100
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs ${textSecondary}`}>Âge cutané projeté</p>
                            <p className="text-xl font-semibold text-sky-500">
                              {normalizedPredictionState.skinAge ?? '—'} ans
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                 </>
               )}
              
              {currentPrediction.preventiveTips && currentPrediction.preventiveTips.length > 0 && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <p className={`text-sm font-medium text-emerald-600 mb-2`}>💡 Conseils Préventifs</p>
                  <ul className="space-y-1">
                    {currentPrediction.preventiveTips.map((tip: string, i: number) => (
                      <li key={i} className={`text-sm ${textSecondary}`}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!latestAnalysis?.images?.[0] && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <p className="text-sm font-medium text-amber-600 mb-1">Image de projection indisponible</p>
                  <p className={`text-xs ${textSecondary}`}>
                    Faites une nouvelle analyse photo pour afficher le rendu visuel avant/après routine.
                  </p>
                </div>
              )}
               
            </div>
            
            <div className="mt-4 flex gap-3 pt-2 border-t border-black/5 dark:border-white/10">
              <Button 
                onClick={() => setShowPredictionModal(false)} 
                variant="outline"
                className="flex-1"
              >
                Fermer
              </Button>
              <Button 
                onClick={() => { setShowPredictionModal(false); onNavigate('routine'); }}
                className="flex-1"
              >
                Voir ma Routine
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Creating Prediction Loading */}
      {isCreatingPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`p-8 rounded-2xl ${isDark ? 'bg-[#1e293b]' : 'bg-white'} shadow-xl`}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
              <p className={`text-lg font-medium ${textPrimary}`}>Projection du jumeau amélioré...</p>
              <p className={`text-sm ${textSecondary}`}>L'IA simule le résultat après votre routine</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
