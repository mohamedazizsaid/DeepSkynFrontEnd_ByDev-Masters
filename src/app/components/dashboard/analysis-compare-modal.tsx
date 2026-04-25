import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Minus, Loader2, AlertTriangle, Sparkles, Calendar,
  Droplets, CircleDot, Sun, Flame, Heart, Zap, Eye,
  ArrowRight, CheckCircle, XCircle, SlidersHorizontal,
  GitCompare,
} from 'lucide-react';
import { analysisService } from '../../../lib/services/analysis.service';
import { extractDetailedScores } from '../../../lib/analysis-helpers';
import type { Analysis, AnalysisComparison } from '../../../lib/types';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

// ─── Metric icon map ─────────────────────────────────────────────────────────
const METRIC_ICONS: Record<string, React.ReactNode> = {
  hydration:    <Droplets   className="w-4 h-4" />,
  texture:      <Sparkles   className="w-4 h-4" />,
  pores:        <CircleDot  className="w-4 h-4" />,
  pigmentation: <Sun        className="w-4 h-4" />,
  wrinkles:     <TrendingUp className="w-4 h-4" />,
  acne:         <Flame      className="w-4 h-4" />,
  redness:      <Heart      className="w-4 h-4" />,
  elasticity:   <Zap        className="w-4 h-4" />,
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
const fmtShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

// ─── DeltaBadge ───────────────────────────────────────────────────────────────
function DeltaBadge({ delta, isHcHigh }: { delta: number; isHcHigh: boolean }) {
  const base = isHcHigh
    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border-2'
    : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold';

  if (delta === 0) return (
    <span className={`${base} ${isHcHigh ? 'border-yellow-400 text-yellow-300 bg-black' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
      <Minus className="w-3 h-3" /> 0
    </span>
  );
  const up = delta > 0;
  return (
    <span className={`${base} ${
      isHcHigh
        ? up ? 'border-green-400 text-green-300 bg-black' : 'border-red-400 text-red-300 bg-black'
        : up ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
             : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{delta}
    </span>
  );
}

// ─── Analysis selector card ───────────────────────────────────────────────────
interface SelectorCardProps {
  label: string;
  placeholder: string;
  noOther: string;
  selected: Analysis | null;
  analyses: Analysis[];
  onSelect: (a: Analysis) => void;
  excludeId?: string;
  side: 'left' | 'right';
  isDark: boolean;
  isHcHigh: boolean;
}

function SelectorCard({ label, placeholder, noOther, selected, analyses, onSelect, excludeId, side, isDark, isHcHigh }: SelectorCardProps) {
  const [open, setOpen] = useState(false);
  const gradientFrom = side === 'left' ? 'from-blue-500' : 'from-cyan-500';
  const gradientTo   = side === 'left' ? 'to-cyan-500'  : 'to-indigo-500';

  const filtered = analyses.filter(a => a.id !== excludeId && a.status === 'completed');

  const btnClass = isHcHigh
    ? 'w-full text-left rounded-2xl border-2 border-yellow-400 bg-black hover:bg-yellow-900/20 transition-all'
    : 'w-full text-left rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md group';

  const dropdownClass = isHcHigh
    ? 'mt-2 rounded-2xl border-2 border-yellow-400 bg-black shadow-xl z-[1502] relative overflow-hidden'
    : 'mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg shadow-xl z-[1502] relative overflow-hidden';

  return (
    <div className="flex-1 min-w-0">
      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
        isHcHigh ? 'text-yellow-300' : `bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`
      }`}>
        {label}
      </div>

      <button onClick={() => setOpen(o => !o)} className={btnClass}>
        {selected ? (
          <div className="p-3 flex items-center gap-3">
            {selected.images?.[0] ? (
              <img src={selected.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-blue-400/30" />
            ) : (
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center flex-shrink-0`}>
                <Eye className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className={`font-semibold text-sm truncate ${isHcHigh ? 'text-yellow-100' : 'text-slate-900 dark:text-white'}`}>
                {fmtDate(selected.createdAt)}
              </div>
              <div className={`text-xs ${isHcHigh ? 'text-yellow-300' : 'text-slate-500 dark:text-slate-400'}`}>
                Score: <span className={`font-bold ${isHcHigh ? 'text-yellow-100' : 'text-blue-600 dark:text-blue-400'}`}>{selected.healthScore ?? '—'}</span>/100
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-90' : ''} ${isHcHigh ? 'text-yellow-300' : 'text-slate-400'}`} />
          </div>
        ) : (
          <div className={`p-3 flex items-center gap-3 ${isHcHigh ? 'text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-30 flex items-center justify-center flex-shrink-0`}>
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm">{placeholder}</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className={dropdownClass}
          >
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filtered.length === 0 ? (
                <p className={`px-4 py-6 text-sm text-center ${isHcHigh ? 'text-yellow-300' : 'text-slate-500 dark:text-slate-400'}`}>{noOther}</p>
              ) : filtered.map(a => (
                <button
                  key={a.id}
                  onClick={() => { onSelect(a); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    isHcHigh
                      ? 'hover:bg-yellow-900/30 text-yellow-100'
                      : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  } ${selected?.id === a.id ? (isHcHigh ? 'bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20') : ''}`}
                >
                  {a.images?.[0] ? (
                    <img src={a.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 ${isHcHigh ? 'bg-yellow-900' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${isHcHigh ? 'text-yellow-100' : 'text-slate-800 dark:text-white'}`}>{fmtDate(a.createdAt)}</div>
                    <div className={`text-xs ${isHcHigh ? 'text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>Score {a.healthScore ?? '—'}/100</div>
                  </div>
                  {selected?.id === a.id && <CheckCircle className={`w-4 h-4 ml-auto flex-shrink-0 ${isHcHigh ? 'text-yellow-300' : 'text-blue-500'}`} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Before/After Image Slider ────────────────────────────────────────────────
interface ImageSliderProps {
  before: string;
  after: string;
  labelBefore: string;
  labelAfter: string;
  dragHint: string;
}

function ImageSlider({ before, after, labelBefore, labelAfter, dragHint }: ImageSliderProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true); };
  const onMouseMove = useCallback((e: MouseEvent) => { if (dragging) updatePosition(e.clientX); }, [dragging, updatePosition]);
  const onMouseUp   = useCallback(() => setDragging(false), []);
  const onTouchStart = () => setDragging(true);
  const onTouchMove  = useCallback((e: TouchEvent) => {
    if (dragging) { e.preventDefault(); updatePosition(e.touches[0].clientX); }
  }, [dragging, updatePosition]);
  const onTouchEnd = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{ aspectRatio: '4/3', cursor: dragging ? 'ew-resize' : 'col-resize' }}
    >
      <img src={after} alt={labelAfter} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before} alt={labelBefore} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${position}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{ left: `${position}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <motion.div whileHover={{ scale: 1.15 }} className="w-10 h-10 rounded-full bg-white shadow-2xl ring-2 ring-blue-400/60 flex items-center justify-center cursor-ew-resize">
          <div className="flex items-center gap-0.5">
            <ChevronLeft className="w-3.5 h-3.5 text-blue-500" />
            <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-semibold pointer-events-none">{labelBefore}</div>
      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-semibold pointer-events-none">{labelAfter}</div>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {dragHint}
        </div>
      </motion.div>
    </div>
  );
}

// ─── MetricRow ────────────────────────────────────────────────────────────────
interface MetricRowProps {
  label: string;
  metricKey: string;
  score1: number;
  score2: number;
  color: string;
  isHcHigh: boolean;
  isDark: boolean;
}

function MetricRow({ label, metricKey, score1, score2, color, isHcHigh, isDark }: MetricRowProps) {
  const delta = score2 - score1;
  const rowClass = isHcHigh
    ? 'flex items-center gap-3 py-2.5 border-b-2 border-yellow-900 last:border-0'
    : 'flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0';

  return (
    <div className={rowClass}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>
        {METRIC_ICONS[metricKey] ?? <Eye className="w-4 h-4" />}
      </div>
      <span className={`text-sm font-medium w-28 flex-shrink-0 truncate ${isHcHigh ? 'text-yellow-100' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>

      {/* Before bar */}
      <div className="flex-1 flex items-center gap-1.5">
        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isHcHigh ? 'bg-yellow-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
          <motion.div
            className={`h-full rounded-full ${isHcHigh ? 'bg-yellow-600' : 'bg-slate-400 dark:bg-slate-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${score1}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
        <span className={`text-xs font-bold w-7 text-right ${isHcHigh ? 'text-yellow-300' : 'text-slate-500 dark:text-slate-400'}`}>{score1}</span>
      </div>

      <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${isHcHigh ? 'text-yellow-600' : 'text-slate-300 dark:text-slate-600'}`} />

      {/* After bar */}
      <div className="flex-1 flex items-center gap-1.5">
        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isHcHigh ? 'bg-yellow-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: isHcHigh ? '#00ffff' : color }}
            initial={{ width: 0 }}
            animate={{ width: `${score2}%` }}
            transition={{ duration: 0.7, delay: 0.1 }}
          />
        </div>
        <span className="text-xs font-bold w-7 text-right" style={{ color: isHcHigh ? '#00ffff' : color }}>{score2}</span>
      </div>

      <div className="w-16 flex-shrink-0 flex justify-end">
        <DeltaBadge delta={delta} isHcHigh={isHcHigh} />
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
interface AnalysisCompareModalProps {
  open: boolean;
  onClose: () => void;
  allAnalyses: Analysis[];
  initialA?: Analysis | null;
}

export function AnalysisCompareModal({ open, onClose, allAnalyses, initialA }: AnalysisCompareModalProps) {
  const { theme, contrastMode, t } = useAccessibilityStore();
  const isDark    = theme === 'dark';
  const isHcHigh  = contrastMode === 'high';
  const isHcMed   = contrastMode === 'medium';

  // ── Derived CSS classes matching the rest of analysis-page ────────────
  const panelBg = isHcHigh
    ? 'bg-black border-2 border-yellow-400'
    : isDark
      ? 'bg-slate-900/80 border border-white/10'
      : 'bg-white/80 border border-slate-200/50';

  const headingClass = isHcHigh
    ? 'text-yellow-100'
    : isDark ? 'text-white' : 'text-slate-900';

  const subClass = isHcHigh
    ? 'text-yellow-400'
    : isDark ? 'text-slate-400' : 'text-slate-500';

  const cardClass = isHcHigh
    ? 'rounded-2xl border-2 border-yellow-600 bg-black p-4'
    : isDark
      ? 'rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md shadow-sm'
      : 'rounded-2xl border border-slate-100 bg-slate-50/50 p-4 backdrop-blur-md shadow-sm';

  // ── State ─────────────────────────────────────────────────────────────
  const [analysisA, setAnalysisA] = useState<Analysis | null>(initialA ?? null);
  const [analysisB, setAnalysisB] = useState<Analysis | null>(null);
  const [comparison, setComparison] = useState<AnalysisComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (initialA) setAnalysisA(initialA); }, [initialA]);

  useEffect(() => {
    if (!analysisA || !analysisB) { setComparison(null); return; }
    if (analysisA.id === analysisB.id) { setError(t('analysis.compare.errorDifferent')); return; }
    setError(null);
    setLoading(true);
    analysisService
      .compare(analysisA.id, analysisB.id)
      .then(setComparison)
      .catch(() => setError(t('analysis.compare.errorLoad')))
      .finally(() => setLoading(false));
  }, [analysisA?.id, analysisB?.id]);

  const handleClose = () => {
    setComparison(null);
    setAnalysisB(null);
    setError(null);
    onClose();
  };

  const scoresA = analysisA?.results ? extractDetailedScores(analysisA.results) : [];
  const scoresB = analysisB?.results ? extractDetailedScores(analysisB.results) : [];
  const mergedMetrics = scoresA.map(sa => ({ ...sa, score2: scoresB.find(sb => sb.key === sa.key)?.score ?? 0 }));
  const diff = comparison?.comparison;
  const hasImages = (analysisA?.images?.length ?? 0) > 0 && (analysisB?.images?.length ?? 0) > 0;

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[1501] w-full md:max-w-4xl flex flex-col"
          >
            <div className={`relative flex flex-col max-h-[92vh] md:max-h-[90vh] rounded-t-3xl md:rounded-3xl overflow-hidden backdrop-blur-2xl shadow-[0_-20px_80px_rgba(0,0,0,0.25)] md:shadow-2xl ${panelBg}`}>

              {/* Gradient accent bar */}
              <div className={`absolute inset-x-0 top-0 h-1 ${isHcHigh ? 'bg-yellow-400' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500'}`} />

              {/* Mobile drag handle */}
              <div className="md:hidden pt-3 pb-1 flex justify-center">
                <div className={`w-10 h-1 rounded-full ${isHcHigh ? 'bg-yellow-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
              </div>

              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${isHcHigh ? 'border-yellow-700' : isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shadow-lg ${isHcHigh ? 'bg-yellow-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/30'}`}>
                    <GitCompare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${headingClass}`}>{t('analysis.compare.title')}</h2>
                    <p className={`text-xs ${subClass}`}>{t('analysis.compare.subtitle')}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className={`p-2 rounded-xl transition-colors ${isHcHigh ? 'hover:bg-yellow-900 text-yellow-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="p-5 md:p-6 space-y-6">

                  {/* ── Selectors ── */}
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    <SelectorCard
                      label={t('analysis.compare.labelA')}
                      placeholder={t('analysis.compare.choosePlaceholder')}
                      noOther={t('analysis.compare.noOther')}
                      selected={analysisA}
                      analyses={allAnalyses}
                      onSelect={setAnalysisA}
                      excludeId={analysisB?.id}
                      side="left"
                      isDark={isDark}
                      isHcHigh={isHcHigh}
                    />
                    <div className="hidden sm:flex items-center justify-center self-center mt-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isHcHigh ? 'bg-yellow-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <SelectorCard
                      label={t('analysis.compare.labelB')}
                      placeholder={t('analysis.compare.choosePlaceholder')}
                      noOther={t('analysis.compare.noOther')}
                      selected={analysisB}
                      analyses={allAnalyses}
                      onSelect={setAnalysisB}
                      excludeId={analysisA?.id}
                      side="right"
                      isDark={isDark}
                      isHcHigh={isHcHigh}
                    />
                  </div>

                  {/* ── Error ── */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                        isHcHigh
                          ? 'bg-black border-2 border-red-400 text-red-300'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* ── Loading ── */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                        <Loader2 className={`w-10 h-10 ${isHcHigh ? 'text-yellow-400' : 'text-blue-500'}`} />
                      </motion.div>
                      <p className={`text-sm ${subClass}`}>{t('analysis.compare.loading')}</p>
                    </div>
                  )}

                  {/* ── Content ── */}
                  {!loading && comparison && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Date summary */}
                      <div className={`flex items-center gap-2 text-sm flex-wrap ${subClass}`}>
                        <Calendar className="w-4 h-4" />
                        <span className={`font-semibold ${headingClass}`}>{fmtDate(comparison.analysis1.createdAt)}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span className={`font-semibold ${headingClass}`}>{fmtDate(comparison.analysis2.createdAt)}</span>
                      </div>

                      {/* ── Image Slider ── */}
                      {hasImages && (
                        <div>
                          <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isHcHigh ? 'text-yellow-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            <SlidersHorizontal className={`w-4 h-4 ${isHcHigh ? 'text-yellow-400' : 'text-blue-500'}`} />
                            {t('analysis.compare.visualTitle')}
                          </h3>
                          <ImageSlider
                            before={comparison.analysis1.images[0]}
                            after={comparison.analysis2.images[0]}
                            labelBefore={fmtShort(comparison.analysis1.createdAt)}
                            labelAfter={fmtShort(comparison.analysis2.createdAt)}
                            dragHint={t('analysis.compare.dragHint')}
                          />
                        </div>
                      )}

                      {/* ── Score Overview Cards ── */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Health score */}
                        <div className={`col-span-2 sm:col-span-2 rounded-2xl p-4 ${
                          isHcHigh
                            ? 'bg-black border-2 border-yellow-500'
                            : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30'
                        }`}>
                          <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isHcHigh ? 'text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>{t('analysis.compare.scoreTitle')}</div>
                          <div className="flex items-end gap-3">
                            <div>
                              <div className={`text-3xl font-black ${headingClass}`}>{comparison.analysis1.healthScore ?? '—'}</div>
                              <div className={`text-xs ${subClass}`}>{t('analysis.compare.scoreBefore')}</div>
                            </div>
                            <ArrowRight className={`w-5 h-5 mb-2 ${subClass}`} />
                            <div>
                              <div className={`text-3xl font-black ${isHcHigh ? 'text-yellow-300' : 'text-blue-600 dark:text-blue-400'}`}>{comparison.analysis2.healthScore ?? '—'}</div>
                              <div className={`text-xs ${subClass}`}>{t('analysis.compare.scoreAfter')}</div>
                            </div>
                            <div className="ml-auto self-center">
                              <DeltaBadge delta={diff?.healthScoreChange ?? 0} isHcHigh={isHcHigh} />
                            </div>
                          </div>
                        </div>

                        {/* Skin age */}
                        <div className={`rounded-2xl p-4 ${
                          isHcHigh
                            ? 'bg-black border-2 border-yellow-500'
                            : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/30'
                        }`}>
                          <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isHcHigh ? 'text-yellow-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{t('analysis.compare.skinAgeTitle')}</div>
                          <div className={`text-2xl font-black ${headingClass}`}>
                            {comparison.analysis2.skinAge ?? '—'}
                            <span className={`text-sm font-normal ml-1 ${subClass}`}>{t('analysis.compare.skinAgeUnit')}</span>
                          </div>
                          <DeltaBadge delta={-(diff?.skinAgeChange ?? 0)} isHcHigh={isHcHigh} />
                        </div>

                        {/* Skin type */}
                        <div className={`rounded-2xl p-4 ${
                          isHcHigh
                            ? 'bg-black border-2 border-yellow-500'
                            : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30'
                        }`}>
                          <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isHcHigh ? 'text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{t('analysis.compare.skinTypeTitle')}</div>
                          <div className={`text-sm font-bold capitalize truncate ${headingClass}`}>
                            {comparison.analysis2.results?.skinType ?? '—'}
                          </div>
                        </div>
                      </div>

                      {/* ── Conditions diff ── */}
                      {((diff?.newConditions?.length ?? 0) > 0 || (diff?.resolvedConditions?.length ?? 0) > 0) && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {(diff?.resolvedConditions?.length ?? 0) > 0 && (
                            <div className={`rounded-2xl p-4 ${isHcHigh ? 'bg-black border-2 border-green-500' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30'}`}>
                              <div className={`flex items-center gap-2 mb-3 font-semibold text-sm ${isHcHigh ? 'text-green-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                <CheckCircle className="w-4 h-4" /> {t('analysis.compare.resolvedTitle')}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {diff!.resolvedConditions.map((c, i) => (
                                  <span key={i} className={`px-2.5 py-1 text-xs rounded-full font-medium ${isHcHigh ? 'bg-green-900 text-green-200' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'}`}>{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(diff?.newConditions?.length ?? 0) > 0 && (
                            <div className={`rounded-2xl p-4 ${isHcHigh ? 'bg-black border-2 border-red-500' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'}`}>
                              <div className={`flex items-center gap-2 mb-3 font-semibold text-sm ${isHcHigh ? 'text-red-300' : 'text-red-700 dark:text-red-400'}`}>
                                <XCircle className="w-4 h-4" /> {t('analysis.compare.newTitle')}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {diff!.newConditions.map((c, i) => (
                                  <span key={i} className={`px-2.5 py-1 text-xs rounded-full font-medium ${isHcHigh ? 'bg-red-900 text-red-200' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Metrics diff ── */}
                      {mergedMetrics.length > 0 && (
                        <div>
                          <h3 className={`text-sm font-bold mb-1 flex items-center gap-2 ${isHcHigh ? 'text-yellow-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            <Sparkles className={`w-4 h-4 ${isHcHigh ? 'text-yellow-400' : 'text-blue-500'}`} />
                            {t('analysis.compare.metricsTitle')}
                          </h3>
                          <p className={`text-xs mb-3 ${subClass}`}>{t('analysis.compare.metricsSubtitle')}</p>
                          <div className={cardClass}>
                            {mergedMetrics.map(m => (
                              <MetricRow
                                key={m.key}
                                label={m.category}
                                metricKey={m.key}
                                score1={m.score}
                                score2={m.score2}
                                color={m.color}
                                isHcHigh={isHcHigh}
                                isDark={isDark}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Recommendations diff ── */}
                      {(comparison.analysis1.recommendations || comparison.analysis2.recommendations) && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {[comparison.analysis1, comparison.analysis2].map((a, idx) => (
                            <div key={idx} className={cardClass}>
                              <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${idx === 0 ? subClass : isHcHigh ? 'text-yellow-300' : 'text-blue-500'}`}>
                                {idx === 0 ? `${t('analysis.compare.recoTitle')} — ${fmtShort(a.createdAt)}` : `${t('analysis.compare.recoTitle')} — ${fmtShort(a.createdAt)}`}
                              </div>
                              {a.recommendations?.products?.slice(0, 3).map((p, i) => (
                                <div key={i} className={`flex items-start gap-2 text-xs mb-1.5 ${isHcHigh ? 'text-yellow-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${idx === 0 ? (isHcHigh ? 'bg-yellow-700' : 'bg-slate-400') : (isHcHigh ? 'bg-yellow-300' : 'bg-blue-500')}`} />
                                  {p}
                                </div>
                              ))}
                              {(!a.recommendations?.products?.length) && (
                                <p className={`text-xs italic ${subClass}`}>{t('analysis.compare.noReco')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Placeholder ── */}
                  {!loading && !comparison && !error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-14 text-center"
                    >
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${
                        isHcHigh
                          ? 'bg-black border-2 border-yellow-500'
                          : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/40 dark:border-blue-700/30'
                      }`}>
                        <GitCompare className={`w-9 h-9 ${isHcHigh ? 'text-yellow-400' : 'text-blue-400 dark:text-blue-500'}`} />
                      </div>
                      <p className={`text-sm max-w-xs leading-relaxed ${subClass}`}>
                        {t('analysis.compare.placeholder')}
                      </p>
                    </motion.div>
                  )}

                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
