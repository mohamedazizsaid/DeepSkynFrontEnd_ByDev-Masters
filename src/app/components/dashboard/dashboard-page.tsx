import React, { useEffect, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Scan, Calendar, MessageCircle, TrendingUp, TrendingDown, Sparkles,
  ArrowRight, Droplets, Fingerprint, Sun, Activity, Clock, Star,
  Shield, Zap, Eye, Heart, Brain, Target
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
  const { theme, contrastMode, t } = useAccessibilityStore();
  const shouldReduceMotion = useReducedMotion();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Digital Twin hook
  const { 
    journey, 
    isLoading: twinLoading, 
    createPrediction,
    simulateProduct,
    isCreatingPrediction,
    isSimulatingProduct,
  } = useSkinJourney();
  
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<any>(null);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any>(null);
  const [simulationForm, setSimulationForm] = useState({
    productName: '',
    productCategory: 'serum',
    ingredients: '',
    simulationPeriod: 14,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, analysis, statsRes] = await Promise.allSettled([
          skinProfileService.getMyProfile(),
          analysisService.getLatest(),
          analysisService.getStats(),
        ]);
        if (profile.status === 'fulfilled') setSkinProfile(profile.value);
        if (analysis.status === 'fulfilled') setLatestAnalysis(analysis.value);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
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

  const gaugeData = [{ name: 'Score', value: skinHealthScore, fill: '#0EA5E9' }];

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

  const detailed = latestAnalysis?.results?.detailedAnalysis;
  const skinMetrics = [
    { label: t('dashboard.hydration'), value: detailed?.hydration?.score ?? 0, color: '#06B6D4', icon: <Droplets className="w-4 h-4" /> },
    { label: t('dashboard.texture'), value: detailed?.texture?.score ?? 0, color: '#0EA5E9', icon: <Fingerprint className="w-4 h-4" /> },
    { label: t('dashboard.pigmentation'), value: detailed?.pigmentation?.score ?? 0, color: '#F9A8D4', icon: <Sun className="w-4 h-4" /> },
    { label: t('dashboard.wrinkles'), value: detailed?.wrinkles?.score ?? 0, color: '#FBBF24', icon: <Activity className="w-4 h-4" /> },
  ];

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: t('dashboard.scoreLevel.excellent'), emoji: '🌟', color: '#10B981' };
    if (score >= 60) return { label: t('dashboard.scoreLevel.good'), emoji: '✨', color: '#0EA5E9' };
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

  const topStats = [
    {
      label: t('dashboard.skinHealth'),
      value: `${skinHealthScore}`,
      icon: <Shield className="w-5 h-5" />,
      color: '#0EA5E9',
      suffix: `/${100}`,
      tint: isDark
        ? 'bg-gradient-to-br from-[#102337] via-[#0f172a] to-[#0f1f2d] border-[#1d4e74]'
        : 'bg-gradient-to-br from-[#ECFEFF] via-[#F0F9FF] to-[#FFFFFF] border-[#BAE6FD]',
    },
    {
      label: t('dashboard.skinAge'),
      value: skinAge ? `${skinAge}` : '—',
      icon: <Zap className="w-5 h-5" />,
      color: '#8B5CF6',
      suffix: ` ${t('common.years')}`,
      tint: isDark
        ? 'bg-gradient-to-br from-[#22183b] via-[#111827] to-[#1a1531] border-[#4c1d95]'
        : 'bg-gradient-to-br from-[#F5F3FF] via-[#FAF5FF] to-[#FFFFFF] border-[#DDD6FE]',
    },
    {
      label: t('dashboard.analyses'),
      value: `${stats?.totalAnalyses ?? 0}`,
      icon: <Eye className="w-5 h-5" />,
      color: '#10B981',
      suffix: '',
      tint: isDark
        ? 'bg-gradient-to-br from-[#122b29] via-[#0f172a] to-[#13201d] border-[#065f46]'
        : 'bg-gradient-to-br from-[#ECFDF5] via-[#F0FDF4] to-[#FFFFFF] border-[#A7F3D0]',
    },
    {
      label: t('dashboard.averageScore'),
      value: `${stats?.averageHealthScore ?? 0}`,
      icon: <Star className="w-5 h-5" />,
      color: '#F59E0B',
      suffix: '%',
      tint: isDark
        ? 'bg-gradient-to-br from-[#2f2414] via-[#0f172a] to-[#241d12] border-[#92400e]'
        : 'bg-gradient-to-br from-[#FFFBEB] via-[#FEF9C3] to-[#FFFFFF] border-[#FCD34D]',
    },
  ];

  const scoreCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 relative overflow-hidden border-[#38BDF8] bg-gradient-to-br from-[#08263d] via-[#0b3451] to-[#0f172a] shadow-[0_24px_50px_rgba(14,165,233,0.30)]'
      : 'rounded-2xl border p-6 relative overflow-hidden border-[#7DD3FC] bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#ECFEFF] shadow-[0_22px_44px_rgba(14,165,233,0.24)]';
  const scoreTitleClass = isHcHigh ? textPrimary : isDark ? 'text-white' : 'text-[#0F172A]';
  const scoreInfoClass = isHcHigh ? textSecondary : isDark ? 'text-white/80' : 'text-[#0F172A]/65';
  const scoreIconShellClass = isHcHigh ? 'bg-yellow-400 text-black' : isDark ? 'bg-white/20 text-white' : 'bg-[#0EA5E9]/15 text-[#0284C7]';
  const scoreValueClass = isHcHigh ? 'text-cyan-400' : isDark ? 'text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]' : 'bg-gradient-to-r from-[#0284C7] to-[#06B6D4] bg-clip-text text-transparent';
  const scoreOutOfClass = isHcHigh ? textSecondary : isDark ? 'text-white/85' : 'text-[#334155]';
  const scoreDividerClass = isHcHigh ? 'bg-gradient-to-r from-transparent via-[#0EA5E9]/30 to-transparent' : isDark ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent' : 'bg-gradient-to-r from-transparent via-[#0EA5E9]/35 to-transparent';

  const analysisButtonClass = isHcHigh
    ? 'gap-2 bg-yellow-400 text-black hover:bg-yellow-300'
    : 'gap-2 text-white border-0 bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#06B6D4] shadow-[0_12px_26px_rgba(14,165,233,0.35)] hover:shadow-[0_16px_30px_rgba(14,165,233,0.45)]';

  const ageCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#141b2e] via-[#111827] to-[#1b2235] shadow-[0_14px_30px_rgba(15,23,42,0.38)]'
      : 'rounded-2xl border p-6 border-[#DBEAFE] bg-gradient-to-br from-[#F8FAFC] via-[#FFFFFF] to-[#EFF6FF] shadow-[0_12px_28px_rgba(59,130,246,0.10)]';

  const metricsCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#10222f] via-[#111827] to-[#1a2432] shadow-[0_14px_30px_rgba(6,182,212,0.20)]'
      : 'rounded-2xl border p-6 border-[#BAE6FD] bg-gradient-to-br from-[#F0FDFF] via-[#FFFFFF] to-[#F5FBFF] shadow-[0_12px_28px_rgba(14,165,233,0.12)]';

  const evolutionCardClass = isHcHigh
    ? `rounded-2xl border p-6 mb-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 mb-6 border-[#2b8bb8] bg-gradient-to-br from-[#1176A6] via-[#1495C2] to-[#14A9CE] shadow-[0_18px_36px_rgba(20,169,206,0.30)]'
      : 'rounded-2xl border p-6 mb-6 border-[#52C7EA] bg-gradient-to-br from-[#1FA7D8] via-[#21B8DE] to-[#19C1D9] shadow-[0_16px_34px_rgba(25,193,217,0.26)]';

  const evolutionChartLineColor = isHcHigh ? '#111827' : '#FFFFFF';
  const evolutionChartGridColor = isHcHigh ? (isDark ? '#334155' : '#E5E7EB') : 'rgba(255,255,255,0.28)';
  const evolutionChartAxisColor = isHcHigh ? (isDark ? '#E2E8F0' : '#374151') : 'rgba(255,255,255,0.88)';
  const evolutionTitleClass = isHcHigh ? textPrimary : 'text-white';
  const evolutionSubtitleClass = isHcHigh ? textSecondary : 'text-white/80';
  const evolutionButtonClass = isHcHigh
    ? ''
    : 'text-white hover:text-white hover:bg-white/15 border border-white/20';

  const quickActionsCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#132334] via-[#0f172a] to-[#1a2236] shadow-[0_14px_30px_rgba(14,165,233,0.16)]'
      : 'rounded-2xl border p-6 border-[#CFFAFE] bg-gradient-to-br from-[#F0FDFF] via-[#FFFFFF] to-[#F5FBFF] shadow-[0_12px_28px_rgba(8,145,178,0.12)]';
  const quickActionsHeroClass = isHcHigh
    ? 'w-full p-4 sm:p-5 rounded-2xl border border-yellow-400 transition-all duration-200 hover:shadow-md group text-left hover:bg-yellow-400/10'
    : isDark
      ? 'w-full p-4 sm:p-5 rounded-2xl border border-[#334155] transition-all duration-200 hover:shadow-md group text-left hover:border-[#22D3EE] bg-gradient-to-r from-[#0f172a]/90 to-[#12283a]/70'
      : 'w-full p-4 sm:p-5 rounded-2xl border border-[#BAE6FD] transition-all duration-200 hover:shadow-md group text-left bg-gradient-to-r from-[#F0FDFF] to-white hover:border-[#22D3EE]';
  const quickActionsCompactClass = isHcHigh
    ? 'flex flex-col items-center gap-3 p-4 rounded-xl border border-yellow-400 transition-all duration-200 hover:shadow-md group hover:bg-yellow-400/10'
    : isDark
      ? 'flex flex-col items-center gap-3 p-4 rounded-xl border border-[#334155] transition-all duration-200 hover:shadow-md group hover:border-[#22D3EE] bg-gradient-to-b from-[#0f172a]/90 to-[#13293b]/70'
      : 'flex flex-col items-center gap-3 p-4 rounded-xl border border-[#BAE6FD] transition-all duration-200 hover:shadow-md group bg-gradient-to-b from-[#F0FDFF] to-white hover:border-[#22D3EE]';

  const activityCardClass = isHcHigh
    ? `rounded-2xl border p-6 ${panelClass}`
    : isDark
      ? 'rounded-2xl border p-6 border-[#334155] bg-gradient-to-br from-[#251f13] via-[#111827] to-[#1f2433] shadow-[0_14px_30px_rgba(251,191,36,0.14)]'
      : 'rounded-2xl border p-6 border-[#FDE68A] bg-gradient-to-br from-[#FFFBEB] via-[#FFFFFF] to-[#FFF7ED] shadow-[0_12px_28px_rgba(245,158,11,0.12)]';

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
      gradient: 'from-[#F9A8D4] to-[#F472B6]',
      onClick: () => onNavigate('routine')
    },
    {
      id: 'chat',
      icon: <MessageCircle className="w-5 h-5" />,
      title: t('dashboard.aiCoach'),
      description: t('dashboard.personalizedAdvice'),
      gradient: 'from-[#FBBF24] to-[#F59E0B]',
      onClick: () => onNavigate('chat')
    },
    {
      id: 'community',
      icon: <Heart className="w-5 h-5" />,
      title: t('dashboard.communityAction'),
      description: t('dashboard.shareDiscover'),
      gradient: 'from-[#8B5CF6] to-[#6366F1]',
      onClick: () => onNavigate('community')
    },
  ];

  const quickActionById = (id: 'analysis' | 'routine' | 'chat' | 'community') =>
    quickActions.find((action) => action.id === id) ?? quickActions[0];

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

  if (dataLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
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
    <div className="relative p-4 sm:p-8 max-w-7xl mx-auto">

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
              {getGreeting()}, <span className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">{userName}</span> 👋
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
      <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.05 * i, duration: 0.35, ease: 'easeOut' }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-lg ${isHcHigh ? cardBg : stat.tint}`}
          >
            {!isHcHigh && (
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: `linear-gradient(90deg, ${stat.color}, ${stat.color}99)` }}
              />
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
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Skin Health Score - Hero Card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.1, duration: 0.4, ease: 'easeOut' }}
          className={scoreCardClass}
          data-tour="dashboard-score"
        >
          {!isHcHigh && (
            <>
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#38BDF8] via-[#22D3EE] to-[#0EA5E9]" />
              <div className="pointer-events-none absolute -top-14 -right-10 w-40 h-40 rounded-full bg-[#0EA5E9]/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-[#06B6D4]/10 blur-3xl" />
            </>
          )}
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${scoreIconShellClass}`}>
                <Shield className="w-4 h-4" />
              </div>
              <h3 className={`text-base font-bold ${scoreTitleClass}`}>{t('dashboard.globalScore')}</h3>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: scoreLevel.color + '15', color: scoreLevel.color }}>
                {scoreLevel.emoji} {scoreLevel.label}
              </span>
              {weeklyTrend && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${weeklyTrend.up ? 'bg-[#10B981]/10 text-[#10B981]' : weeklyTrend.down ? 'bg-[#EF4444]/10 text-[#EF4444]' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                  {weeklyTrend.up ? <TrendingUp className="w-3 h-3" /> : weeklyTrend.down ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  Hebdo {weeklyTrend.diff > 0 ? '+' : ''}{weeklyTrend.diff}
                </span>
              )}
            </div>
          </div>
          {!isHcHigh && (
            <p className={`relative z-10 text-[11px] font-medium mb-2 ${scoreInfoClass}`}>Indicateur principal de votre progression cutanee</p>
          )}
          <div className="relative z-10 w-44 h-44 mx-auto my-2">
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
          <div className={`relative z-10 h-px w-full my-3 ${scoreDividerClass}`} />
          {scoreChange !== 0 ? (
            <div className="relative z-10 text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                scoreChange > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
              }`}>
                {scoreChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {scoreChange > 0 ? '+' : ''}{scoreChange} {t('common.thisMonth')}
              </span>
            </div>
          ) : stats && stats.totalAnalyses > 0 ? (
            <div className="relative z-10 text-center"><span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>→ {t('common.stable')}</span></div>
          ) : null}
        </motion.div>

        {/* Âge Comparaison */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className={`relative overflow-hidden ${ageCardClass}`}
        >
          {!isHcHigh && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#64748B] via-[#0EA5E9] to-[#06B6D4]" />}
          <div className="flex items-center justify-between mb-5 pt-1">
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
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.5, duration: 0.4, ease: 'easeOut' }}
          className={`relative overflow-hidden ${quickActionsCardClass}`}
          data-tour="dashboard-quick-actions"
        >
          {!isHcHigh && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#06B6D4] via-[#22D3EE] to-[#0EA5E9]" />}
          <div className="flex items-center justify-between mb-4 pt-1">
            <h3 className={`text-base font-bold ${textPrimary} flex items-center gap-2`}>
              <Zap className="w-4 h-4 text-[#06B6D4]" />
              {t('dashboard.quickActions')}
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isDark ? 'bg-[#06B6D4]/15 text-[#67E8F9]' : 'bg-[#ECFEFF] text-[#0E7490]'}`}>
              Smart Flow
            </span>
          </div>
          <div className="space-y-3">
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
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.6, duration: 0.4, ease: 'easeOut' }}
          className={activityCardClass}
        >
          <h3 className={`text-base font-bold mb-4 ${textPrimary}`}>{t('dashboard.recentActivity')}</h3>
          <div className="space-y-3">
            {latestAnalysis ? (
              <>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}
                  className={activityItemClass}>
                  <div className="w-9 h-9 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0">
                    <Scan className="w-4 h-4 text-[#0EA5E9]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${textPrimary}`}>
                      {latestAnalysis.status === 'completed' ? t('dashboard.analysisCompleted') : latestAnalysis.status === 'processing' ? t('dashboard.analysisInProgress') : latestAnalysis.status}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>{formatAnalysisDate(latestAnalysis.createdAt)}</p>
                    {latestAnalysis.status === 'completed' && (
                      <p className="text-xs text-[#0EA5E9] font-semibold mt-0.5">Score : {latestAnalysis.healthScore}/100</p>
                    )}
                  </div>
                </motion.div>
                {stats && stats.totalAnalyses > 1 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                    className={activityItemClass}>
                    <div className="w-9 h-9 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-[#FBBF24]" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${textPrimary}`}>{t('dashboard.totalAnalyses').replace('{count}', stats.totalAnalyses.toString())}</p>
                      <p className={`text-xs ${textSecondary}`}>{t('dashboard.avgScore').replace('{score}', stats.averageHealthScore.toString())}</p>
                    </div>
                  </motion.div>
                )}
                {latestAnalysis.conditions?.length > 0 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 }}
                    className={activityItemClass}>
                    <div className="w-9 h-9 rounded-lg bg-[#F9A8D4]/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-[#F9A8D4]" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${textPrimary}`}>{t('dashboard.detectedConditions')}</p>
                      <p className={`text-xs ${textSecondary}`}>{latestAnalysis.conditions.slice(0, 3).join(', ')}</p>
                    </div>
                  </motion.div>
                )}
              </>
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
            <Brain className="w-5 h-5 text-purple-500" />
            <h2 className={`text-lg font-bold ${textPrimary}`}>Jumeau Numérique</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
              IA Prédictive
            </span>
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
            onSimulateProduct={() => {
              setShowSimulationModal(true);
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
              <div className={`h-3 w-48 rounded mt-2 ${isDark ? 'bg-[#334155]' : 'bg-[#E5E7EB]'} animate-pulse`} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Prediction Modal */}
      {showPredictionModal && currentPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-lg mx-4 rounded-2xl border p-6 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}
          >
            <button
              onClick={() => setShowPredictionModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>Prédiction 7 Jours</h3>
                <p className={`text-sm ${textSecondary}`}>Confiance: {Math.round((currentPrediction.confidence || 0.1) * 100)}%</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {currentPrediction.predictedState && (
                <>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${textSecondary} mb-2`}>Score Santé Prédit</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-emerald-500">
                        {currentPrediction.predictedState.healthScore || '—'}
                      </span>
                      <span className={textSecondary}>/100</span>
                    </div>
                  </div>
                  
                  {currentPrediction.predictedState.conditions && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium ${textSecondary} mb-2`}>Conditions Prédites</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(currentPrediction.predictedState.conditions).map(([condition, data]: [string, any]) => (
                          <span key={condition} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                            {condition}: {data?.severity || 'normal'}
                          </span>
                        ))}
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
              
              {currentPrediction.warnings && currentPrediction.warnings.length > 0 && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <p className={`text-sm font-medium text-amber-600 mb-2`}>⚠️ Alertes</p>
                  <ul className="space-y-1">
                    {currentPrediction.warnings.map((warning: string, i: number) => (
                      <li key={i} className={`text-sm ${textSecondary}`}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
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

      {/* Product Simulation Modal */}
      {showSimulationModal && !currentSimulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-lg mx-4 rounded-2xl border p-6 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}
          >
            <button
              onClick={() => setShowSimulationModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>Simuler un Produit</h3>
                <p className={`text-sm ${textSecondary}`}>Testez l'effet d'un produit sur votre peau</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Nom du produit</label>
                <input
                  type="text"
                  value={simulationForm.productName}
                  onChange={(e) => setSimulationForm(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Ex: Sérum Vitamine C"
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Catégorie</label>
                <select
                  value={simulationForm.productCategory}
                  onChange={(e) => setSimulationForm(prev => ({ ...prev, productCategory: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="cleanser">Nettoyant</option>
                  <option value="toner">Tonique</option>
                  <option value="serum">Sérum</option>
                  <option value="moisturizer">Crème hydratante</option>
                  <option value="sunscreen">Protection solaire</option>
                  <option value="mask">Masque</option>
                  <option value="exfoliant">Exfoliant</option>
                  <option value="oil">Huile</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Ingrédients principaux</label>
                <input
                  type="text"
                  value={simulationForm.ingredients}
                  onChange={(e) => setSimulationForm(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="Ex: vitamine C, acide hyaluronique, niacinamide"
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs ${textSecondary} mt-1`}>Séparez les ingrédients par des virgules</p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Période de simulation</label>
                <select
                  value={simulationForm.simulationPeriod}
                  onChange={(e) => setSimulationForm(prev => ({ ...prev, simulationPeriod: Number(e.target.value) }))}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={() => setShowSimulationModal(false)} 
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={async () => {
                  if (!simulationForm.productName) return;
                  try {
                    const result = await simulateProduct({
                      productName: simulationForm.productName,
                      productCategory: simulationForm.productCategory,
                      productIngredients: simulationForm.ingredients.split(',').map(i => i.trim()).filter(Boolean),
                      simulationPeriod: simulationForm.simulationPeriod,
                    });
                    setCurrentSimulation(result);
                  } catch (error) {
                    console.error('Simulation failed:', error);
                  }
                }}
                disabled={!simulationForm.productName || isSimulatingProduct}
                className="flex-1"
              >
                {isSimulatingProduct ? 'Simulation...' : 'Simuler'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Simulation Results Modal */}
      {showSimulationModal && currentSimulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-2xl mx-4 rounded-2xl border p-6 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} shadow-2xl`}
          >
            <button
              onClick={() => { setShowSimulationModal(false); setCurrentSimulation(null); }}
              className={`absolute top-4 right-4 p-2 rounded-full z-10 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>{currentSimulation.productName}</h3>
                <p className={`text-sm ${textSecondary}`}>Simulation visuelle - {currentSimulation.simulationPeriod} jours</p>
              </div>
            </div>
            
            {/* Visual Simulation Canvas */}
            {latestAnalysis?.images?.[0] && currentSimulation.expectedChanges?.visualFilters && (
              <div className="mb-6">
                <SkinSimulationCanvas
                  imageUrl={latestAnalysis.images[0]}
                  filters={currentSimulation.expectedChanges.visualFilters}
                  productName={currentSimulation.productName}
                  simulationPeriod={currentSimulation.simulationPeriod}
                />
              </div>
            )}
            
            {/* Fallback if no image */}
            {!latestAnalysis?.images?.[0] && (
              <div className={`mb-6 p-8 rounded-xl text-center ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                <Scan className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-50`} />
                <p className={`text-sm ${textSecondary}`}>
                  Aucune photo d'analyse disponible. Faites une analyse pour voir la simulation visuelle.
                </p>
                <Button onClick={() => { setShowSimulationModal(false); onNavigate('analysis'); }} className="mt-4">
                  Faire une analyse
                </Button>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Success Probability */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium ${textSecondary} mb-2`}>Probabilité de succès</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                      style={{ width: `${(currentSimulation.successProbability || 0) * 100}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold ${textPrimary}`}>
                    {Math.round((currentSimulation.successProbability || 0) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Predicted Changes */}
              {currentSimulation.expectedChanges && (
                <>
                  {currentSimulation.expectedChanges.positive?.length > 0 && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                      <p className="text-sm font-medium text-emerald-600 mb-2">✅ Effets positifs attendus</p>
                      <ul className="space-y-1">
                        {currentSimulation.expectedChanges.positive.map((change: string, i: number) => (
                          <li key={i} className={`text-sm ${textSecondary}`}>• {change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentSimulation.expectedChanges.negative?.length > 0 && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                      <p className="text-sm font-medium text-red-600 mb-2">⚠️ Risques potentiels</p>
                      <ul className="space-y-1">
                        {currentSimulation.expectedChanges.negative.map((change: string, i: number) => (
                          <li key={i} className={`text-sm ${textSecondary}`}>• {change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              
              {/* Risk Factors */}
              {currentSimulation.riskFactors?.length > 0 && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <p className="text-sm font-medium text-amber-600 mb-2">🔍 Facteurs de risque</p>
                  <ul className="space-y-1">
                    {currentSimulation.riskFactors.map((risk: string, i: number) => (
                      <li key={i} className={`text-sm ${textSecondary}`}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Recommendations */}
              {currentSimulation.recommendations?.length > 0 && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <p className="text-sm font-medium text-blue-600 mb-2">💡 Recommandations</p>
                  <ul className="space-y-1">
                    {currentSimulation.recommendations.map((rec: string, i: number) => (
                      <li key={i} className={`text-sm ${textSecondary}`}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={() => { 
                  setCurrentSimulation(null);
                  setSimulationForm({ productName: '', productCategory: 'serum', ingredients: '', simulationPeriod: 14 });
                }} 
                variant="outline"
                className="flex-1"
              >
                Nouvelle simulation
              </Button>
              <Button 
                onClick={() => { setShowSimulationModal(false); setCurrentSimulation(null); }}
                className="flex-1"
              >
                Fermer
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
              <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              <p className={`text-lg font-medium ${textPrimary}`}>Génération de la prédiction...</p>
              <p className={`text-sm ${textSecondary}`}>L'IA analyse votre peau du futur</p>
            </div>
          </div>
        </div>
      )}

      {/* Simulating Product Loading */}
      {isSimulatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`p-8 rounded-2xl ${isDark ? 'bg-[#1e293b]' : 'bg-white'} shadow-xl`}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
              <p className={`text-lg font-medium ${textPrimary}`}>Simulation en cours...</p>
              <p className={`text-sm ${textSecondary}`}>L'IA analyse l'effet du produit sur votre peau</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
