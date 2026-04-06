import React, { useEffect, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Scan, Calendar, MessageCircle, TrendingUp, TrendingDown, Sparkles,
  ArrowRight, Droplets, Fingerprint, Sun, Activity, Clock, Star,
  Shield, Zap, Eye, Heart, Brain
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
  } = useSkinJourney();

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
            <Button onClick={() => onNavigate('analysis')} className="gap-2">
              <Scan className="w-4 h-4" />
              {t('dashboard.newAnalysis')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ Top Stats Row ═══ */}
      <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('dashboard.skinHealth'), value: `${skinHealthScore}`, icon: <Shield className="w-5 h-5" />, color: '#0EA5E9', suffix: `/${100}` },
          { label: t('dashboard.skinAge'), value: skinAge ? `${skinAge}` : '—', icon: <Zap className="w-5 h-5" />, color: '#8B5CF6', suffix: ` ${t('common.years')}` },
          { label: t('dashboard.analyses'), value: `${stats?.totalAnalyses ?? 0}`, icon: <Eye className="w-5 h-5" />, color: '#10B981', suffix: '' },
          { label: t('dashboard.averageScore'), value: `${stats?.averageHealthScore ?? 0}`, icon: <Star className="w-5 h-5" />, color: '#F59E0B', suffix: '%' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.05 * i, duration: 0.35, ease: 'easeOut' }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-lg ${cardBg}`}
          >
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
          className={`rounded-2xl border p-6 ${panelClass}`}
          data-tour="dashboard-score"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('dashboard.globalScore')}</h3>
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
          <div className="relative w-44 h-44 mx-auto my-2">
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
              <div className={`text-4xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent`}>{skinHealthScore}</div>
              <div className={`text-xs ${textSecondary}`}>{t('common.outOf100')}</div>
            </div>
          </div>
          {scoreChange !== 0 ? (
            <div className="text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                scoreChange > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
              }`}>
                {scoreChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {scoreChange > 0 ? '+' : ''}{scoreChange} {t('common.thisMonth')}
              </span>
            </div>
          ) : stats && stats.totalAnalyses > 0 ? (
            <div className="text-center"><span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>→ {t('common.stable')}</span></div>
          ) : null}
        </motion.div>

        {/* Âge Comparaison */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className={`rounded-2xl border p-6 ${panelClass}`}
        >
          <h3 className={`text-base font-bold mb-5 ${textPrimary}`}>{t('dashboard.ageComparison')}</h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${textSecondary} flex items-center gap-2`}><Clock className="w-3.5 h-3.5" /> {t('dashboard.realAge')}</span>
                <span className={`text-xl font-bold ${textPrimary}`}>{realAge}</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
                <motion.div className="h-full bg-gradient-to-r from-[#6B7280] to-[#9CA3AF] rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(realAge, 100)}%` }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.2 }} />
              </div>
            </div>
            <div>
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
              <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
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
          className={`rounded-2xl border p-6 ${panelClass}`}
        >
          <h3 className={`text-base font-bold mb-5 ${textPrimary}`}>{t('dashboard.skinMetrics')}</h3>
          <div className="space-y-4">
            {skinMetrics.map((metric, index) => (
              <div key={index}>
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
        className={`rounded-2xl border p-6 mb-6 ${panelClass}`}
        data-tour="dashboard-evolution"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('dashboard.healthEvolution')}</h3>
            <p className={`text-xs ${textSecondary} mt-0.5`}>{t('dashboard.progressionOverTime')}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('evolution')}>
            {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="h-56">
          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E5E7EB'} />
                <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#6B7280'} fontSize={12} />
                <YAxis stroke={isDark ? '#64748b' : '#6B7280'} domain={[0, 100]} fontSize={12} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                  formatter={(value) => [`${value}/100`, t('dashboard.globalScore')]}
                  labelFormatter={(label) => `${t('common.date')}: ${label}`}
                />
                <Area type="monotone" dataKey="score" stroke="#0EA5E9" strokeWidth={3} fill="url(#areaFill)" dot={{ fill: '#0EA5E9', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
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
          className={`rounded-2xl border p-6 ${panelClass}`}
          data-tour="dashboard-quick-actions"
        >
          <h3 className={`text-base font-bold mb-4 ${textPrimary}`}>{t('dashboard.quickActions')}</h3>
          <div className="space-y-3">
            <motion.button
              onClick={heroAction.onClick}
              className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:shadow-md group text-left ${
                isHcHigh ? 'border-yellow-400 hover:bg-yellow-400/10' : isDark ? 'border-[#334155] hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5' : 'border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF]'
              }`}
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
                      Recommande
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
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${
                  isHcHigh ? 'border-yellow-400 hover:bg-yellow-400/10' : isDark ? 'border-[#334155] hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5' : 'border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF]'
                }`}
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
          className={`rounded-2xl border p-6 ${panelClass}`}
        >
          <h3 className={`text-base font-bold mb-4 ${textPrimary}`}>{t('dashboard.recentActivity')}</h3>
          <div className="space-y-3">
            {latestAnalysis ? (
              <>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}
                  className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#F9FAFB]'}`}>
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
                    className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#F9FAFB]'}`}>
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
                    className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-[#0f172a]/50' : 'bg-[#F9FAFB]'}`}>
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
            <h2 className={`text-lg font-bold ${textPrimary}`}>Digital Twin</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
              Jumeau Numérique
            </span>
          </div>
          <DigitalTwinDashboard
            journey={journey}
            onScanMore={() => onNavigate('analysis')}
            onViewTimeline={() => onNavigate('evolution')}
            onCreatePrediction={() => {
              createPrediction({ daysAhead: 7, factors: {} });
            }}
            onSimulateProduct={() => {
              // Open product simulation modal or navigate
              onNavigate('routine');
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
    </div>
  );
}
