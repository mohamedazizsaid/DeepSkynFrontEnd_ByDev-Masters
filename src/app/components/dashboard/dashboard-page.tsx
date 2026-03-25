import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Scan, Calendar, MessageCircle, TrendingUp, TrendingDown, Sparkles,
  ArrowRight, Droplets, Fingerprint, Sun, Activity, Clock, Star,
  Shield, Zap, Eye, Heart
} from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../../stores/auth.store';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { analysisService } from '../../../lib/services/analysis.service';
import { skinProfileService } from '../../../lib/services/skin-profile.service';
import { calculateScoreChange, formatChartDate, formatAnalysisDate } from '../../../lib/analysis-helpers';
import type { SkinProfile, Analysis, AnalysisStats } from '../../../lib/types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuthStore();
  const { theme, contrastMode, t } = useAccessibilityStore();
  const isDark = theme === 'dark';
  const isHcHigh = contrastMode === 'high';

  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

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
  const borderColor = isHcHigh ? 'border-yellow-400' : isDark ? 'border-[#334155]' : 'border-[#E5E7EB]';

  const quickActions = [
    {
      icon: <Scan className="w-5 h-5" />,
      title: t('dashboard.newAnalysis'),
      description: t('dashboard.scanFace'),
      gradient: 'from-[#0EA5E9] to-[#06B6D4]',
      onClick: () => onNavigate('analysis')
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: t('dashboard.myRoutine'),
      description: t('dashboard.dailySteps'),
      gradient: 'from-[#F9A8D4] to-[#F472B6]',
      onClick: () => onNavigate('routine')
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: t('dashboard.aiCoach'),
      description: t('dashboard.personalizedAdvice'),
      gradient: 'from-[#FBBF24] to-[#F59E0B]',
      onClick: () => onNavigate('chat')
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: t('dashboard.communityAction'),
      description: t('dashboard.shareDiscover'),
      gradient: 'from-[#8B5CF6] to-[#6366F1]',
      onClick: () => onNavigate('community')
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* ═══ Welcome Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>
              {getGreeting()}, <span className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">{userName}</span> 👋
            </h1>
            <p className={`${textSecondary} mt-1`}>{t('dashboard.skinOverview')}</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => onNavigate('analysis')} className="gap-2">
              <Scan className="w-4 h-4" />
              {t('dashboard.newAnalysis')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ Top Stats Row ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('dashboard.skinHealth'), value: `${skinHealthScore}`, icon: <Shield className="w-5 h-5" />, color: '#0EA5E9', suffix: `/${100}` },
          { label: t('dashboard.skinAge'), value: skinAge ? `${skinAge}` : '—', icon: <Zap className="w-5 h-5" />, color: '#8B5CF6', suffix: ` ${t('common.years')}` },
          { label: t('dashboard.analyses'), value: `${stats?.totalAnalyses ?? 0}`, icon: <Eye className="w-5 h-5" />, color: '#10B981', suffix: '' },
          { label: t('dashboard.averageScore'), value: `${stats?.averageHealthScore ?? 0}`, icon: <Star className="w-5 h-5" />, color: '#F59E0B', suffix: '%' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -3 }}
            className={`rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md ${cardBg}`}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-base font-bold ${textPrimary}`}>{t('dashboard.globalScore')}</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: scoreLevel.color + '15', color: scoreLevel.color }}>
              {scoreLevel.emoji} {scoreLevel.label}
            </span>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
        >
          <h3 className={`text-base font-bold mb-5 ${textPrimary}`}>{t('dashboard.ageComparison')}</h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${textSecondary} flex items-center gap-2`}><Clock className="w-3.5 h-3.5" /> {t('dashboard.realAge')}</span>
                <span className={`text-xl font-bold ${textPrimary}`}>{realAge}</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
                <motion.div className="h-full bg-gradient-to-r from-[#6B7280] to-[#9CA3AF] rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(realAge, 100)}%` }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${textSecondary} flex items-center gap-2`}><Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" /> {t('dashboard.skinAge')}</span>
                <span className="text-xl font-bold text-[#0EA5E9]">{skinAge ?? '—'}</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-[#F3F4F6]'}`}>
                <motion.div className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(skinAge ?? 0, 100)}%` }} transition={{ duration: 1, delay: 0.4 }} />
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
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
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`rounded-2xl border p-6 shadow-sm mb-6 ${cardBg}`}
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
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : 'white',
                    border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    color: isDark ? '#e2e8f0' : '#111827',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
        >
          <h3 className={`text-base font-bold mb-4 ${textPrimary}`}>{t('dashboard.quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                onClick={action.onClick}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${
                  isHcHigh ? 'border-yellow-400 hover:bg-yellow-400/10' : isDark ? 'border-[#334155] hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5' : 'border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF]'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
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
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
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
    </div>
  );
}
