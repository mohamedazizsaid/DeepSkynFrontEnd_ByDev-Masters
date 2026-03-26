import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Loader2, ImageOff } from 'lucide-react';
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

  // ─── Load stats + all analyses ───
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

  // ─── Filtered chart data ───
  const filteredHistory = useMemo(() => {
    if (!stats?.healthScoreHistory) return [];
    return filterByPeriod(stats.healthScoreHistory, selectedPeriod);
  }, [stats, selectedPeriod]);

  const chartData = useMemo(() => {
    return filteredHistory.map((entry) => ({
      date: formatChartDate(entry.date),
      score: entry.score,
    }));
  }, [filteredHistory]);

  // ─── Metric summary cards ───
  const metricSummary = useMemo(() => {
    if (filteredHistory.length < 1) return [];
    const current = filteredHistory[filteredHistory.length - 1].score;
    const first = filteredHistory[0].score;
    const change = current - first;

    // Build metrics from latest completed analysis details
    const latestCompleted = analyses.find((a) => a.status === 'completed' && a.results);
    const detailed = latestCompleted?.results?.detailedAnalysis;

    const items: { name: string; current: number; change: number; color: string }[] = [
      { name: t('evolution.overallScore'), current, change, color: '#0EA5E9' },
    ];

    if (detailed) {
      if (detailed.hydration) items.push({ name: t('evolution.hydration'), current: detailed.hydration.score, change: 0, color: '#06B6D4' });
      if (detailed.texture)   items.push({ name: t('evolution.texture'), current: detailed.texture.score, change: 0, color: '#F9A8D4' });
      if (detailed.wrinkles)  items.push({ name: t('evolution.wrinkles'), current: detailed.wrinkles.score, change: 0, color: '#FBBF24' });
    }

    return items;
  }, [filteredHistory, analyses, t]);

  // ─── Photo timeline (recent analyses with images) ───
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

  // ─── Loading ───
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[#6B7280] mb-8">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('evolution.back')}</span>
        </div>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  const hasData = chartData.length > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('evolution.title')}</h1>
            <p className="text-[#6B7280]">
              {stats ? `${stats.totalAnalyses} ${t('evolution.totalAnalyses')}` : t('evolution.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {PERIODS.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              selectedPeriod === period.id
                ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-md'
                : 'bg-white border-2 border-[#E5E7EB] text-[#6B7280] hover:border-[#0EA5E9]'
            }`}
          >
            {t(`evolution.periods.${period.id}` as any) || period.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <Card>
          <div className="py-20 text-center text-[#6B7280]">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-bold mb-2">{t('evolution.noData')}</h3>
            <p>{t('evolution.noDataDesc')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Metrics Grid */}
          {metricSummary.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metricSummary.map((metric, index) => (
                <motion.div key={metric.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card>
                    <div className="mb-3">
                      <h3 className="text-sm text-[#6B7280] mb-1">{metric.name}</h3>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold" style={{ color: metric.color }}>
                          {metric.current}
                        </span>
                        <span className="text-lg text-[#6B7280] mb-1">/ 100</span>
                      </div>
                    </div>
                    {metric.change !== 0 && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${metric.change > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {metric.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{metric.change > 0 ? '+' : ''}{metric.change} {t('evolution.points')}</span>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Evolution Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
            <Card>
              <h3 className="text-lg font-bold mb-6">{t('evolution.progress')}</h3>
              <div className="h-96 w-full ltr:dir-ltr rtl:dir-ltr"> {/* Charts are generally LTR internally plotted */}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6B7280" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#0EA5E9" strokeWidth={3} fill="url(#colorScore)" name={t('evolution.healthScore')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
                  <span className="text-sm text-[#6B7280]">{t('evolution.healthScore')}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Photo Timeline */}
          {photoTimeline.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-[#0EA5E9]" />
                  <h3 className="text-lg font-bold">{t('evolution.photoTimeline')}</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {photoTimeline.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="relative group"
                    >
                      <div className="relative rounded-xl overflow-hidden border-2 border-[#E5E7EB] group-hover:border-[#0EA5E9] transition-all duration-200">
                        <img
                          src={item.image}
                          alt={`Analysis ${item.date}`}
                          className="w-full aspect-square object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('bg-[#F3F4F6]', 'flex', 'items-center', 'justify-center');
                          }}
                        />
                        <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 text-white rounded-full text-sm font-bold">
                          {item.score}
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-[#374151]">{item.date}</p>
                        <p className="text-xs text-[#6B7280]">{t('evolution.score')}: {item.score}/100</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
