import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Loader2, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../card';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analysisService } from '../../../lib/services/analysis.service';
import { filterByPeriod, formatChartDate, formatAnalysisDate } from '../../../lib/analysis-helpers';
import type { Analysis, AnalysisStats } from '../../../lib/types';
import toast from 'react-hot-toast';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

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

export function EvolutionPage({ onBack }: EvolutionPageProps) {
  const { t } = useAccessibilityStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('6m');
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (!timelineRef.current) return;
    const amount = Math.max(220, Math.floor(timelineRef.current.clientWidth * 0.75));
    timelineRef.current.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  };

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

  const photoTimeline = useMemo(() => {
    return analyses
      .filter((a) => a.status === 'completed' && a.images.length > 0)
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        date: formatAnalysisDate(a.createdAt),
        score: a.healthScore,
        image: a.images[0],
      }));
  }, [analyses]);

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

          {photoTimeline.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
              <Card className="rounded-3xl border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-[#0EA5E9]" />
                    <h3 className="text-lg font-bold text-[#111827]">{t('evolution.photoTimeline')}</h3>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollTimeline('left')}
                      className="h-9 w-9 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#0369A1] hover:border-[#0EA5E9] hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      aria-label="Scroll timeline left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTimeline('right')}
                      className="h-9 w-9 rounded-full border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#0369A1] hover:border-[#0EA5E9] hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      aria-label="Scroll timeline right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/90 to-transparent z-10" />
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent z-10" />

                  <div
                    ref={timelineRef}
                    className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
                  >
                  {photoTimeline.map((item, index) => {
                    const isBroken = brokenImages[item.id];

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.36 + index * 0.06 }}
                        className="group snap-start shrink-0 w-[12.5rem] sm:w-[13.5rem] lg:w-[14.5rem]"
                      >
                        <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#F8FAFC] group-hover:border-[#0EA5E9] group-hover:shadow-xl group-hover:shadow-[#0EA5E9]/20 transition-all duration-300">
                          {isBroken ? (
                            <div className="w-full aspect-square flex items-center justify-center text-[#9CA3AF] bg-[#F3F4F6]">
                              <ImageOff className="w-7 h-7" />
                            </div>
                          ) : (
                            <img
                              src={item.image}
                              alt={`Analysis ${item.date}`}
                              className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                            />
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
                          <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 text-white rounded-full text-xs font-bold backdrop-blur-sm">
                            {item.score}
                          </div>
                          <div className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 bg-white/90 border border-white/70 text-[11px] text-[#0F172A] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9]" />
                            {item.date}
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <p className="text-xs text-[#6B7280] tracking-wide uppercase">#{index + 1}</p>
                          <p className="text-sm font-semibold text-[#1F2937] leading-tight">
                            {t('evolution.score')}: {item.score}/100
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
