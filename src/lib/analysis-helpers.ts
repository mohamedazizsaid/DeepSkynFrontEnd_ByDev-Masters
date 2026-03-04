import { format } from 'date-fns';
import type { GeminiAnalysisResult, AnalysisStats } from './types';

// ─── Metric Configuration ───

export type MetricStatus = 'excellent' | 'good' | 'needs-attention';

export interface DetailedScoreItem {
  key: string;
  category: string;
  score: number;
  description: string;
  color: string;
  status: MetricStatus;
}

export interface RadarDataPoint {
  category: string;
  value: number;
  fullMark: number;
}

/** Metric display config: label, color */
const METRIC_CONFIG: Record<string, { label: string; color: string }> = {
  hydration:     { label: 'Hydration',     color: '#06B6D4' },
  texture:       { label: 'Texture',       color: '#0EA5E9' },
  pores:         { label: 'Pores',         color: '#8B5CF6' },
  pigmentation:  { label: 'Pigmentation',  color: '#F59E0B' },
  wrinkles:      { label: 'Wrinkles',      color: '#10B981' },
  acne:          { label: 'Acne',          color: '#EF4444' },
  redness:       { label: 'Redness',       color: '#F97316' },
  elasticity:    { label: 'Elasticity',    color: '#EC4899' },
};

// ─── Score Helpers ───

/** Convert a 0-100 score into a UI status */
export function getStatusFromScore(score: number): MetricStatus {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  return 'needs-attention';
}

/** Tailwind class for a given status */
export function getStatusColorClass(status: MetricStatus): string {
  switch (status) {
    case 'excellent':       return 'bg-[#10B981]/10 text-[#10B981]';
    case 'good':            return 'bg-[#0EA5E9]/10 text-[#0EA5E9]';
    case 'needs-attention': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
  }
}

// ─── Data Extractors ───

/**
 * Extract the 8 detailed scores from a GeminiAnalysisResult into an
 * array of UI-ready objects, sorted worst → best.
 */
export function extractDetailedScores(
  results: GeminiAnalysisResult | null,
): DetailedScoreItem[] {
  if (!results?.detailedAnalysis) return [];

  return Object.entries(results.detailedAnalysis)
    .map(([key, metric]) => {
      const cfg = METRIC_CONFIG[key] ?? { label: key, color: '#6B7280' };
      const score = metric?.score ?? 0;
      return {
        key,
        category: cfg.label,
        score,
        description: metric?.description ?? '',
        color: cfg.color,
        status: getStatusFromScore(score),
      };
    })
    .sort((a, b) => a.score - b.score); // worst first → draws attention
}

/**
 * Build radar chart data from the detailed analysis.
 */
export function buildRadarData(results: GeminiAnalysisResult | null): RadarDataPoint[] {
  if (!results?.detailedAnalysis) return [];

  return Object.entries(results.detailedAnalysis).map(([key, metric]) => {
    const cfg = METRIC_CONFIG[key] ?? { label: key, color: '#6B7280' };
    return {
      category: cfg.label,
      value: metric?.score ?? 0,
      fullMark: 100,
    };
  });
}

/**
 * Calculate the score change between the last two entries in the
 * healthScoreHistory array.  Returns 0 when not enough data.
 */
export function calculateScoreChange(
  stats: AnalysisStats | null,
): number {
  if (!stats?.healthScoreHistory || stats.healthScoreHistory.length < 2) return 0;
  const history = stats.healthScoreHistory;
  return history[history.length - 1].score - history[history.length - 2].score;
}

/**
 * Filter a healthScoreHistory by the selected period code.
 */
export function filterByPeriod(
  history: Array<{ date: string; score: number }>,
  period: string,
): Array<{ date: string; score: number }> {
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case '1m': cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    case '3m': cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
    case '6m': cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
    case '1y': cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    default:   cutoff = new Date(0);
  }
  return history.filter((h) => new Date(h.date) >= cutoff);
}

// ─── Formatters ───

/** Format an ISO date string into a human-readable form */
export function formatAnalysisDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

/** Short date for chart axis labels */
export function formatChartDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d');
  } catch {
    return dateString;
  }
}

/** Get the metric config map for consumers that need colors/labels */
export function getMetricConfig() {
  return METRIC_CONFIG;
}
