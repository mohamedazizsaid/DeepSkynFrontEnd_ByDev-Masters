import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronRight, ChevronLeft, Sparkles, SkipForward,
  LayoutDashboard, Scan, Calendar, MessageCircle, Users,
  Bell, User, TrendingUp, Shield, Zap, Activity, Heart
} from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

// ─── Tour Step Definition ────────────────────────────────────────────────
interface TourStep {
  /** CSS selector of the element to highlight */
  selector: string;
  /** Translation key for the title */
  titleKey: string;
  /** Translation key for the description */
  descriptionKey: string;
  /** Which side the tooltip should appear on */
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Icon component */
  icon: React.ReactNode;
  /** Gradient for the icon badge */
  gradient: string;
}

// ─── Tour Steps Config ───────────────────────────────────────────────────
const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="welcome"]',
    titleKey: 'tour.welcomeTitle',
    descriptionKey: 'tour.welcomeDesc',
    placement: 'center',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-[#0EA5E9] to-[#06B6D4]',
  },
  {
    selector: '[data-tour="navbar-logo"]',
    titleKey: 'tour.logoTitle',
    descriptionKey: 'tour.logoDesc',
    placement: 'bottom',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-[#0EA5E9] to-[#06B6D4]',
  },
  {
    selector: '[data-tour="nav-analysis"]',
    titleKey: 'tour.analysisTitle',
    descriptionKey: 'tour.analysisDesc',
    placement: 'bottom',
    icon: <Scan className="w-5 h-5" />,
    gradient: 'from-[#0EA5E9] to-[#06B6D4]',
  },
  {
    selector: '[data-tour="nav-routine"]',
    titleKey: 'tour.routineTitle',
    descriptionKey: 'tour.routineDesc',
    placement: 'bottom',
    icon: <Calendar className="w-5 h-5" />,
    gradient: 'from-[#F9A8D4] to-[#F472B6]',
  },
  {
    selector: '[data-tour="nav-coach"]',
    titleKey: 'tour.coachTitle',
    descriptionKey: 'tour.coachDesc',
    placement: 'bottom',
    icon: <MessageCircle className="w-5 h-5" />,
    gradient: 'from-[#FBBF24] to-[#F59E0B]',
  },
  {
    selector: '[data-tour="nav-community"]',
    titleKey: 'tour.communityTitle',
    descriptionKey: 'tour.communityDesc',
    placement: 'bottom',
    icon: <Users className="w-5 h-5" />,
    gradient: 'from-[#8B5CF6] to-[#6366F1]',
  },
  {
    selector: '[data-tour="nav-notifications"]',
    titleKey: 'tour.notificationsTitle',
    descriptionKey: 'tour.notificationsDesc',
    placement: 'bottom',
    icon: <Bell className="w-5 h-5" />,
    gradient: 'from-[#EF4444] to-[#DC2626]',
  },
  {
    selector: '[data-tour="nav-profile"]',
    titleKey: 'tour.profileTitle',
    descriptionKey: 'tour.profileDesc',
    placement: 'bottom',
    icon: <User className="w-5 h-5" />,
    gradient: 'from-[#8B5CF6] to-[#6366F1]',
  },
  {
    selector: '[data-tour="dashboard-stats"]',
    titleKey: 'tour.statsTitle',
    descriptionKey: 'tour.statsDesc',
    placement: 'bottom',
    icon: <Shield className="w-5 h-5" />,
    gradient: 'from-[#10B981] to-[#059669]',
  },
  {
    selector: '[data-tour="dashboard-score"]',
    titleKey: 'tour.scoreTitle',
    descriptionKey: 'tour.scoreDesc',
    placement: 'right',
    icon: <Zap className="w-5 h-5" />,
    gradient: 'from-[#0EA5E9] to-[#06B6D4]',
  },
  {
    selector: '[data-tour="dashboard-evolution"]',
    titleKey: 'tour.evolutionTitle',
    descriptionKey: 'tour.evolutionDesc',
    placement: 'top',
    icon: <TrendingUp className="w-5 h-5" />,
    gradient: 'from-[#F59E0B] to-[#D97706]',
  },
  {
    selector: '[data-tour="dashboard-quick-actions"]',
    titleKey: 'tour.quickActionsTitle',
    descriptionKey: 'tour.quickActionsDesc',
    placement: 'top',
    icon: <Activity className="w-5 h-5" />,
    gradient: 'from-[#EC4899] to-[#DB2777]',
  },
  {
    selector: '[data-tour="finale"]',
    titleKey: 'tour.finaleTitle',
    descriptionKey: 'tour.finaleDesc',
    placement: 'center',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-[#10B981] to-[#059669]',
  },
];

const TOUR_STORAGE_KEY = 'deepskyn_tour_completed';

// ─── Guided Tour Component ──────────────────────────────────────────────
interface GuidedTourProps {
  /** Force the tour to display (for replay) */
  forceShow?: boolean;
  /** Callback when tour is completed or skipped */
  onComplete?: () => void;
}

export function GuidedTour({ forceShow = false, onComplete }: GuidedTourProps) {
  const { t, language, theme } = useAccessibilityStore();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Check if tour should be shown
  useEffect(() => {
    if (forceShow) {
      setIsActive(true);
      setCurrentStep(0);
      return;
    }
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay so dashboard has time to mount and render
      const timer = setTimeout(() => setIsActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Highlight the current step's element
  const highlightElement = useCallback((stepIndex: number) => {
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    // Center screens (Welcome/Finale) – no target element
    if (step.placement === 'center' && (step.selector === '[data-tour="welcome"]' || step.selector === '[data-tour="finale"]')) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

      // Watch for resize / reflow
      if (resizeObserver.current) resizeObserver.current.disconnect();
      resizeObserver.current = new ResizeObserver(() => {
        const updated = el.getBoundingClientRect();
        setTargetRect(updated);
      });
      resizeObserver.current.observe(el);
    } else {
      setTargetRect(null);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      highlightElement(currentStep);
    }
    return () => {
      if (resizeObserver.current) resizeObserver.current.disconnect();
    };
  }, [currentStep, isActive, highlightElement]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isActive) return;
    const recalc = () => highlightElement(currentStep);
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [isActive, currentStep, highlightElement]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (isTransitioning) return;
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    onComplete?.();
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    onComplete?.();
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isWelcome = step.placement === 'center' && step.selector === '[data-tour="welcome"]';
  const isFinale = step.placement === 'center' && step.selector === '[data-tour="finale"]';
  const isCenterCard = isWelcome || isFinale;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenterCard || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const MARGIN = 16;
    const tooltipWidth = 380;
    const tooltipHeight = 260;

    switch (step.placement) {
      case 'bottom':
        return {
          position: 'fixed',
          top: Math.min(targetRect.bottom + MARGIN, window.innerHeight - tooltipHeight - MARGIN),
          left: Math.max(MARGIN, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - MARGIN)),
        };
      case 'top':
        return {
          position: 'fixed',
          top: Math.max(MARGIN, targetRect.top - tooltipHeight - MARGIN),
          left: Math.max(MARGIN, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - MARGIN)),
        };
      case 'left':
        return {
          position: 'fixed',
          top: Math.max(MARGIN, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
          left: Math.max(MARGIN, targetRect.left - tooltipWidth - MARGIN),
        };
      case 'right':
        return {
          position: 'fixed',
          top: Math.max(MARGIN, targetRect.top + targetRect.height / 2 - tooltipHeight / 2),
          left: Math.min(targetRect.right + MARGIN, window.innerWidth - tooltipWidth - MARGIN),
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  // Spotlight clip-path for the overlay
  const getClipPath = () => {
    if (!targetRect || isCenterCard) return 'none';
    const padding = 8;
    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const w = targetRect.width + padding * 2;
    const h = targetRect.height + padding * 2;
    const r = 12;

    // Create inverted rounded rectangle
    return `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${x + r}px ${y}px,
      ${x + w - r}px ${y}px,
      ${x + w}px ${y + r}px,
      ${x + w}px ${y + h - r}px,
      ${x + w - r}px ${y + h}px,
      ${x + r}px ${y + h}px,
      ${x}px ${y + h - r}px,
      ${x}px ${y + r}px,
      ${x + r}px ${y}px
    )`;
  };

  // Helper for translation with fallback
  const tourT = (key: string): string => {
    return getTourText(key, language || 'fr');
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* ═══ Click Interceptor ═══ */}
          <div className="absolute inset-0" onClick={handleSkip} />

          {/* ═══ Backdrop ═══ */}
          {(isCenterCard || !targetRect) ? (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-500"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.92) 100%)',
                backdropFilter: 'blur(4px)',
              }}
            />
          ) : (
            <>
              {/* Clear area over element with huge box-shadow to darken the rest of the screen */}
              <motion.div
                initial={false}
                animate={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="absolute pointer-events-none"
                style={{
                  borderRadius: 16,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
                  zIndex: 1,
                }}
              />
              
              {/* Glowing ring around target */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1, scale: 1,
                  top: targetRect.top - 12,
                  left: targetRect.left - 12,
                  width: targetRect.width + 24,
                  height: targetRect.height + 24,
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute pointer-events-none"
                style={{
                  borderRadius: 16,
                  boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.5), 0 0 30px rgba(14, 165, 233, 0.3), 0 0 60px rgba(14, 165, 233, 0.15)',
                  border: '2px solid rgba(14, 165, 233, 0.6)',
                  zIndex: 2,
                }}
              />
              {/* Pulse animation ring */}
              <motion.div
                initial={false}
                animate={{
                  top: targetRect.top - 12,
                  left: targetRect.left - 12,
                  width: targetRect.width + 24,
                  height: targetRect.height + 24,
                }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="absolute pointer-events-none"
                style={{
                  borderRadius: 16,
                  border: '2px solid rgba(14, 165, 233, 0.4)',
                  zIndex: 2,
                }}
              >
                <motion.div
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.15 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  className="w-full h-full rounded-2xl border-2 border-[#0EA5E9]"
                />
              </motion.div>
            </>
          )}

          {/* ═══ Tooltip Card ═══ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              ref={tooltipRef}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                ...getTooltipStyle(),
                width: isCenterCard ? 460 : 380,
                zIndex: 10,
              }}
              className="pointer-events-auto"
            >
              <div className={`relative rounded-2xl overflow-hidden shadow-2xl border ${theme === 'dark' ? 'border-white/10 shadow-black/50' : 'border-gray-200 shadow-xl'}`}>
                {/* Background */}
                <div className={`absolute inset-0 backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-[#0f172a]/95 via-[#1e293b]/95 to-[#0f172a]/95' : 'bg-white/98'}`} />
                
                {/* Decorative gradient line at top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient}`} />

                {/* Content */}
                <div className="relative p-6">
                  {/* Skip button */}
                  <button
                    onClick={handleSkip}
                    className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label={tourT('tour.skip')}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Center Screens (Welcome / Finale) */}
                  {isCenterCard ? (
                    <div className="text-center pt-2">
                      {/* Animated Logo / Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg ${
                          isFinale
                            ? 'bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[#10B981]/30'
                            : 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] shadow-[#0EA5E9]/30'
                        }`}
                      >
                        {isFinale ? <Sparkles className="w-10 h-10 text-white" /> : <Sparkles className="w-10 h-10 text-white" />}
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                      >
                        {tourT(isFinale ? 'tour.finaleTitle' : 'tour.welcomeTitle')}
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`text-sm leading-relaxed mb-6 max-w-sm mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {tourT(isFinale ? 'tour.finaleDesc' : 'tour.welcomeDesc')}
                      </motion.p>

                      {/* Action buttons */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col gap-3"
                      >
                        <button
                          onClick={isFinale ? handleComplete : handleNext}
                          className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                            isFinale
                              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] shadow-[#10B981]/25 hover:shadow-xl hover:shadow-[#10B981]/35'
                              : 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] shadow-[#0EA5E9]/25 hover:shadow-xl hover:shadow-[#0EA5E9]/35'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          {tourT(isFinale ? 'tour.startAdventure' : 'tour.startTour')}
                          {!isFinale && <ChevronRight className="w-4 h-4" />}
                        </button>

                        {!isFinale && (
                          <button
                            onClick={handleSkip}
                            className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                              theme === 'dark' ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                            {tourT('tour.skipTour')}
                          </button>
                        )}
                        {isFinale && (
                          <button
                            onClick={handlePrev}
                            className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                              theme === 'dark' ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            {tourT('tour.prev')}
                          </button>
                        )}
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      {/* Step header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                          <span className="text-white">{step.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <h3 className={`text-lg font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {tourT(step.titleKey)}
                          </h3>
                          <p className={`text-sm leading-relaxed mt-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {tourT(step.descriptionKey)}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {tourT('tour.step')} {currentStep + 1}/{TOUR_STEPS.length}
                          </span>
                          <span className="text-[10px] font-bold text-[#0EA5E9]">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Step dots */}
                      <div className="flex items-center justify-center gap-1.5 mb-5">
                        {TOUR_STEPS.map((_, i) => (
                          <motion.div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${
                              i === currentStep
                                ? 'w-6 h-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]'
                                : i < currentStep
                                ? 'w-2 h-2 bg-[#0EA5E9]/50'
                                : (theme === 'dark' ? 'w-2 h-2 bg-white/10' : 'w-2 h-2 bg-gray-200')
                            }`}
                          />
                        ))}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                          <button
                            onClick={handlePrev}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                              theme === 'dark'
                                ? 'text-gray-400 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5'
                                : 'text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            {tourT('tour.prev')}
                          </button>
                        )}

                        <button
                          onClick={handleNext}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white
                                     bg-gradient-to-r ${step.gradient}
                                     shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
                                     transition-all duration-200 flex items-center justify-center gap-1.5
                                     ${currentStep === 0 ? 'flex-[2]' : ''}`}
                        >
                          {isLastStep ? tourT('tour.finish') : tourT('tour.next')}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Skip link */}
                      <button
                        onClick={handleSkip}
                        className={`w-full mt-3 py-1.5 text-[11px] font-medium transition-colors duration-200 flex items-center justify-center gap-1 ${
                          theme === 'dark' ? 'text-gray-500 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <SkipForward className="w-3 h-3" />
                        {tourT('tour.skip')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Replay Tour Button (can be placed in settings or dashboard) ────────
export function ReplayTourButton({ onReplay }: { onReplay: () => void }) {
  const { language } = useAccessibilityStore();

  const handleReplay = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    onReplay();
  };

  return (
    <motion.button
      onClick={handleReplay}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                 text-[#0EA5E9] bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20
                 border border-[#0EA5E9]/20 transition-all duration-200"
    >
      <Sparkles className="w-4 h-4" />
      {getTourText('tour.replay', language || 'fr')}
    </motion.button>
  );
}

// ─── Multi-language tour translations ──────────────────────────────────
const tourTranslations: Record<string, Record<string, string>> = {
  fr: {
    'tour.welcomeTitle': 'Bienvenue sur DeepSkyn ! 🌟',
    'tour.welcomeDesc': 'Découvrons ensemble votre tableau de bord. Ce guide interactif vous montrera chaque fonctionnalité pour une utilisation optimale.',
    'tour.startTour': 'Commencer la visite guidée',
    'tour.skipTour': 'Passer la visite guidée',
    'tour.skip': 'Passer',
    'tour.next': 'Suivant',
    'tour.prev': 'Précédent',
    'tour.finish': 'Terminer 🎉',
    'tour.step': 'Étape',
    'tour.replay': 'Revoir la visite guidée',
    'tour.logoTitle': 'Accueil DeepSkyn',
    'tour.logoDesc': 'Cliquez ici à tout moment pour revenir au tableau de bord principal. C\'est votre point de départ.',
    'tour.analysisTitle': 'Analyse IA de la peau',
    'tour.analysisDesc': 'Accédez à l\'analyse intelligente de votre peau. Prenez une photo et notre IA évaluera votre santé cutanée en quelques secondes.',
    'tour.routineTitle': 'Votre Routine Quotidienne',
    'tour.routineDesc': 'Retrouvez vos soins personnalisés du matin et du soir. Chaque routine est adaptée à votre type de peau et à vos besoins.',
    'tour.coachTitle': 'Coach IA Personnel',
    'tour.coachDesc': 'Posez vos questions à notre coach dermatologique IA. Il vous donnera des conseils personnalisés et des recommandations adaptées.',
    'tour.communityTitle': 'Communauté DeepSkyn',
    'tour.communityDesc': 'Rejoignez notre communauté ! Partagez vos routines, découvrez des conseils d\'autres utilisateurs et suivez les tendances skincare.',
    'tour.notificationsTitle': 'Vos Notifications',
    'tour.notificationsDesc': 'Restez informé des rappels de routine, des résultats d\'analyse et des nouvelles de la communauté.',
    'tour.profileTitle': 'Votre Profil',
    'tour.profileDesc': 'Accédez à votre profil, vos paramètres, l\'apparence de l\'interface et votre abonnement depuis ce menu.',
    'tour.statsTitle': 'Statistiques Cutanées',
    'tour.statsDesc': 'Consultez d\'un coup d\'œil votre score de santé, l\'âge de votre peau, le nombre d\'analyses et votre score moyen.',
    'tour.scoreTitle': 'Score Global de Santé',
    'tour.scoreDesc': 'Votre score de santé cutanée sur 100. Plus le score est élevé, meilleure est la condition de votre peau. Suivez son évolution !',
    'tour.evolutionTitle': 'Graphique d\'Évolution',
    'tour.evolutionDesc': 'Visualisez l\'évolution de votre score au fil du temps. Ce graphique vous montre les progrès de votre peau semaine après semaine.',
    'tour.quickActionsTitle': 'Actions Rapides',
    'tour.quickActionsDesc': 'Accédez rapidement aux fonctionnalités principales : nouvelle analyse, routine du jour, coach IA et communauté.',
    'tour.finaleTitle': 'Vous êtes prêt ! ✨',
    'tour.finaleDesc': 'Vous connaissez maintenant les bases de votre tableau de bord. Commencez votre aventure skincare avec DeepSkyn !',
    'tour.startAdventure': 'Commencer l\'aventure',
  },
  en: {
    'tour.welcomeTitle': 'Welcome to DeepSkyn! 🌟',
    'tour.welcomeDesc': 'Let\'s explore your dashboard together. This interactive guide will walk you through each feature for an optimal experience.',
    'tour.startTour': 'Start the Guided Tour',
    'tour.skipTour': 'Skip the guided tour',
    'tour.skip': 'Skip',
    'tour.next': 'Next',
    'tour.prev': 'Previous',
    'tour.finish': 'Finish 🎉',
    'tour.step': 'Step',
    'tour.replay': 'Replay guided tour',
    'tour.logoTitle': 'DeepSkyn Home',
    'tour.logoDesc': 'Click here anytime to return to the main dashboard. This is your starting point.',
    'tour.analysisTitle': 'AI Skin Analysis',
    'tour.analysisDesc': 'Access intelligent skin analysis. Take a photo and our AI will evaluate your skin health in seconds.',
    'tour.routineTitle': 'Your Daily Routine',
    'tour.routineDesc': 'Find your personalized morning and evening skincare steps. Each routine is tailored to your skin type and needs.',
    'tour.coachTitle': 'Personal AI Coach',
    'tour.coachDesc': 'Ask our AI dermatology coach your questions. Get personalized advice and tailored recommendations.',
    'tour.communityTitle': 'DeepSkyn Community',
    'tour.communityDesc': 'Join our community! Share your routines, discover tips from other users, and follow skincare trends.',
    'tour.notificationsTitle': 'Your Notifications',
    'tour.notificationsDesc': 'Stay informed about routine reminders, analysis results, and community news.',
    'tour.profileTitle': 'Your Profile',
    'tour.profileDesc': 'Access your profile, settings, interface appearance, and subscription from this menu.',
    'tour.statsTitle': 'Skin Statistics',
    'tour.statsDesc': 'View your health score, skin age, number of analyses, and average score at a glance.',
    'tour.scoreTitle': 'Overall Health Score',
    'tour.scoreDesc': 'Your skin health score out of 100. The higher the score, the better your skin condition. Track its evolution!',
    'tour.evolutionTitle': 'Evolution Chart',
    'tour.evolutionDesc': 'Visualize your score evolution over time. This chart shows your skin\'s progress week by week.',
    'tour.quickActionsTitle': 'Quick Actions',
    'tour.quickActionsDesc': 'Quickly access key features: new analysis, daily routine, AI coach, and community.',
    'tour.finaleTitle': 'You\'re all set! ✨',
    'tour.finaleDesc': 'You now know the basics of your dashboard. Start your skincare adventure with DeepSkyn!',
    'tour.startAdventure': 'Start the adventure',
  },
  ar: {
    'tour.welcomeTitle': '!مرحباً بكم في DeepSkyn 🌟',
    'tour.welcomeDesc': 'دعونا نكتشف لوحة التحكم معاً. هذا الدليل التفاعلي سيُريكم كل ميزة للاستخدام الأمثل.',
    'tour.startTour': 'بدء الجولة الإرشادية',
    'tour.skipTour': 'تخطي الجولة الإرشادية',
    'tour.skip': 'تخطي',
    'tour.next': 'التالي',
    'tour.prev': 'السابق',
    'tour.finish': '🎉 إنهاء',
    'tour.step': 'خطوة',
    'tour.replay': 'إعادة الجولة الإرشادية',
    'tour.logoTitle': 'الصفحة الرئيسية DeepSkyn',
    'tour.logoDesc': 'انقر هنا في أي وقت للعودة إلى لوحة التحكم الرئيسية. هذه نقطة البداية.',
    'tour.analysisTitle': 'تحليل البشرة بالذكاء الاصطناعي',
    'tour.analysisDesc': 'الوصول إلى التحليل الذكي لبشرتك. التقط صورة وسيقيّم الذكاء الاصطناعي صحة بشرتك في ثوانٍ.',
    'tour.routineTitle': 'روتينك اليومي',
    'tour.routineDesc': 'اعثر على خطوات العناية المخصصة لك صباحاً ومساءً. كل روتين مصمم حسب نوع بشرتك.',
    'tour.coachTitle': 'مدرب الذكاء الاصطناعي الشخصي',
    'tour.coachDesc': 'اطرح أسئلتك على مدرب الأمراض الجلدية بالذكاء الاصطناعي. احصل على نصائح مخصصة.',
    'tour.communityTitle': 'مجتمع DeepSkyn',
    'tour.communityDesc': 'انضم إلى مجتمعنا! شارك روتينك واكتشف نصائح المستخدمين الآخرين وتابع أحدث اتجاهات العناية بالبشرة.',
    'tour.notificationsTitle': 'إشعاراتك',
    'tour.notificationsDesc': 'ابقَ على اطلاع بتذكيرات الروتين ونتائج التحليل وأخبار المجتمع.',
    'tour.profileTitle': 'ملفك الشخصي',
    'tour.profileDesc': 'الوصول إلى ملفك الشخصي والإعدادات ومظهر الواجهة والاشتراك من هذه القائمة.',
    'tour.statsTitle': 'إحصائيات البشرة',
    'tour.statsDesc': 'استعرض نتيجة صحتك وعمر بشرتك وعدد التحليلات ومتوسط النتائج بنظرة سريعة.',
    'tour.scoreTitle': 'النتيجة الإجمالية للصحة',
    'tour.scoreDesc': 'نتيجة صحة بشرتك من 100. كلما ارتفعت النتيجة، كانت حالة بشرتك أفضل. تتبع تطورها!',
    'tour.evolutionTitle': 'مخطط التطور',
    'tour.evolutionDesc': 'تصوّر تطور نتيجتك عبر الزمن. يُظهر هذا المخطط تقدم بشرتك أسبوعاً بأسبوع.',
    'tour.quickActionsTitle': 'إجراءات سريعة',
    'tour.quickActionsDesc': 'الوصول السريع للميزات الرئيسية: تحليل جديد، روتين اليوم، مدرب AI والمجتمع.',
    'tour.finaleTitle': 'أنت جاهز! ✨',
    'tour.finaleDesc': 'أنت الآن تعرف أساسيات لوحة التحكم. ابدأ مغامرة العناية ببشرتك مع DeepSkyn!',
    'tour.startAdventure': 'ابدأ المغامرة',
  },
  es: {
    'tour.welcomeTitle': '¡Bienvenido a DeepSkyn! 🌟',
    'tour.welcomeDesc': 'Descubramos juntos tu panel de control. Esta guía interactiva te mostrará cada función para un uso óptimo.',
    'tour.startTour': 'Iniciar la visita guiada',
    'tour.skipTour': 'Saltar la visita guiada',
    'tour.skip': 'Saltar',
    'tour.next': 'Siguiente',
    'tour.prev': 'Anterior',
    'tour.finish': '¡Terminar 🎉!',
    'tour.step': 'Paso',
    'tour.replay': 'Repetir la visita guiada',
    'tour.logoTitle': 'Inicio DeepSkyn',
    'tour.logoDesc': 'Haz clic aquí en cualquier momento para volver al panel principal. Es tu punto de partida.',
    'tour.analysisTitle': 'Análisis de piel con IA',
    'tour.analysisDesc': 'Accede al análisis inteligente de tu piel. Toma una foto y nuestra IA evaluará la salud de tu piel en segundos.',
    'tour.routineTitle': 'Tu Rutina Diaria',
    'tour.routineDesc': 'Encuentra tus cuidados personalizados de mañana y noche. Cada rutina está adaptada a tu tipo de piel.',
    'tour.coachTitle': 'Coach IA Personal',
    'tour.coachDesc': 'Haz tus preguntas a nuestro coach dermatológico IA. Obtendrás consejos personalizados y recomendaciones adaptadas.',
    'tour.communityTitle': 'Comunidad DeepSkyn',
    'tour.communityDesc': '¡Únete a nuestra comunidad! Comparte tus rutinas, descubre consejos de otros usuarios y sigue las tendencias skincare.',
    'tour.notificationsTitle': 'Tus Notificaciones',
    'tour.notificationsDesc': 'Mantente informado sobre recordatorios de rutina, resultados de análisis y noticias de la comunidad.',
    'tour.profileTitle': 'Tu Perfil',
    'tour.profileDesc': 'Accede a tu perfil, configuración, apariencia de la interfaz y suscripción desde este menú.',
    'tour.statsTitle': 'Estadísticas de la Piel',
    'tour.statsDesc': 'Consulta de un vistazo tu puntuación de salud, la edad de tu piel, el número de análisis y tu puntuación media.',
    'tour.scoreTitle': 'Puntuación Global de Salud',
    'tour.scoreDesc': 'Tu puntuación de salud cutánea sobre 100. Cuanto mayor sea, mejor estará tu piel. ¡Sigue su evolución!',
    'tour.evolutionTitle': 'Gráfico de Evolución',
    'tour.evolutionDesc': 'Visualiza la evolución de tu puntuación con el tiempo. Este gráfico muestra el progreso de tu piel semana a semana.',
    'tour.quickActionsTitle': 'Acciones Rápidas',
    'tour.quickActionsDesc': 'Accede rápidamente a las funciones principales: nuevo análisis, rutina diaria, coach IA y comunidad.',
    'tour.finaleTitle': '¡Estás listo! ✨',
    'tour.finaleDesc': 'Ya conoces los aspectos básicos de tu panel de control. ¡Empieza tu aventura de cuidado de la piel con DeepSkyn!',
    'tour.startAdventure': 'Comenzar la aventura',
  },
};

function getTourText(key: string, lang: string): string {
  const langTexts = tourTranslations[lang] || tourTranslations['fr'];
  return langTexts[key] || tourTranslations['fr'][key] || key;
}
