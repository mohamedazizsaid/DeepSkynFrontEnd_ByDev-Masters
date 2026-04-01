import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Crown, Sparkles, Shield, Loader2, CalendarDays, PartyPopper, X, Ticket } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { Input } from '../input';
import { subscriptionService } from '../../../lib/services/subscription.service';
import type { CouponValidationResult, Notification, Subscription, SubscriptionPlanInfo } from '../../../lib/types';
import { useAuthStore } from '../../../stores/auth.store';
import { useNotificationStore } from '../../../stores/notification.store';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface SubscriptionPageProps {
  onBack: () => void;
}

function normalizePlan(plan: unknown): Subscription['plan'] {
  if (typeof plan !== 'string') return 'free';
  const p = plan.trim();
  if (!p) return 'free';

  // Accept both backend enum styles and frontend styles
  if (p === 'FREE' || p.toLowerCase() === 'free') return 'free';
  if (p === 'PREMIUM' || p.toLowerCase() === 'premium') return 'premium';
  if (
    p === 'PREMIUM_YEARLY' ||
    p.toLowerCase() === 'premium_yearly' ||
    p.toLowerCase() === 'premium-yearly'
  ) {
    return 'premium_yearly';
  }

  return 'free';
}

export function SubscriptionPage({ onBack }: SubscriptionPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showPurchaseSuccessModal, setShowPurchaseSuccessModal] = useState(false);
  const [showSubscriptionExpiredModal, setShowSubscriptionExpiredModal] = useState(false);
  const [purchaseSuccessSub, setPurchaseSuccessSub] = useState<Subscription | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlanInfo | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'upgrade' | 'renew'>('upgrade');
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [lastPaidPlan, setLastPaidPlan] = useState<Subscription['plan'] | null>(null);
  const handledCheckoutResultRef = useRef(false);

  const authUser = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { t } = useAccessibilityStore();

  const refreshSubscription = async () => {
    const sub = await subscriptionService.getMySubscription();
    setCurrentSub(sub);
    window.dispatchEvent(
      new CustomEvent('subscription-updated', {
        detail: { ...sub, plan: normalizePlan((sub as any)?.plan) },
      }),
    );
    return sub;
  };

  const refreshUntilPlanMatches = async (expectedPlan?: string): Promise<Subscription | null> => {
    // Webhook may take a moment; retry a few times
    const expected = expectedPlan ? normalizePlan(expectedPlan) : undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const sub = await refreshSubscription();
        const actual = normalizePlan((sub as any)?.plan);
        if (!expected || actual === expected) return sub;
      } catch {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return null;
  };

  const formatPlanName = (plan?: string) => {
    if (!plan) return 'Premium';
    const normalized = normalizePlan(plan);
    if (normalized === 'premium_yearly') return t('subscriptionPage.planNames.premiumYearly');
    if (normalized === 'premium') return t('subscriptionPage.planNames.premiumMonthly');
    return t('subscriptionPage.planNames.free');
  };

  const localizePlanName = (planCode: string, backendName?: string) => {
    const normalized = normalizePlan(planCode);
    if (normalized === 'premium_yearly') return t('subscriptionPage.planNames.premiumYearly');
    if (normalized === 'premium') return t('subscriptionPage.planNames.premiumMonthly');
    if (normalized === 'free') return t('subscriptionPage.planNames.free');
    return backendName || planCode;
  };

  const localizePeriod = (duration?: number) => {
    if (duration === -1) return t('subscriptionPage.plans.periodForever');
    if (duration === 365) return t('subscriptionPage.plans.periodYear');
    return t('subscriptionPage.plans.periodMonth');
  };

  const localizeFeature = (feature: string) => {
    const key = String(feature || '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!key) return feature;

    const map: Record<string, string> = {
      'basic skin analysis': 'subscriptionPage.features.basicSkinAnalysis',
      'basic analysis': 'subscriptionPage.features.basicSkinAnalysis',
      'skin analysis': 'subscriptionPage.features.basicSkinAnalysis',
      'ai skin analysis': 'subscriptionPage.features.advancedAIAnalysis',
      'advanced ai analysis': 'subscriptionPage.features.advancedAIAnalysis',
      'advanced analysis': 'subscriptionPage.features.advancedAIAnalysis',
      'unlimited ai analysis': 'subscriptionPage.features.unlimitedAIAnalysis',
      'unlimited ai analyses': 'subscriptionPage.features.unlimitedAIAnalysis',
      'unlimited analysis': 'subscriptionPage.features.unlimitedAIAnalysis',
      'unlimited analyses': 'subscriptionPage.features.unlimitedAIAnalysis',
      'unlimited skin analysis': 'subscriptionPage.features.unlimitedAIAnalysis',
      'unlimited skin analyses': 'subscriptionPage.features.unlimitedAIAnalysis',
      'personalized routine': 'subscriptionPage.features.personalizedRoutine',
      'personalized skincare routine': 'subscriptionPage.features.personalizedRoutine',
      'personalized skincare plan': 'subscriptionPage.features.personalizedRoutine',
      'ai coach': 'subscriptionPage.features.aiCoach',
      'smart ai coach': 'subscriptionPage.features.aiCoach',
      'daily skincare routine': 'subscriptionPage.features.dailySkincareRoutine',
      'daily routine': 'subscriptionPage.features.dailySkincareRoutine',
      'chat with ai coach': 'subscriptionPage.features.chatWithAICoach',
      'ai chat': 'subscriptionPage.features.chatWithAICoach',
      'community access': 'subscriptionPage.features.communityAccess',
      'priority support': 'subscriptionPage.features.prioritySupport',
      'unlimited access': 'subscriptionPage.features.unlimitedAccess',
      'وصول غير محدود': 'subscriptionPage.features.unlimitedAccess',
      'full access': 'subscriptionPage.features.unlimitedAccess',
      'all premium features': 'subscriptionPage.features.unlimitedAccess',
      '2 months free': 'subscriptionPage.features.twoMonthsFree',
      'two months free': 'subscriptionPage.features.twoMonthsFree',
      'early access to new features': 'subscriptionPage.features.earlyAccessNewFeatures',
      'early access new features': 'subscriptionPage.features.earlyAccessNewFeatures',
      '3 analyses per month': 'subscriptionPage.features.threeAnalysesPerMonth',
      '3 analysis per month': 'subscriptionPage.features.threeAnalysesPerMonth',
      'monthly reports': 'subscriptionPage.features.monthlyReports',
      'detailed reports': 'subscriptionPage.features.detailedReports',
      'premium recommendations': 'subscriptionPage.features.premiumRecommendations',
      'advanced recommendations': 'subscriptionPage.features.advancedRecommendations',
      'progress tracking': 'subscriptionPage.features.progressTracking',
      'unlimited tracking': 'subscriptionPage.features.progressTracking',
      'face scan': 'subscriptionPage.features.faceScan',
      'روتين مخصص': 'subscriptionPage.features.personalizedRoutine',
      'دردشة مع المدرب الذكي': 'subscriptionPage.features.chatWithAICoach',
      'general guidance': 'subscriptionPage.features.generalGuidance',
    };

    let translationKey = map[key];

    if (!translationKey && key.includes('report')) {
      translationKey = key.includes('monthly')
        ? 'subscriptionPage.features.monthlyReports'
        : 'subscriptionPage.features.detailedReports';
    }
    if (!translationKey && key.includes('recommend')) {
      translationKey = key.includes('advanced')
        ? 'subscriptionPage.features.advancedRecommendations'
        : 'subscriptionPage.features.premiumRecommendations';
    }
    if (!translationKey && key.includes('support')) {
      translationKey = 'subscriptionPage.features.prioritySupport';
    }
    if (!translationKey && key.includes('community')) {
      translationKey = 'subscriptionPage.features.communityAccess';
    }
    if (!translationKey && (key.includes('coach') || key.includes('chat'))) {
      translationKey = key.includes('chat')
        ? 'subscriptionPage.features.chatWithAICoach'
        : 'subscriptionPage.features.aiCoach';
    }
    if (!translationKey && key.includes('routine')) {
      translationKey = key.includes('daily')
        ? 'subscriptionPage.features.dailySkincareRoutine'
        : 'subscriptionPage.features.personalizedRoutine';
    }
    if (!translationKey && (key.includes('track') || key.includes('progress'))) {
      translationKey = 'subscriptionPage.features.progressTracking';
    }
    if (!translationKey && (key.includes('face') || key.includes('scan'))) {
      translationKey = 'subscriptionPage.features.faceScan';
    }
    if (!translationKey && key.includes('analysis') && key.includes('unlimited')) {
      translationKey = 'subscriptionPage.features.unlimitedAIAnalysis';
    }
    if (!translationKey && key.includes('month') && (key.includes('analysis') || key.includes('analyses'))) {
      translationKey = 'subscriptionPage.features.threeAnalysesPerMonth';
    }
    if (!translationKey && key.includes('early') && key.includes('feature')) {
      translationKey = 'subscriptionPage.features.earlyAccessNewFeatures';
    }
    if (!translationKey && key.includes('general') && key.includes('guidance')) {
      translationKey = 'subscriptionPage.features.generalGuidance';
    }
    if (!translationKey && key.includes('وصول') && key.includes('محدود')) {
      translationKey = 'subscriptionPage.features.unlimitedAccess';
    }
    if (!translationKey && key.includes('روتين') && key.includes('مخصص')) {
      translationKey = 'subscriptionPage.features.personalizedRoutine';
    }
    if (!translationKey && key.includes('دردشة') && key.includes('المدرب')) {
      translationKey = 'subscriptionPage.features.chatWithAICoach';
    }
    if (!translationKey && key.includes('analysis')) {
      translationKey = key.includes('advanced') || key.includes('ai')
        ? 'subscriptionPage.features.advancedAIAnalysis'
        : 'subscriptionPage.features.basicSkinAnalysis';
    }
    if (!translationKey && key.includes('unlimited')) {
      translationKey = 'subscriptionPage.features.unlimitedAccess';
    }

    return translationKey ? t(translationKey) : feature;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return t('subscriptionPage.common.notDefined');
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString([], {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (value: number, _currency: string) => {
    const displayCurrency = 'EUR';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: displayCurrency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${displayCurrency}`;
    }
  };

  const pushPurchaseSuccessNotification = (sub?: Subscription | null) => {
    const nowIso = new Date().toISOString();
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const planName = formatPlanName(sub?.plan);
    const endDate = formatDate((sub as any)?.endDate);

    const notification: Notification = {
      id,
      userId: (authUser as any)?.sub || (authUser as any)?.id || (authUser as any)?.email || 'me',
      title: 'Achat confirmé',
      message: sub
        ? `Votre plan ${planName} est actif jusqu’au ${endDate}.`
        : 'Votre paiement a été confirmé. Votre abonnement premium est actif.',
      type: 'success',
      isRead: false,
      actionUrl: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    addNotification(notification);
  };

  const pushSubscriptionExpiredNotification = (lastPlan?: Subscription['plan'] | null) => {
    const nowIso = new Date().toISOString();
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const notification: Notification = {
      id,
      userId: (authUser as any)?.sub || (authUser as any)?.id || (authUser as any)?.email || 'me',
      title: 'Abonnement expire',
      message: `Votre abonnement ${formatPlanName(lastPlan || undefined)} a expire. Votre compte est maintenant sur le plan Free.`,
      type: 'warning',
      isRead: false,
      actionUrl: '/subscription',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    addNotification(notification);
  };

  useEffect(() => {
    const savedLastPaidPlan = localStorage.getItem('last_paid_subscription_plan');
    if (savedLastPaidPlan === 'premium' || savedLastPaidPlan === 'premium_yearly') {
      setLastPaidPlan(savedLastPaidPlan);
    }

    const load = async () => {
      try {
        const [sub, planList] = await Promise.allSettled([
          subscriptionService.getMySubscription(),
          subscriptionService.getPlans(),
        ]);
        if (sub.status === 'fulfilled') {
          setCurrentSub(sub.value);
          const normalized = normalizePlan((sub.value as any)?.plan);
          if (normalized === 'premium' || normalized === 'premium_yearly') {
            setLastPaidPlan(normalized);
            localStorage.setItem('last_paid_subscription_plan', normalized);
          }
        }
        if (planList.status === 'fulfilled') setPlans(planList.value);
      } catch { /* use defaults */ } finally { setLoading(false); }
    };
    load();

    // Check if returning from Stripe checkout
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    if ((success === 'true' || cancelled === 'true') && !handledCheckoutResultRef.current) {
      handledCheckoutResultRef.current = true;

      if (success === 'true') {
        toast.success(t('subscriptionPage.toasts.paymentSuccess'));
        const expected = localStorage.getItem('pending_subscription_plan') || undefined;
        localStorage.removeItem('pending_subscription_plan');
        if (expected === 'premium' || expected === 'premium_yearly') {
          setLastPaidPlan(expected);
          localStorage.setItem('last_paid_subscription_plan', expected);
        }
        void (async () => {
          const updatedSub = await refreshUntilPlanMatches(expected);
          if (updatedSub) {
            setPurchaseSuccessSub(updatedSub);
            const updatedPlan = normalizePlan((updatedSub as any)?.plan);
            if (updatedPlan === 'premium' || updatedPlan === 'premium_yearly') {
              setLastPaidPlan(updatedPlan);
              localStorage.setItem('last_paid_subscription_plan', updatedPlan);
            }
          }
          pushPurchaseSuccessNotification(updatedSub);
          setShowPurchaseSuccessModal(true);
        })();
      }

      if (cancelled === 'true') {
        toast.error(t('subscriptionPage.toasts.paymentCancelled'));
        localStorage.removeItem('pending_subscription_plan');
      }

      // Remove flags so refresh/navigation won't re-trigger toasts
      const next = new URLSearchParams(searchParams);
      next.delete('success');
      next.delete('cancelled');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleUpgrade = async (planId: string) => {
    const planToUpgrade = plans.find(p => p.plan === planId);
    if (planToUpgrade && planToUpgrade.plan !== 'free') {
      setCheckoutMode('upgrade');
      setCheckoutPlan(planToUpgrade);
      setCouponCode('');
      setCouponValidation(null);
      setCouponError('');
    }
  };

  const handleRenew = () => {
    if (!currentSub || !lastPaidPlan) return;
    const planToRenew = plans.find((p) => normalizePlan((p as any).plan) === lastPaidPlan);
    if (!planToRenew) {
      toast.error(t('subscriptionPage.toasts.renewPlanNotFound'));
      return;
    }
    setCheckoutMode('renew');
    setCheckoutPlan(planToRenew);
    setCouponCode('');
    setCouponValidation(null);
    setCouponError('');
  };

  const handleValidateCoupon = async () => {
    if (!checkoutPlan) return;
    const code = couponCode.trim();
    if (!code) {
      setCouponError(t('subscriptionPage.checkout.enterCouponFirst'));
      setCouponValidation(null);
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');
    try {
      const validation = await subscriptionService.validateCoupon(code, checkoutPlan.plan);
      setCouponValidation(validation);
      toast.success(t('subscriptionPage.checkout.couponValid'));
    } catch (error) {
      const backendMessage =
        error instanceof AxiosError
          ? (error.response?.data as any)?.message
          : undefined;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || t('subscriptionPage.checkout.invalidCoupon');
      setCouponValidation(null);
      setCouponError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleStartCheckout = async () => {
    if (!checkoutPlan) return;
    const planId = checkoutPlan.plan;
    const code = couponCode.trim();

    setUpgrading(true);
    try {
      let validCouponCode: string | undefined;
      if (code) {
        // Re-validate just before redirecting to Stripe.
        await subscriptionService.validateCoupon(code, planId);
        validCouponCode = code;
      }

      localStorage.setItem('pending_subscription_plan', planId);
      const { url } =
        checkoutMode === 'renew'
          ? await subscriptionService.renewStripeCheckout(planId, validCouponCode)
          : await subscriptionService.createStripeCheckout(planId, validCouponCode);
      if (!url) throw new Error('Missing Stripe checkout URL');
      window.location.assign(url);
    } catch (error) {
      const backendMessage =
        error instanceof AxiosError
          ? (error.response?.data as any)?.message
          : undefined;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || t('subscriptionPage.checkout.startPaymentFailed');
      setCouponError(errorMessage);
      toast.error(errorMessage);
      localStorage.removeItem('pending_subscription_plan');
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await subscriptionService.cancel();
      setCurrentSub(result);
    } catch { /* handle */ } finally { setCancelling(false); }
  };


  const isPremium = currentSub?.plan === 'premium' || currentSub?.plan === 'premium_yearly';

  const currentPlan = normalizePlan((currentSub as any)?.plan);

  const currentRemainingDays = (() => {
    const endDate = (currentSub as any)?.endDate as string | null | undefined;
    if (!endDate) return null;
    const diffMs = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  })();

  const currentRemainingPercent = (() => {
    const startDate = (currentSub as any)?.startDate as string | null | undefined;
    const endDate = (currentSub as any)?.endDate as string | null | undefined;
    if (!startDate || !endDate) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    const total = end - start;
    const remaining = Math.max(0, end - now);
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  })();

  const isCurrentFree = currentPlan === 'free';
  const isExpiredNow = (() => {
    const endDate = (currentSub as any)?.endDate as string | null | undefined;
    if (!endDate) return false;
    const parsed = new Date(endDate);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
  })();
  const canRenewExpiredPlan =
    Boolean(lastPaidPlan) &&
    isCurrentFree &&
    (isExpiredNow || (currentSub as any)?.status === 'expired');

  useEffect(() => {
    if (!canRenewExpiredPlan || !currentSub) return;

    const expiryMarker = `${currentSub.id}:${String((currentSub as any)?.endDate || '')}`;
    const notifiedMarker = localStorage.getItem('subscription_expired_notified_marker');
    if (notifiedMarker === expiryMarker) return;

    pushSubscriptionExpiredNotification(lastPaidPlan);
    setShowSubscriptionExpiredModal(true);
    localStorage.setItem('subscription_expired_notified_marker', expiryMarker);
  }, [canRenewExpiredPlan, currentSub?.id, (currentSub as any)?.endDate, lastPaidPlan]);

  const subscriptionLocked = (() => {
    if (!currentSub) return false;
    const plan = normalizePlan((currentSub as any)?.plan);
    if (plan === 'free') return false;
    if ((currentSub as any)?.status !== 'active') return false;
    const endDate = (currentSub as any)?.endDate;
    if (!endDate) return true;
    const end = new Date(endDate);
    return !Number.isNaN(end.getTime()) && new Date() <= end;
  })();
  
  // Transformar planos do backend para formato exibição
  const displayPlans = plans.map((plan) => ({
    name: localizePlanName(plan.plan, plan.name),
    plan: plan.plan,
    price: plan.price,
    period: localizePeriod(plan.duration),
    currency: 'EUR',
    features: Array.from(new Set((plan.features || []).map(localizeFeature))),
    cta: normalizePlan((plan as any).plan) === currentPlan
      ? t('subscriptionPage.plans.currentPlan')
      : t('subscriptionPage.plans.upgradeNow'),
    current: normalizePlan((plan as any).plan) === currentPlan,
    highlighted: plan.plan === 'premium',
  }));

  const faq = [
    {
      question: t('subscriptionPage.faq.q1.question'),
      answer: t('subscriptionPage.faq.q1.answer')
    },
    {
      question: t('subscriptionPage.faq.q2.question'),
      answer: t('subscriptionPage.faq.q2.answer')
    },
    {
      question: t('subscriptionPage.faq.q3.question'),
      answer: t('subscriptionPage.faq.q3.answer')
    },
    {
      question: t('subscriptionPage.faq.q4.question'),
      answer: t('subscriptionPage.faq.q4.answer')
    }
  ];


  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative mb-12 overflow-hidden rounded-[28px] border border-[#D9EEF9] bg-gradient-to-br from-[#F0F9FF] via-white to-[#FFF7ED]"
      >
        <motion.div
          animate={{ x: [0, 25, 0], y: [0, -8, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="pointer-events-none absolute -top-20 -left-16 h-56 w-56 rounded-full bg-[#BAE6FD]/45 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity }}
          className="pointer-events-none absolute -bottom-20 -right-12 h-52 w-52 rounded-full bg-[#FED7AA]/40 blur-3xl"
        />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#BAE6FD] bg-white/70 px-3 py-1 text-xs font-semibold text-[#0369A1] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {t('subscriptionPage.benefits.title')}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#0F172A] sm:text-4xl lg:text-5xl">
                {t('subscriptionPage.header.title')}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[#475569] sm:text-lg">
                {t('subscriptionPage.header.subtitle')}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FCD34D] bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Crown className="h-3.5 w-3.5" />
                  {t('subscriptionPage.plans.currentPlan')}: {formatPlanName(currentPlan)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {currentRemainingDays !== null
                    ? currentRemainingDays > 0
                      ? t('subscriptionPage.currentSub.remainingDays', { count: currentRemainingDays })
                      : t('subscriptionPage.currentSub.expired')
                    : t('subscriptionPage.currentSub.na')}
                </span>
              </div>
            </div>

            {canRenewExpiredPlan && (
              <div className="w-full lg:w-auto lg:pt-2">
                <Button
                  onClick={handleRenew}
                  disabled={upgrading}
                  className="w-full lg:w-auto bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1]"
                >
                  {upgrading && checkoutMode === 'renew' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('subscriptionPage.header.renewPreviousPlan')}
                </Button>
              </div>
            )}
          </div>

          {currentSub && normalizePlan((currentSub as any)?.plan) !== 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-7 rounded-2xl border border-[#E2E8F0] bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t('subscriptionPage.plans.currentPlan')}</p>
                  <p className="mt-1 text-sm font-bold text-amber-900">{formatPlanName((currentSub as any)?.plan)}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{t('subscriptionPage.currentSub.start')}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-900">{formatDate((currentSub as any)?.startDate)}</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">{t('subscriptionPage.currentSub.end')}</p>
                  <p className="mt-1 text-sm font-bold text-rose-900">{formatDate((currentSub as any)?.endDate)}</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">{t('subscriptionPage.currentSub.na')}</p>
                  <p className="mt-1 text-sm font-bold text-sky-900">
                    {currentRemainingDays !== null
                      ? currentRemainingDays > 0
                        ? t('subscriptionPage.currentSub.remainingDays', { count: currentRemainingDays })
                        : t('subscriptionPage.currentSub.expired')
                      : t('subscriptionPage.currentSub.na')}
                  </p>
                </div>
              </div>

              {currentRemainingPercent !== null && (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentRemainingPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        </div>
      ) : (
        <>
      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mb-16">
        {displayPlans.map((plan, index) => {
          const planLocked = subscriptionLocked && !plan.current;
          const planDisabled = plan.current || upgrading || plan.plan === 'free' || planLocked;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              transition={{ delay: index * 0.08 }}
              className="relative"
            >
              <Card
                className={`relative h-full overflow-hidden border-2 p-0 ${
                  plan.highlighted
                    ? 'border-[#38BDF8] shadow-[0_16px_45px_rgba(14,165,233,0.18)]'
                    : 'border-[#E5E7EB] shadow-sm'
                }`}
              >
                <div
                  className={`h-1.5 w-full ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#0EA5E9] via-[#06B6D4] to-[#14B8A6]'
                      : 'bg-gradient-to-r from-[#E2E8F0] to-[#CBD5E1]'
                  }`}
                />

                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    {plan.highlighted ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7DD3FC] bg-[#E0F2FE] px-2.5 py-1 text-xs font-semibold text-[#0369A1]">
                        <Crown className="w-3.5 h-3.5" />
                        {t('subscriptionPage.plans.mostPopular')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                        {plan.period}
                      </span>
                    )}

                    {plan.current && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                        {t('subscriptionPage.plans.currentPlan')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-[#0F172A]">{plan.name}</h3>

                  <div className="mt-5">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-extrabold text-[#0F172A]">{t('subscriptionPage.planNames.free')}</div>
                    ) : (
                      <>
                        <div className="text-4xl font-extrabold text-[#0F172A]">{formatPrice(plan.price, plan.currency)}</div>
                        <div className="mt-1 text-sm text-[#64748B]">/{plan.period}</div>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="flex items-start gap-2.5 rounded-lg bg-[#F8FAFC] px-3 py-2"
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#10B981]">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                        <span className="text-sm leading-relaxed text-[#334155]">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    className={`mt-7 w-full ${
                      !plan.current && !planDisabled
                        ? 'bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1]'
                        : ''
                    }`}
                    variant={plan.current ? 'outline' : 'primary'}
                    disabled={planDisabled}
                    onClick={() => !planDisabled && handleUpgrade(plan.plan)}
                  >
                    {upgrading && !plan.current ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {!upgrading && plan.current ? <Check className="w-5 h-5" /> : null}
                    {plan.current ? t('subscriptionPage.plans.currentPlan') : plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-16"
      >
        <Card>
          <h2 className="text-2xl font-bold mb-8 text-center">{t('subscriptionPage.benefits.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">{t('subscriptionPage.benefits.advancedAI.title')}</h3>
              <p className="text-sm text-[#6B7280]">
                {t('subscriptionPage.benefits.advancedAI.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">{t('subscriptionPage.benefits.unlimitedAccess.title')}</h3>
              <p className="text-sm text-[#6B7280]">
                {t('subscriptionPage.benefits.unlimitedAccess.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">{t('subscriptionPage.benefits.prioritySupport.title')}</h3>
              <p className="text-sm text-[#6B7280]">
                {t('subscriptionPage.benefits.prioritySupport.description')}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-[#E2E8F0] bg-gradient-to-b from-white to-[#F8FAFC]">
          <h2 className="text-2xl font-bold mb-8 text-center text-[#0F172A]">{t('subscriptionPage.faq.title')}</h2>
          <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
            {faq.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-xs font-bold text-[#0369A1]">
                    {index + 1}
                  </span>
                  <h3 className="font-bold text-[#0F172A]">{item.question}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[#475569]">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
        </>
      )}

      <AnimatePresence>
        {checkoutPlan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !upgrading && setCheckoutPlan(null)}
              className="fixed inset-0 z-[210]"
              style={{
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-auto px-4 z-[211]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                {/* Gradient top border */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]" />
                
                {/* Decorative blurs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-[#0EA5E9]/20 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-tr from-[#8B5CF6]/20 to-transparent blur-3xl pointer-events-none" />

                <div className="relative p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-purple-500/20"
                    >
                      <Crown className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {checkoutMode === 'renew' ? t('subscriptionPage.checkout.renewTitle') : t('subscriptionPage.checkout.title')}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {t('subscriptionPage.checkout.planLabel')}: <span className="font-semibold text-[#0EA5E9]">{checkoutPlan.name}</span>
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => !upgrading && setCheckoutPlan(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    disabled={upgrading}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="relative p-6 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-2xl border px-5 py-4 ${
                      couponValidation?.estimated
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                        : 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200'
                    }`}
                  >
                    {checkoutPlan.price > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('subscriptionPage.checkout.price')}</span>
                        <div className="text-right">
                          <motion.p
                            key={couponValidation?.estimated?.after ?? checkoutPlan.price}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-2xl font-bold ${couponValidation?.estimated ? 'text-emerald-600' : 'text-[#0EA5E9]'}`}
                          >
                            {couponValidation?.estimated
                              ? formatPrice(couponValidation.estimated.after, couponValidation.estimated.currency)
                              : formatPrice(checkoutPlan.price, checkoutPlan.currency)}
                          </motion.p>
                          {couponValidation?.estimated && (
                            <p className="text-xs text-emerald-600 mt-1">
                              <span className="line-through text-gray-400">{formatPrice(couponValidation.estimated.before, couponValidation.estimated.currency)}</span>
                              {' '}• {t('subscriptionPage.checkout.save')} {formatPrice(couponValidation.estimated.discount, couponValidation.estimated.currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-sky-700">{t('subscriptionPage.checkout.freePlan')}</p>
                    )}
                  </motion.div>

                  {/* Coupon Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Input
                      label={t('subscriptionPage.checkout.couponLabel')}
                      placeholder={t('subscriptionPage.checkout.couponPlaceholder')}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                        setCouponValidation(null);
                      }}
                      icon={<Ticket className="w-4 h-4" />}
                      disabled={upgrading}
                    />
                  </motion.div>

                  {couponValidation?.estimated && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-800">{t('subscriptionPage.checkout.couponApplied')}: {couponValidation.couponCode}</p>
                          <p className="text-sm text-emerald-600 mt-0.5">
                            {formatPrice(couponValidation.estimated.before, couponValidation.estimated.currency)} → {formatPrice(couponValidation.estimated.after, couponValidation.estimated.currency)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {couponError && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm text-rose-700 font-medium">{couponError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between gap-4 pt-4"
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={handleValidateCoupon}
                        disabled={!couponCode.trim() || validatingCoupon || upgrading}
                        className="border-2 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-all"
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                        {t('subscriptionPage.checkout.validateCoupon')}
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleStartCheckout} 
                        disabled={upgrading}
                        className="bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] hover:from-[#0284C7] hover:to-[#7C3AED] text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                      >
                        {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {checkoutMode === 'renew' ? t('subscriptionPage.checkout.renewWithStripe') : t('subscriptionPage.checkout.continueToPayment')}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showPurchaseSuccessModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPurchaseSuccessModal(false)}
              className="fixed inset-0 z-[200]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.85, rotateX: 15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl mx-auto px-4 z-[201]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white">
                {/* Animated gradient border */}
                <motion.div
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="h-2 w-full"
                  style={{
                    background: 'linear-gradient(90deg, #0EA5E9, #8B5CF6, #EC4899, #F59E0B, #0EA5E9)',
                    backgroundSize: '200% 100%',
                  }}
                />

                {/* Confetti-like decorative elements */}
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 180, 360] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-10 right-16 w-3 h-3 rounded-full bg-[#0EA5E9] opacity-60"
                />
                <motion.div
                  animate={{ y: [0, 10, 0], rotate: [360, 180, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute top-16 right-10 w-2 h-2 rounded-full bg-[#EC4899] opacity-60"
                />
                <motion.div
                  animate={{ y: [-5, 5, -5], rotate: [0, -180, -360] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                  className="absolute top-12 left-16 w-2.5 h-2.5 rounded-full bg-[#F59E0B] opacity-60"
                />

                {/* Background blurs */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-20 pointer-events-none bg-gradient-to-br from-[#8B5CF6] to-transparent blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-15 pointer-events-none bg-gradient-to-tr from-[#0EA5E9] to-transparent blur-3xl" />

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPurchaseSuccessModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <div className="relative p-8 pt-10">
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="mx-auto mb-6 relative"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-xl shadow-purple-500/30"
                    >
                      <PartyPopper className="w-10 h-10 text-white" />
                    </motion.div>
                    {/* Sparkle effects */}
                    <motion.div
                      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="absolute -top-2 -right-2 w-6 h-6"
                    >
                      <Sparkles className="w-6 h-6 text-[#F59E0B]" />
                    </motion.div>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-center bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent"
                  >
                    {t('subscriptionPage.successModal.title')}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-gray-500 mt-2"
                  >
                    {t('subscriptionPage.successModal.subtitle')}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 space-y-4"
                  >
                    <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 flex items-center justify-between">
                      <span className="text-sm text-amber-700 inline-flex items-center gap-2 font-medium">
                        <Crown className="w-5 h-5" /> {t('subscriptionPage.successModal.plan')}
                      </span>
                      <span className="text-lg font-bold text-amber-800">
                        {formatPlanName(purchaseSuccessSub?.plan)}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-4 flex items-center justify-between">
                      <span className="text-sm text-sky-700 inline-flex items-center gap-2 font-medium">
                        <CalendarDays className="w-5 h-5" /> {t('subscriptionPage.successModal.endDate')}
                      </span>
                      <span className="text-lg font-bold text-sky-800">
                        {formatDate(purchaseSuccessSub?.endDate)}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 flex items-center justify-center"
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={() => setShowPurchaseSuccessModal(false)}
                        className="bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899] hover:from-[#0284C7] hover:via-[#7C3AED] hover:to-[#DB2777] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 px-8 py-3"
                      >
                        <Sparkles className="w-5 h-5" />
                        {t('subscriptionPage.successModal.continue')}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showSubscriptionExpiredModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubscriptionExpiredModal(false)}
              className="fixed inset-0 z-[220]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-auto px-4 z-[221]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
                {/* Animated warning gradient */}
                <motion.div
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="h-2 w-full"
                  style={{
                    background: 'linear-gradient(90deg, #F59E0B, #EF4444, #8B5CF6, #F59E0B)',
                    backgroundSize: '200% 100%',
                  }}
                />

                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-15 pointer-events-none bg-gradient-to-br from-[#EF4444] to-transparent blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-36 h-36 rounded-full opacity-15 pointer-events-none bg-gradient-to-tr from-[#8B5CF6] to-transparent blur-3xl" />

                <div className="relative p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center shadow-lg shadow-amber-500/30"
                    >
                      <CalendarDays className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900">{t('subscriptionPage.expiredModal.title')}</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSubscriptionExpiredModal(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="relative p-6 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4"
                  >
                    <p className="text-amber-800 font-medium">{t('subscriptionPage.expiredModal.message')}</p>
                  </motion.div>

                  {lastPaidPlan && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-5 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 font-semibold">
                          <Crown className="w-4 h-4" />
                          {formatPlanName(lastPaidPlan)}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[#0EA5E9] font-medium">
                          <Sparkles className="w-4 h-4" />
                          {t('subscriptionPage.expiredModal.renewHint')}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-end gap-4 pt-2"
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={() => setShowSubscriptionExpiredModal(false)}
                        className="border-2 hover:border-gray-300"
                      >
                        {t('subscriptionPage.expiredModal.later')}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => {
                          setShowSubscriptionExpiredModal(false);
                          if (canRenewExpiredPlan) handleRenew();
                        }}
                        className="bg-gradient-to-r from-[#F59E0B] to-[#EC4899] hover:from-[#D97706] hover:to-[#DB2777] text-white shadow-lg shadow-amber-500/30"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('subscriptionPage.expiredModal.renewNow')}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
