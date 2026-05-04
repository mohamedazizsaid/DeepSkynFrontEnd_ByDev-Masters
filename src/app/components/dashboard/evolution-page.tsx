import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Loader2, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../card';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analysisService } from '../../../lib/services/analysis.service';
import { filterByPeriod, formatChartDate, formatAnalysisDate } from '../../../lib/analysis-helpers';
import type { Analysis, AnalysisStats } from '../../../lib/types';
import toast from 'react-hot-toast';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { format, getDay, getDaysInMonth } from 'date-fns';

interface EvolutionPageProps {
  onBack: () => void;
}

type Period = '1m' | '3m' | '6m' | '1y';

const PERIODS: { id: Period; label: string }[] = [
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const METRIC_LABELS: Record<string, string> = {
  hydration: 'Hydration',
  texture: 'Texture',
  pores: 'Pores',
  pigmentation: 'Pigmentation',
  wrinkles: 'Wrinkles',
  acne: 'Acne',
  redness: 'Redness',
  elasticity: 'Elasticity',
};

export function EvolutionPage({ onBack }: EvolutionPageProps) {
  const { t } = useAccessibilityStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('6m');
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, listRes] = await Promise.allSettled([
          analysisService.getStats(),
          analysisService.getAll(1, 100),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (listRes.status === 'fulfilled') setAnalyses(listRes.value.analyses);
      } catch {
        toast.error('Failed to load evolution data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredHistory = useMemo(() => {
    if (!stats?.healthScoreHistory) return [];
    return filterByPeriod(stats.healthScoreHistory, selectedPeriod);
  }, [stats, selectedPeriod]);

  const chartData = useMemo(
    () =>
      filteredHistory.map((entry) => ({
        date: formatChartDate(entry.date),
        score: entry.score,
      })),
    [filteredHistory],
  );

  const overview = useMemo(() => {
    if (filteredHistory.length < 1) {
      return {
        current: 0,
        best: 0,
        change: 0,
      };
    }

    const scores = filteredHistory.map((entry) => entry.score);
    const current = scores[scores.length - 1];
    const first = scores[0];

    return {
      current,
      best: Math.max(...scores),
      change: current - first,
    };
  }, [filteredHistory]);

  const metricSummary = useMemo(() => {
    if (filteredHistory.length < 1) return [];

    const latestCompleted = analyses.find((a) => a.status === 'completed' && a.results);
    const detailed = latestCompleted?.results?.detailedAnalysis;

    const items: { name: string; current: number; change: number; color: string }[] = [
      {
        name: t('evolution.overallScore'),
        current: overview.current,
        change: overview.change,
        color: 'var(--primary)',
      },
    ];

    if (detailed) {
      if (detailed.hydration) {
        items.push({ name: t('evolution.hydration'), current: detailed.hydration.score, change: 0, color: 'var(--accent-secondary)' });
      }
      if (detailed.texture) {
        items.push({ name: t('evolution.texture'), current: detailed.texture.score, change: 0, color: '#F9A8D4' });
      }
      if (detailed.wrinkles) {
        items.push({ name: t('evolution.wrinkles'), current: detailed.wrinkles.score, change: 0, color: '#FBBF24' });
      }
    }

    return items;
  }, [filteredHistory, analyses, overview.current, overview.change, t]);

  const photoAnalyses = useMemo(() => {
    return analyses
      .filter((a) => a.status === 'completed' && a.results && a.images.length > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [analyses]);

  const monthBuckets = useMemo(() => {
    const unique = new Map<string, Date>();

    photoAnalyses.forEach((analysis) => {
      const date = new Date(analysis.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!unique.has(key)) {
        unique.set(key, new Date(date.getFullYear(), date.getMonth(), 1));
      }
    });

    return Array.from(unique.entries())
      .map(([key, date]) => ({ key, date }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [photoAnalyses]);

  useEffect(() => {
    if (monthBuckets.length === 0) {
      setSelectedMonthIndex(0);
      return;
    }
    setSelectedMonthIndex((current) => Math.min(current, monthBuckets.length - 1));
  }, [monthBuckets]);

  const selectedMonthDate = monthBuckets[selectedMonthIndex]?.date ?? null;

  const monthAnalyses = useMemo(() => {
    if (!selectedMonthDate) return [];

    return photoAnalyses
      .filter((analysis) => {
        const d = new Date(analysis.createdAt);
        return d.getFullYear() === selectedMonthDate.getFullYear() && d.getMonth() === selectedMonthDate.getMonth();
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [photoAnalyses, selectedMonthDate]);

  const analysesByDay = useMemo(() => {
    const map = new Map<number, Analysis[]>();
    monthAnalyses.forEach((analysis) => {
      const day = new Date(analysis.createdAt).getDate();
      const list = map.get(day) ?? [];
      list.push(analysis);
      map.set(day, list);
    });
    return map;
  }, [monthAnalyses]);

  useEffect(() => {
    if (monthAnalyses.length === 0) {
      setSelectedAnalysisId(null);
      setSelectedImageIndex(0);
      return;
    }

    const stillVisible = selectedAnalysisId && monthAnalyses.some((a) => a.id === selectedAnalysisId);
    if (!stillVisible) {
      setSelectedAnalysisId(monthAnalyses[monthAnalyses.length - 1].id);
      setSelectedImageIndex(0);
    }
  }, [monthAnalyses, selectedAnalysisId]);

  const selectedAnalysis = useMemo(() => {
    if (!selectedAnalysisId) return null;
    return monthAnalyses.find((a) => a.id === selectedAnalysisId) ?? null;
  }, [monthAnalyses, selectedAnalysisId]);

  const selectedAnalysisImage =
    selectedAnalysis?.images[Math.min(selectedImageIndex, Math.max((selectedAnalysis?.images.length ?? 1) - 1, 0))] ?? null;

  const monthLabel = selectedMonthDate ? format(selectedMonthDate, 'MMMM yyyy') : '';
  const monthLeadEmptyCells = selectedMonthDate ? getDay(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1)) : 0;
  const monthDays = selectedMonthDate ? getDaysInMonth(selectedMonthDate) : 0;

  const handleSelectAnalysis = (analysis: Analysis, imageIndex = 0) => {
    setSelectedAnalysisId(analysis.id);
    setSelectedImageIndex(imageIndex);
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] text-[#4B5563] bg-white/80 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('evolution.back')}</span>
        </button>
        <div className="mt-8 flex items-center justify-center py-28 rounded-3xl border border-[#E5E7EB] bg-white/70 backdrop-blur-sm shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        </div>
      </div>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 lg:space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#BAE6FD] bg-gradient-to-br from-[#F0F9FF] via-[#F8FAFC] to-white p-6 sm:p-8 lg:p-10 shadow-sm">
        <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#0EA5E9]/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#06B6D4]/15 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0EA5E9]/20">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-1">{t('evolution.title')}</h1>
              <p className="text-[#6B7280] text-sm sm:text-base">
                {stats ? `${stats.totalAnalyses} ${t('evolution.totalAnalyses')}` : t('evolution.subtitle')}
              </p>
            </div>
          </div>

          {hasData && (
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[22rem]">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white/90 px-3 py-3 text-center">
                <p className="text-xs text-[#6B7280] mb-1">Current</p>
                <p className="text-xl font-bold text-[#0F172A]">{overview.current}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white/90 px-3 py-3 text-center">
                <p className="text-xs text-[#6B7280] mb-1">Best</p>
                <p className="text-xl font-bold text-[#0F172A]">{overview.best}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white/90 px-3 py-3 text-center">
                <p className="text-xs text-[#6B7280] mb-1">Trend</p>
                <p className={`text-xl font-bold ${overview.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {overview.change > 0 ? '+' : ''}
                  {overview.change}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 border ${
              selectedPeriod === period.id
                ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white border-transparent shadow-lg shadow-[#0EA5E9]/25'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#0EA5E9] hover:border-[#0EA5E9]'
            }`}
          >
            {t(`evolution.periods.${period.id}` as any) || period.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <Card className="rounded-3xl border-[#E5E7EB] bg-white/80 backdrop-blur-sm">
          <div className="py-20 text-center text-[#6B7280]">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-bold mb-2 text-[#1F2937]">{t('evolution.noData')}</h3>
            <p>{t('evolution.noDataDesc')}</p>
          </div>
        </Card>
      ) : (
        <>
          {metricSummary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricSummary.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="rounded-3xl border-[#E5E7EB] bg-white/85 backdrop-blur-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-sm text-[#6B7280]">{metric.name}</h3>
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: metric.color }} aria-hidden="true" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold leading-none" style={{ color: metric.color }}>
                        {metric.current}
                      </span>
                      <span className="text-base text-[#6B7280] mb-0.5">/100</span>
                    </div>
                    {metric.change !== 0 && (
                      <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${metric.change > 0 ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
                        {metric.change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>
                          {metric.change > 0 ? '+' : ''}
                          {metric.change} {t('evolution.points')}
                        </span>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="rounded-3xl border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-[#111827]">{t('evolution.progress')}</h3>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] px-3 py-1.5 text-xs font-semibold text-[#0369A1] w-fit">
                  <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
                  {t('evolution.healthScore')}
                </div>
              </div>

              <div className="h-[20rem] sm:h-[24rem] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 12 }} tickMargin={8} />
                    <YAxis stroke="#6B7280" domain={[0, 100]} tick={{ fontSize: 12 }} tickMargin={8} width={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} fill="url(#colorScore)" name={t('evolution.healthScore')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {photoAnalyses.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
              <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-5">
                <Card className="rounded-3xl border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-[#0EA5E9]" />
                      <div>
                        <h3 className="text-lg font-bold text-[#111827]">{t('evolution.photoTimeline')}</h3>
                        <p className="text-xs text-[#6B7280]">Interactive analysis calendar timeline</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMonthIndex((prev) => Math.min(prev + 1, monthBuckets.length - 1))}
                        disabled={selectedMonthIndex >= monthBuckets.length - 1}
                        className="h-9 w-9 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#0369A1] hover:border-[#0EA5E9] hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMonthIndex((prev) => Math.max(prev - 1, 0))}
                        disabled={selectedMonthIndex <= 0}
                        className="h-9 w-9 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#0369A1] hover:border-[#0EA5E9] hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] px-3 py-1.5 text-xs font-semibold text-[#0369A1]">
                    <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
                    {monthLabel || 'No month selected'}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {WEEK_DAYS.map((weekday) => (
                      <div key={weekday} className="text-[11px] font-bold uppercase tracking-wide text-[#64748B] text-center py-1">
                        {weekday}
                      </div>
                    ))}

                    {Array.from({ length: monthLeadEmptyCells }).map((_, index) => (
                      <div key={`empty-${index}`} className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F8FAFC]/50 min-h-[7.25rem]" />
                    ))}

                    {Array.from({ length: monthDays }, (_, index) => {
                      const day = index + 1;
                      const dayAnalyses = analysesByDay.get(day) ?? [];

                      return (
                        <div key={day} className="rounded-xl border border-[#E5E7EB] bg-white/85 p-2 min-h-[7.25rem] flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#334155]">{day}</span>
                            {dayAnalyses.length > 0 && (
                              <span className="inline-flex items-center rounded-full bg-[#DBEAFE] text-[#1D4ED8] px-1.5 py-0.5 text-[10px] font-semibold">
                                {dayAnalyses.length}
                              </span>
                            )}
                          </div>

                          {dayAnalyses.length === 0 ? (
                            <div className="flex-1 rounded-lg bg-[#F8FAFC] border border-dashed border-[#E5E7EB]" />
                          ) : (
                            <div className="flex flex-col gap-1">
                              {dayAnalyses.slice(0, 2).map((analysis) => {
                                const imageKey = `${analysis.id}-0`;
                                const isBroken = brokenImages[imageKey];
                                const isSelected = selectedAnalysisId === analysis.id;

                                return (
                                  <button
                                    key={analysis.id}
                                    type="button"
                                    onClick={() => handleSelectAnalysis(analysis, 0)}
                                    className={`relative w-full rounded-lg overflow-hidden border transition-all duration-200 ${isSelected ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20' : 'border-[#E5E7EB] hover:border-[#7DD3FC]'}`}
                                  >
                                    {isBroken ? (
                                      <div className="w-full h-12 bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center">
                                        <ImageOff className="w-4 h-4" />
                                      </div>
                                    ) : (
                                      <img
                                        src={analysis.images[0]}
                                        alt={`Analysis ${formatAnalysisDate(analysis.createdAt)}`}
                                        className="w-full h-12 object-cover"
                                        loading="lazy"
                                        onError={() => setBrokenImages((prev) => ({ ...prev, [imageKey]: true }))}
                                      />
                                    )}
                                    <div className="absolute top-1 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">
                                      {analysis.healthScore ?? 0}
                                    </div>
                                  </button>
                                );
                              })}

                              {dayAnalyses.length > 2 && (
                                <p className="text-[10px] text-[#64748B] font-semibold">+{dayAnalyses.length - 2} more</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="rounded-3xl border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                  {!selectedAnalysis ? (
                    <div className="h-full min-h-[26rem] flex items-center justify-center text-center px-4 text-[#6B7280]">
                      <div>
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Select an analysis photo in the calendar to view full details.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#F8FAFC]">
                        {selectedAnalysisImage && !brokenImages[`${selectedAnalysis.id}-${selectedImageIndex}`] ? (
                          <img
                            src={selectedAnalysisImage}
                            alt={`Analysis ${formatAnalysisDate(selectedAnalysis.createdAt)}`}
                            className="w-full h-52 object-cover"
                            onError={() =>
                              setBrokenImages((prev) => ({
                                ...prev,
                                [`${selectedAnalysis.id}-${selectedImageIndex}`]: true,
                              }))
                            }
                          />
                        ) : (
                          <div className="h-52 flex items-center justify-center text-[#9CA3AF] bg-[#F3F4F6]">
                            <ImageOff className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
                        <div className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold text-white bg-black/65 backdrop-blur-sm">
                          {t('evolution.score')}: {selectedAnalysis.healthScore ?? 0}/100
                        </div>
                        <div className="absolute left-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white bg-black/60 backdrop-blur-sm">
                          {formatAnalysisDate(selectedAnalysis.createdAt)}
                        </div>
                      </div>

                      {selectedAnalysis.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {selectedAnalysis.images.map((image, imageIndex) => {
                            const thumbKey = `${selectedAnalysis.id}-${imageIndex}`;
                            const isThumbBroken = brokenImages[thumbKey];
                            const active = selectedImageIndex === imageIndex;

                            return (
                              <button
                                key={thumbKey}
                                type="button"
                                onClick={() => setSelectedImageIndex(imageIndex)}
                                className={`relative rounded-xl overflow-hidden border ${active ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/25' : 'border-[#E5E7EB] hover:border-[#7DD3FC]'}`}
                              >
                                {isThumbBroken ? (
                                  <div className="h-16 flex items-center justify-center bg-[#F3F4F6] text-[#9CA3AF]">
                                    <ImageOff className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <img
                                    src={image}
                                    alt={`Analysis image ${imageIndex + 1}`}
                                    className="h-16 w-full object-cover"
                                    loading="lazy"
                                    onError={() => setBrokenImages((prev) => ({ ...prev, [thumbKey]: true }))}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 overflow-hidden">
                          <p className="text-[11px] uppercase tracking-wide text-[#64748B]">{t('analysis.score.skinType')}</p>
                          <p className="text-sm font-bold text-[#0F172A] mt-1 break-words line-clamp-2" title={selectedAnalysis.results?.skinType || 'N/A'}>
                            {selectedAnalysis.results?.skinType || 'N/A'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                          <p className="text-[11px] uppercase tracking-wide text-[#64748B]">{t('analysis.score.skinAge')}</p>
                          <p className="text-sm font-bold text-[#0F172A] mt-1">{selectedAnalysis.results?.skinAge ?? selectedAnalysis.skinAge ?? 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                          <p className="text-[11px] uppercase tracking-wide text-[#64748B]">Fitzpatrick</p>
                          <p className="text-sm font-bold text-[#0F172A] mt-1">{selectedAnalysis.results?.fitzpatrickType ?? 'N/A'}</p>
                        </div>
                        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                          <p className="text-[11px] uppercase tracking-wide text-[#64748B]">{t('analysis.score.globalHealth')}</p>
                          <p className="text-sm font-bold text-[#0F172A] mt-1">{selectedAnalysis.healthScore ?? selectedAnalysis.results?.healthScore ?? 0}/100</p>
                        </div>
                      </div>

                      {(selectedAnalysis.results?.summary || selectedAnalysis.conditions.length > 0 || selectedAnalysis.results?.concerns?.length) && (
                        <div className="space-y-3">
                          {selectedAnalysis.results?.summary && (
                            <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#64748B] mb-1">Summary</p>
                              <p className="text-sm text-[#1F2937] leading-relaxed">{selectedAnalysis.results.summary}</p>
                            </div>
                          )}

                          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#64748B] mb-2">{t('analysis.history.mainState')}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedAnalysis.conditions.length > 0 ? selectedAnalysis.conditions : [t('analysis.history.normal')]).map((condition) => (
                                <span key={condition} className="inline-flex items-center rounded-full bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD] px-2 py-0.5 text-xs font-semibold">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          </div>

                          {(selectedAnalysis.results?.concerns?.length ?? 0) > 0 && (
                            <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#64748B] mb-2">Concerns</p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedAnalysis.results?.concerns?.map((concern) => (
                                  <span key={concern} className="inline-flex items-center rounded-full bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] px-2 py-0.5 text-xs font-semibold">
                                    {concern}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedAnalysis.results?.detailedAnalysis && (
                        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                          <h4 className="text-sm font-bold text-[#111827] mb-2">{t('analysis.detailed.title')}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedAnalysis.results.detailedAnalysis).map(([key, metric]) => (
                              <div key={key} className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-2.5">
                                <p className="text-[11px] uppercase tracking-wide text-[#64748B]">{METRIC_LABELS[key] || key}</p>
                                <p className="text-sm font-bold text-[#0F172A] mt-1">{metric.score}/100</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedAnalysis.results?.recommendations || selectedAnalysis.recommendations) && (
                        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 space-y-3">
                          <h4 className="text-sm font-bold text-[#111827]">{t('analysis.recommendations.title')}</h4>
                          {(
                            [
                              { title: 'Products', items: selectedAnalysis.results?.recommendations?.products ?? selectedAnalysis.recommendations?.products ?? [] },
                              { title: 'Ingredients', items: selectedAnalysis.results?.recommendations?.ingredients ?? selectedAnalysis.recommendations?.ingredients ?? [] },
                              { title: 'Lifestyle', items: selectedAnalysis.results?.recommendations?.lifestyle ?? selectedAnalysis.recommendations?.lifestyle ?? [] },
                              { title: 'Warnings', items: selectedAnalysis.results?.recommendations?.warnings ?? selectedAnalysis.recommendations?.warnings ?? [] },
                            ] as Array<{ title: string; items: string[] }>
                          )
                            .filter((block) => block.items.length > 0)
                            .map((block) => (
                              <div key={block.title}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-1.5">{block.title}</p>
                                <div className="space-y-1">
                                  {block.items.map((item, idx) => (
                                    <p key={`${block.title}-${idx}`} className="text-sm text-[#1F2937] leading-relaxed">
                                      • {item}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
