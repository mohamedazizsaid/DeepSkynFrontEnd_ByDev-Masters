import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence, Reorder, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  Info,
  RotateCcw,
  Box,
  List,
  Bell,
  Calendar,
} from 'lucide-react';
import { RoutineStepCard } from '../routines/RoutineStepCard';
import { AddStepForm } from '../routines/AddStepForm';
import { AIAdviceModal } from '../routines/AIAdviceModal';
import { AIProductRecommendModal } from '../routines/AIProductRecommendModal';
import { ShareRoutineButton } from '../routines/ShareRoutineButton';
import { ShareRoutineModal } from '../routines/ShareRoutineModal';
import { QuotaAlertBanner } from './quota-alert-banner';
import { routineService } from '../../../lib/services/routine.service';
import { subscriptionService } from '../../../lib/services/subscription.service';
import { usersService } from '../../../lib/services/users.service';
import type { Routine, RoutineStep, AIAdviceResponse, ProductRecommendation } from '../../../lib/types';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { useNotification } from '../../../lib/hooks/useNotification';

// Lazy load 3D viewer for performance
const Face3DViewer = lazy(() =>
  import('../routines/Face3DViewer').then((m) => ({ default: m.Face3DViewer }))
);

interface RoutinePageProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

interface StepItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  completed: boolean;
  order: number;
}

interface ZoneContext {
  id: string;
  label: string;
  description: string;
  matchedStepName: string | null;
}

function mapRoutineSteps(steps: RoutineStep[], t: any): StepItem[] {
  return steps.map((s, i) => ({
    id: s.id || `step-${i}-${Date.now()}`,
    name: s.productName || s.name || `${t('routine.step')} ${i + 1}`,
    category: s.category || 'treatment',
    description: s.description || s.notes || '',
    duration: typeof s.duration === 'string' ? parseInt(s.duration) || 30 : s.duration || 30,
    completed: s.completed || s.isCompleted || false,
    order: s.order ?? i + 1,
  }));
}

export function RoutinePage({ onBack, onUpgrade }: RoutinePageProps) {
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState<AIAdviceResponse | null>(null);
  const [highlightedStep, setHighlightedStep] = useState<string | null>(null);
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [zoneContext, setZoneContext] = useState<ZoneContext | null>(null);
  const [show3D, setShow3D] = useState(true);

  // Product recommendation state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<ProductRecommendation | null>(null);
  const [recommendStepName, setRecommendStepName] = useState<string>('');

  // Share routine state
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [amRoutine, setAmRoutine] = useState<Routine | null>(null);
  const [pmRoutine, setPmRoutine] = useState<Routine | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [aiRoutineLimit, setAiRoutineLimit] = useState<number | null>(3);
  const [aiRoutineUsed, setAiRoutineUsed] = useState(0);
  const [aiRoutineResetAt, setAiRoutineResetAt] = useState<string | null>(null);

  const { theme, contrastMode, t } = useAccessibilityStore();
  const { success, error } = useNotification();
  const isHcHigh = contrastMode === 'high';
  const isHcMedium = contrastMode === 'medium';
  const isDark = theme === 'dark';
  const shouldReduceMotion = useReducedMotion();

  const [amSteps, setAmSteps] = useState<StepItem[]>([]);
  const [pmSteps, setPmSteps] = useState<StepItem[]>([]);
  
  const fullTitle = `${t('routine.title')} ${t('routine.skincare')}`;
  const [visibleTitleText, setVisibleTitleText] = useState('');
  const [titleLoopKey, setTitleLoopKey] = useState(0);
  const titlePrefix = `${t('routine.title')} `;

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleTitleText(fullTitle);
      return;
    }

    setVisibleTitleText('');
    const charDelay = 45;
    const holdDelay = 10000; // 10s
    const timeouts: NodeJS.Timeout[] = [];

    const type = (index: number) => {
      if (index <= fullTitle.length) {
        setVisibleTitleText(fullTitle.slice(0, index));
        timeouts.push(setTimeout(() => type(index + 1), charDelay));
      } else {
        timeouts.push(setTimeout(() => {
          setTitleLoopKey(prev => prev + 1);
        }, holdDelay));
      }
    };

    timeouts.push(setTimeout(() => type(1), 100));

    return () => timeouts.forEach(clearTimeout);
  }, [fullTitle, shouldReduceMotion, titleLoopKey]);

  const [reminders, setReminders] = useState({
    morningEnabled: false,
    morningTime: '08:00',
    eveningEnabled: false,
    eveningTime: '21:00'
  });

  const currentSteps = activeTab === 'am' ? amSteps : pmSteps;
  const setCurrentSteps = activeTab === 'am' ? setAmSteps : setPmSteps;
  const totalDuration = currentSteps.reduce((sum, step) => sum + (Number(step.duration) || 0), 0);
  const completedCount = currentSteps.filter((s) => s.completed).length;
  const completionRate = currentSteps.length > 0 ? Math.round((completedCount / currentSteps.length) * 100) : 0;
  const nextStep = [...currentSteps]
    .filter((s) => !s.completed)
    .sort((a, b) => a.order - b.order)[0];

  const formatResetDate = (value?: string | null): string => {
    if (!value) return t('common.soon');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const aiRoutineRemaining = aiRoutineLimit === null ? null : Math.max(0, aiRoutineLimit - aiRoutineUsed);
  const nearAiRoutineLimit = !isPremium && aiRoutineRemaining !== null && aiRoutineRemaining > 0 && aiRoutineRemaining <= 1;
  const aiRoutineLimitReached = !isPremium && aiRoutineRemaining !== null && aiRoutineRemaining <= 0;

  const refreshUsage = async () => {
    try {
      const usage = await subscriptionService.getUsageSummary();
      setIsPremium(usage.isPremium);
      setAiRoutineLimit(usage.quotas.aiRoutines.limit);
      setAiRoutineUsed(usage.quotas.aiRoutines.used || 0);
      setAiRoutineResetAt(usage.quotas.aiRoutines.resetsAt);
    } catch {
      // Keep previous values if usage endpoint fails
    }
  };

  // ─── Load routines and auto-select tab based on time ───
  useEffect(() => {
    refreshUsage();
    loadRoutines();
    autoSelectTab();
    
    // Check reminders every minute
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkReminders = () => {
    try {
      if (!reminders) return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (reminders.morningEnabled && reminders.morningTime === currentTime) {
        new Notification(t('routine.notifs.morningTitle'), {
          body: t('routine.notifs.morningBody'),
          icon: "/favicon.ico"
        });
        setActiveTab('am');
      }
      
      if (reminders.eveningEnabled && reminders.eveningTime === currentTime) {
        new Notification(t('routine.notifs.eveningTitle'), {
          body: t('routine.notifs.eveningBody'),
          icon: "/favicon.ico"
        });
        setActiveTab('pm');
      }
    } catch (e) {
      console.error("Reminder check failed", e);
    }
  };

  const autoSelectTab = async () => {
    try {
      const user = await usersService.getMe();
      const rems = user.settings?.reminders;
      if (rems) {
        setReminders(rems);
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTimeMinutes = hour * 60 + minute;
        
        const morningTime = rems.morningTime || '08:00';
        const eveningTime = rems.eveningTime || '21:00';
        
        const [mH, mM] = morningTime.split(':').map(Number);
        const [eH, eM] = eveningTime.split(':').map(Number);
        
        const mMinutes = mH * 60 + mM;
        const eMinutes = eH * 60 + eM;

        if (currentTimeMinutes >= mMinutes && currentTimeMinutes < eMinutes) {
          setActiveTab('am');
        } else {
          setActiveTab('pm');
        }
      } else {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) setActiveTab('am');
        else setActiveTab('pm');
      }
    } catch {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) setActiveTab('am');
      else setActiveTab('pm');
    }
  };

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const data = await routineService.getAll();
      const list = Array.isArray(data) ? data : [];

      if (list.length > 0) {
        const am = list.find(
          (r) => r.type === 'AM' || r.type === 'MORNING' || r.type === 'morning'
        );
        const pm = list.find(
          (r) => r.type === 'PM' || r.type === 'EVENING' || r.type === 'evening'
        );

        if (am) {
          setAmSteps(mapRoutineSteps(am.steps || [], t));
          setAmRoutine(am);
          setRoutineId(am.id);
        }
        if (pm) {
          setPmSteps(mapRoutineSteps(pm.steps || [], t));
          setPmRoutine(pm);
          if (!am) setRoutineId(pm.id);
        }

        // Auto-generate if no routines exist
        if (!am && !pm) {
          await generateAIRoutine();
        }
      } else {
        // First load — auto-generate
        await generateAIRoutine();
      }
    } catch {
      // If fetching fails, generate fallback
      await generateAIRoutine();
    } finally {
      setLoading(false);
    }
  };

  // ─── Generate AI routine ───
  const generateAIRoutine = async () => {
    if (aiRoutineLimitReached) {
      error(t('routine.messages.limitReached', { date: formatResetDate(aiRoutineResetAt) }));
      return;
    }

    setGenerating(true);
    try {
      const type = activeTab === 'am' ? 'AM' : 'PM';
      const routine = await routineService.generateAI({ type });

      if (routine?.steps) {
        const steps = mapRoutineSteps(routine.steps, t);
        if (type === 'AM') {
          setAmSteps(steps);
          setAmRoutine(routine);
        } else {
          setPmSteps(steps);
          setPmRoutine(routine);
        }
        setRoutineId(routine.id);
      }
      await refreshUsage();

      if (!isPremium && aiRoutineRemaining !== null) {
        const remainingAfter = Math.max(0, aiRoutineRemaining - 1);
        if (remainingAfter === 1) {
          error(t('routine.messages.oneLeft'));
        }
      }
    } catch {
      // Use default steps if AI fails
      const defaultSteps: StepItem[] =
        activeTab === 'am'
          ? [
              { id: 'def-1', name: t('routine.products.cleanser'), category: 'cleanser', description: t('routine.products.cleanserDesc'), duration: 60, completed: false, order: 1 },
              { id: 'def-2', name: t('routine.products.toner'), category: 'toner', description: t('routine.products.tonerDesc'), duration: 30, completed: false, order: 2 },
              { id: 'def-3', name: t('routine.products.serum'), category: 'serum', description: t('routine.products.serumDesc'), duration: 30, completed: false, order: 3 },
              { id: 'def-4', name: t('routine.products.eye_cream'), category: 'eye_cream', description: t('routine.products.eye_creamDesc'), duration: 20, completed: false, order: 4 },
              { id: 'def-5', name: t('routine.products.moisturizer'), category: 'moisturizer', description: t('routine.products.moisturizerDesc'), duration: 30, completed: false, order: 5 },
              { id: 'def-6', name: t('routine.products.sunscreen'), category: 'sunscreen', description: t('routine.products.sunscreenDesc'), duration: 30, completed: false, order: 6 },
            ]
          : [
              { id: 'def-7', name: t('routine.products.makeup_remover'), category: 'makeup_remover', description: t('routine.products.makeup_removerDesc'), duration: 60, completed: false, order: 1 },
              { id: 'def-8', name: t('routine.products.cleanser'), category: 'cleanser', description: t('routine.products.cleanserDesc'), duration: 60, completed: false, order: 2 },
              { id: 'def-9', name: t('routine.products.exfoliant'), category: 'exfoliant', description: t('routine.products.exfoliantDesc'), duration: 30, completed: false, order: 3 },
              { id: 'def-10', name: t('routine.products.serum'), category: 'serum', description: t('routine.products.serumDesc'), duration: 30, completed: false, order: 4 },
              { id: 'def-11', name: t('routine.products.eye_cream'), category: 'eye_cream', description: t('routine.products.eye_creamDesc'), duration: 20, completed: false, order: 5 },
              { id: 'def-12', name: t('routine.products.night_cream'), category: 'night_cream', description: t('routine.products.night_creamDesc'), duration: 30, completed: false, order: 6 },
            ];

      setCurrentSteps(defaultSteps);
      await refreshUsage();
    } finally {
      setGenerating(false);
    }
  };

  // ─── Request AI advice ───
  const requestAdvice = useCallback(
    async (changeType: 'reorder' | 'add_step' | 'remove_step', changeDesc?: string, addedName?: string) => {
      if (!routineId) return;

      setAdviceLoading(true);
      setShowAdvice(true);
      setCurrentAdvice(null);

      try {
        const advice = await routineService.adviseOnChange(routineId, {
          changeType,
          currentSteps: currentSteps.map((s) => s.name),
          changeDescription: changeDesc,
          addedStepName: addedName,
        });
        setCurrentAdvice(advice);
      } catch {
        setCurrentAdvice({
          advice: t('routine.adviceFallback'),
          rating: 'neutral',
          emoji: '✨',
        });
      } finally {
        setAdviceLoading(false);
      }
    },
    [routineId, currentSteps]
  );

  // ─── Handle reorder ───
  const handleReorder = (newSteps: StepItem[]) => {
    setCurrentSteps(newSteps);
    // Debounce advice request
    setTimeout(() => {
      requestAdvice('reorder', t('routine.reorderDesc'));
    }, 800);
  };

  // ─── Handle add step ───
  const handleAddStep = (stepData: { name: string; category: string; description: string; duration: number }) => {
    const newStep: StepItem = {
      id: `custom-${Date.now()}`,
      name: stepData.name,
      category: stepData.category,
      description: stepData.description,
      duration: stepData.duration,
      completed: false,
      order: currentSteps.length + 1,
    };

    setCurrentSteps((prev) => [...prev, newStep]);
    requestAdvice('add_step', t('routine.addStepDesc').replace('{name}', stepData.name), stepData.name);
  };

  // ─── Handle remove step ───
  const handleRemoveStep = (stepId: string) => {
    const removed = currentSteps.find((s) => s.id === stepId);
    setCurrentSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (removed) {
      requestAdvice('remove_step', t('routine.messages.removeStepAdvice', { name: removed.name }));
    }
  };

  // ─── Handle complete step ───
  const handleCompleteStep = async (stepId: string) => {
    const activeRoutineId = activeTab === 'am' ? amRoutine?.id : pmRoutine?.id;
    const targetStep = currentSteps.find((s) => s.id === stepId);
    if (!targetStep) return;

    const nextExpectedStep = [...currentSteps]
      .filter((s) => !s.completed)
      .sort((a, b) => a.order - b.order)[0];
    const isOutOfOrder = !!nextExpectedStep && nextExpectedStep.id !== targetStep.id;

    // Instant UI feedback
    setCurrentSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step))
    );

    if (!activeRoutineId) {
      if (isOutOfOrder && nextExpectedStep) {
        requestAdvice(
          'reorder',
          t('routine.messages.outOfOrderAdvice', { done: targetStep.name, expected: nextExpectedStep.name })
        );
      }
      success(t('routine.messages.stepMarked'));
      return;
    }

    try {
      const stepOrder = Number(targetStep.order) || currentSteps.findIndex((s) => s.id === stepId) + 1;
      const updatedRoutine = await routineService.completeStep(activeRoutineId, stepOrder);

      if (updatedRoutine?.steps) {
        const updatedSteps = mapRoutineSteps(updatedRoutine.steps, t);
        if (activeTab === 'am') {
          setAmRoutine(updatedRoutine);
          setAmSteps(updatedSteps);
        } else {
          setPmRoutine(updatedRoutine);
          setPmSteps(updatedSteps);
        }
      }

      if (isOutOfOrder && nextExpectedStep) {
        requestAdvice(
          'reorder',
          t('routine.messages.outOfOrderAdvice', { done: targetStep.name, expected: nextExpectedStep.name })
        );
      }

      success(t('routine.messages.stepCompleted'));
    } catch {
      // Rollback UI on API failure
      setCurrentSteps((prev) =>
        prev.map((step) => (step.id === stepId ? { ...step, completed: false } : step))
      );
      error(t('routine.messages.stepCompleteError'));
    }
  };

  // ─── Handle 3D zone click ───
  const handleZoneClick = (
    zoneId: string,
    zoneLabel: string,
    zoneDescription: string,
    categories: string[]
  ) => {
    setHighlightedZone(zoneId);
    // Find matching step
    const match = currentSteps.find((s) => categories.includes(s.category));

    setZoneContext({
      id: zoneId,
      label: zoneLabel,
      description: zoneDescription,
      matchedStepName: match?.name || null,
    });

    if (match) {
      setHighlightedStep(match.id);
      setTimeout(() => {
        setHighlightedStep(null);
        setHighlightedZone(null);
      }, 3000);
    }
  };

  // ─── Handle product recommendation ───
  const handleRecommendProduct = useCallback(async (step: StepItem) => {
    setRecommendStepName(step.name);
    setProductLoading(true);
    setShowProductModal(true);
    setCurrentRecommendation(null);

    try {
      const recommendation = await routineService.recommendProduct({
        stepName: step.name,
        stepCategory: step.category,
        stepDescription: step.description || undefined,
      });
      setCurrentRecommendation(recommendation);
    } catch {
      // Provide a graceful fallback
      setCurrentRecommendation(null);
    } finally {
      setProductLoading(false);
    }
  }, []);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto" />
          </motion.div>
          <p className="text-[#6B7280] mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ═══ Header ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold mb-1 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {visibleTitleText.slice(0, titlePrefix.length)}
                    <span className={isHcHigh ? 'text-cyan-400' : 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent'}>
                      {visibleTitleText.length > titlePrefix.length
                        ? visibleTitleText.slice(titlePrefix.length)
                        : ''}
                    </span>
                    {visibleTitleText.length < fullTitle.length && !shouldReduceMotion && (
                      <motion.span
                        className="inline-block ml-0.5 text-[#0EA5E9]"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    )}
                  </motion.span>
                </h1>
                <p className="text-gray-500 text-sm">
                  {t('routine.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateAIRoutine}
                disabled={generating || aiRoutineLimitReached}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-[#0EA5E9]/30 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-all disabled:opacity-40"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating
                  ? t('routine.generating')
                  : aiRoutineLimitReached
                    ? t('routine.messages.limitReachedShort')
                    : t('routine.regenerateAI')}
              </motion.button>

              {activeTab === 'am' && amRoutine && (
                <ShareRoutineButton
                  routine={amRoutine}
                  onShare={() => {
                    setCurrentRoutine(amRoutine);
                    setShowShareModal(true);
                  }}
                />
              )}
              {activeTab === 'pm' && pmRoutine && (
                <ShareRoutineButton
                  routine={pmRoutine}
                  onShare={() => {
                    setCurrentRoutine(pmRoutine);
                    setShowShareModal(true);
                  }}
                />
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShow3D(!show3D)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  show3D
                    ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]'
                    : 'border-gray-200 text-gray-500 hover:text-gray-900 bg-white shadow-sm'
                }`}
              >
                {show3D ? <Box className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {show3D ? '' : t('common.list')}
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══ AM / PM Tabs ═══ */}
        <div className="flex gap-3 mb-8">
          <motion.button
            onClick={() => setActiveTab('am')}
            className={`flex-1 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'am'
                ? isHcHigh ? 'bg-black text-cyan-400 border-2 border-yellow-400' : 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-lg shadow-[#0EA5E9]/20'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 shadow-sm'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Sun className="w-5 h-5" />
              <span>{t('routine.morningRoutine')}</span>
            </div>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('pm')}
            className={`flex-1 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'pm'
                ? isHcHigh ? 'bg-black text-cyan-300 border-2 border-yellow-400' : 'bg-gradient-to-r from-[#0284C7] to-[#06B6D4] text-white shadow-lg shadow-[#0284C7]/20'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 shadow-sm'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Moon className="w-5 h-5" />
              <span>{t('routine.eveningRoutine')}</span>
            </div>
          </motion.button>
        </div>

        {!isPremium && aiRoutineRemaining !== null && (
          <div className="mb-6">
            <QuotaAlertBanner
              variant={aiRoutineLimitReached ? 'blocked' : nearAiRoutineLimit ? 'warning' : 'info'}
              title={aiRoutineLimitReached ? t('routine.quota.titleBlocked') : nearAiRoutineLimit ? t('routine.quota.titleWarning') : t('routine.quota.titleInfo')}
              message={aiRoutineLimitReached
                ? t('routine.quota.messageBlocked', { date: formatResetDate(aiRoutineResetAt) })
                : nearAiRoutineLimit
                  ? t('routine.quota.messageWarning', { count: aiRoutineRemaining ?? 0 })
                  : t('routine.quota.messageInfo', { used: aiRoutineUsed, limit: aiRoutineLimit ?? 0 })}
              used={aiRoutineUsed}
              limit={aiRoutineLimit}
              onUpgrade={onUpgrade}
              upgradeLabel={t('routine.quota.upgradeLabel')}
            />
          </div>
        )}

        {/* ═══ Main Content Grid ═══ */}
        <div className={`grid gap-6 ${show3D ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          {/* ─── Steps List ─── */}
          <div className={show3D ? '' : 'lg:col-span-2'}>
            <div
              className="rounded-2xl border border-gray-200 bg-white p-5 overflow-hidden shadow-sm"
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900 text-base">
                    {activeTab === 'am' ? t('routine.morningSteps') : t('routine.eveningSteps')}
                  </h3>
                  <div className="flex gap-2 items-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0EA5E9]/10 text-[#0EA5E9]">
                      {currentSteps.length} {t('routine.steps')}
                    </span>
                    {activeTab === 'am' && reminders.morningEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <Bell className="w-2.5 h-2.5" />
                        {t('routine.rappelAt')} {reminders.morningTime}
                      </span>
                    )}
                    {activeTab === 'pm' && reminders.eveningEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Bell className="w-2.5 h-2.5" />
                        {t('routine.rappelAt')} {reminders.eveningTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info tip */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0EA5E9]/5 border border-[#0EA5E9]/10 mb-4">
                <Info className="w-4 h-4 text-[#0EA5E9] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#0EA5E9]">
                  {t('routine.dragDropTip')}
                </p>
              </div>

              {/* Reorderable step list */}
              {currentSteps.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={currentSteps}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  <AnimatePresence>
                    {currentSteps.map((step, index) => (
                      <RoutineStepCard
                        key={step.id}
                        step={step}
                        index={index}
                        isHighlighted={highlightedStep === step.id}
                        onComplete={() => handleCompleteStep(step.id)}
                        onRemove={() => handleRemoveStep(step.id)}
                        onRecommend={() => handleRecommendProduct(step)}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">{t('routine.noSteps')}</p>
                </div>
              )}

              {/* Add step form */}
              <div className="mt-4">
                <AddStepForm onAdd={handleAddStep} />
              </div>
            </div>

            {/* ─── Info Cards (below steps when 3D is visible) ─── */}
            {!show3D && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <InfoCard
                  title={t('routine.applicationOrder')}
                  items={[
                    t('routine.products.cleanser'),
                    t('routine.products.toner'),
                    t('routine.products.serum'),
                    t('routine.products.eye_cream'),
                    t('routine.products.moisturizer'),
                    t('routine.products.sunscreen') + ` (${t('routine.morning')})`,
                  ]}
                />
                <TipsCard />
              </div>
            )}

            {show3D && (
              <div className="mt-6 rounded-2xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-sky-50/70 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold text-gray-900">{t('routine.smartContext.title')}</h3>
                  <span className="rounded-full border border-cyan-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-cyan-700">
                    {activeTab === 'am' ? t('routine.morningRoutine') : t('routine.eveningRoutine')}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-cyan-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] text-gray-500 mb-1">{t('routine.smartContext.activeSteps')}</p>
                    <p className="text-xl font-bold text-gray-900 leading-none">{currentSteps.length}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] text-gray-500 mb-1">{t('routine.smartContext.estimatedDuration')}</p>
                    <p className="text-xl font-bold text-gray-900 leading-none">{totalDuration}s</p>
                  </div>
                  <div className="rounded-xl border border-cyan-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] text-gray-500 mb-1">{t('routine.smartContext.progress')}</p>
                    <p className="text-xl font-bold text-gray-900 leading-none">{completionRate}%</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-cyan-800/90 leading-relaxed">
                  {t('routine.smartContext.help3D')}
                </p>
              </div>
            )}
          </div>

          {/* ─── 3D Face Viewer OR Info Panel ─── */}
          <div className="space-y-6">
            {show3D ? (
              <Suspense
                fallback={
                  <div className="w-full h-[400px] rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mx-auto mb-2" />
                      <p className="text-gray-500 text-xs">{t('routine.loading3D')}</p>
                    </div>
                  </div>
                }
              >
                <Face3DViewer
                  steps={currentSteps}
                  highlightedZone={highlightedZone}
                  onZoneClick={handleZoneClick}
                />
              </Suspense>
            ) : null}

            {show3D && (
              <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/50 to-cyan-50/70 p-4 shadow-sm min-h-[116px]">
                <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.15),_transparent_45%)]" />
                {zoneContext ? (
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#0EA5E9] shadow-[0_0_0_4px_rgba(14,165,233,0.12)]" />
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{zoneContext.label}</p>
                      <span className="ml-auto rounded-full border border-sky-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {t('routine.zone.active')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{zoneContext.description}</p>
                    <p className="rounded-xl border border-sky-100 bg-white/80 px-3 py-2 text-xs font-medium text-[#0369a1]">
                      {zoneContext.matchedStepName
                        ? t('routine.zone.linkedStep', { step: zoneContext.matchedStepName })
                        : t('routine.zone.noLinkedStep')}
                    </p>
                  </div>
                ) : (
                  <div className="relative h-full flex items-center rounded-xl border border-dashed border-sky-200 bg-white/70 px-3 py-3">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('routine.zone.tapHint')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Cards */}
            <div className={show3D ? 'grid sm:grid-cols-2 gap-4' : 'space-y-4'}>
              <InfoCard
                title={t('routine.applicationOrder')}
                items={[
                  t('routine.products.cleanser'),
                  t('routine.products.toner'),
                  t('routine.products.serum'),
                  t('routine.products.eye_cream'),
                  t('routine.products.moisturizer'),
                  t('routine.products.sunscreen') + ` (${t('routine.morning')})`,
                ]}
              />
              <TipsCard />
               <RoutineReminderCard 
                 reminders={reminders}
                 onUpdate={(newRems) => {
                   setReminders(newRems);
                   // Re-select tab based on new times
                   const now = new Date();
                   const curMinutes = now.getHours() * 60 + now.getMinutes();
                   const [mH, mM] = newRems.morningTime.split(':').map(Number);
                   const [eH, eM] = newRems.eveningTime.split(':').map(Number);
                   if (curMinutes >= mH*60+mM && curMinutes < eH*60+eM) setActiveTab('am');
                   else setActiveTab('pm');
                 }}
               />
              {!show3D && (
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/60 p-5 shadow-sm min-h-[190px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{t('routine.priority.title')}</h3>
                    <span className="rounded-full border border-emerald-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {t('routine.priority.smartFlow')}
                    </span>
                  </div>

                  {nextStep ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-100 bg-white/85 px-3 py-3">
                        <p className="text-[11px] text-gray-500 mb-1">{t('routine.priority.nextStep')}</p>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">#{nextStep.order} • {nextStep.name}</p>
                      </div>

                      <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2">
                        <p className="text-[11px] text-cyan-800 leading-relaxed">
                          {t('routine.priority.aiTip')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center rounded-xl border border-dashed border-emerald-200 bg-white/70 px-3 py-3">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {t('routine.priority.completed')}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
              {show3D && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/70 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{t('routine.sessionInsights.title')}</h3>
                    <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-semibold">
                      {t('routine.sessionInsights.live')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
                      <span>{t('routine.sessionInsights.completedSteps')}</span>
                      <span className="font-semibold text-gray-900">{completedCount}/{currentSteps.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
                      <span>{t('routine.sessionInsights.activeMode')}</span>
                      <span className="font-semibold text-gray-900">{show3D ? t('routine.sessionInsights.mode3D') : t('routine.sessionInsights.modeList')}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
                      <span>{t('routine.sessionInsights.mainReminder')}</span>
                      <span className="font-semibold text-gray-900">
                        {activeTab === 'am' ? reminders.morningTime : reminders.eveningTime}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ AI Advice Modal ═══ */}
        <AIAdviceModal
          isOpen={showAdvice}
          onClose={() => setShowAdvice(false)}
          advice={currentAdvice}
          isLoading={adviceLoading}
        />

        {/* ═══ AI Product Recommendation Modal ═══ */}
        <AIProductRecommendModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          recommendation={currentRecommendation}
          isLoading={productLoading}
          stepName={recommendStepName}
        />

        {/* ═══ Share Routine Modal ═══ */}
        <ShareRoutineModal
          routine={currentRoutine}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setCurrentRoutine(null);
          }}
        />
      </div>
    </div>
  );
}

// ─── Sub Components ───

function InfoCard({ title, items }: { title: string; items: string[] }) {
  const { t } = useAccessibilityStore();
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3 className="font-bold text-gray-900 text-sm mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center text-[10px] font-bold text-[#0EA5E9]">
              {i + 1}
            </div>
            <span className="text-xs text-gray-600">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsCard() {
  const { t } = useAccessibilityStore();

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="space-y-2">
        {t('routine.tips').map((tip: string, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[#10B981] text-xs mt-0.5">✓</span>
            <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutineReminderCard({ 
  reminders, 
  onUpdate 
}: { 
  reminders: any, 
  onUpdate: (rems: any) => void 
}) {
  const { t } = useAccessibilityStore();
  const [saving, setSaving] = useState(false);
  const { success, error, show } = useNotification();

  const handleTestNotification = () => {
    if (!('Notification' in window)) {
      error(t('routine.notifications.unsupported'));
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(t('routine.notifications.title'), {
        body: t('routine.notifications.body'),
        icon: "/favicon.ico"
      });
      success(t('routine.notifications.sent'));
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          handleTestNotification();
        } else {
          error(t('routine.notifications.denied'));
        }
      });
    }
  };

  const handleUpdate = async (newReminders: typeof reminders) => {
    setSaving(true);
    try {
      const user = await usersService.getMe();
      await usersService.updateMe({
        settings: {
          ...user.settings,
          reminders: newReminders
        }
      });
      
      onUpdate(newReminders);
      success(t('routine.notifications.updated'));
      
      if ((newReminders.morningEnabled || newReminders.eveningEnabled) && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } catch (e) {
      error(t('routine.notifications.updateError'));
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="font-bold text-gray-900 text-sm">{t('routine.remindersTitle')}</h3>
        </div>
     
      </div>

      <div className="space-y-4">
        {/* Morning */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${reminders.morningEnabled ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'bg-gray-200 text-gray-400'}`}>
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">{t('routine.morning')}</p>
              <input 
                type="time" 
                value={reminders.morningTime}
                onChange={(e) => handleUpdate({ ...reminders, morningTime: e.target.value })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 outline-none ${
                    reminders.morningEnabled 
                      ? 'bg-white border-[#0EA5E9]/30 text-[#0EA5E9] shadow-sm hover:border-[#0EA5E9]/50' 
                      : 'bg-transparent border-transparent text-gray-400 opacity-50 pointer-events-none'
                }`}
              />
            </div>
          </div>
          <button 
            onClick={() => handleUpdate({ ...reminders, morningEnabled: !reminders.morningEnabled })}
            className={`w-10 h-6 rounded-full transition-colors relative ${reminders.morningEnabled ? 'bg-[#0EA5E9]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${reminders.morningEnabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>

        {/* Evening */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${reminders.eveningEnabled ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'bg-gray-200 text-gray-400'}`}>
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">{t('routine.evening')}</p>
              <input 
                type="time" 
                value={reminders.eveningTime}
                onChange={(e) => handleUpdate({ ...reminders, eveningTime: e.target.value })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none ${
                    reminders.eveningEnabled 
                      ? 'bg-white border-[#8B5CF6]/30 text-[#8B5CF6] shadow-sm hover:border-[#8B5CF6]/50' 
                      : 'bg-transparent border-transparent text-gray-400 opacity-50 pointer-events-none'
                }`}
              />
            </div>
          </div>
          <button 
            onClick={() => handleUpdate({ ...reminders, eveningEnabled: !reminders.eveningEnabled })}
            className={`w-10 h-6 rounded-full transition-colors relative ${reminders.eveningEnabled ? 'bg-[#8B5CF6]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${reminders.eveningEnabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
        
        {saving && <p className="text-[10px] text-gray-400 text-center animate-pulse">{t('routine.saveInProgress')}</p>}
      </div>
    </div>
  );
}
