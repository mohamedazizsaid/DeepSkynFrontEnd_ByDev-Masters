import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Crown, Sparkles, Shield, Loader2, CalendarDays, PartyPopper, X } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { subscriptionService } from '../../../lib/services/subscription.service';
import type { Notification, Subscription, SubscriptionPlanInfo } from '../../../lib/types';
import { useAuthStore } from '../../../stores/auth.store';
import { useNotificationStore } from '../../../stores/notification.store';
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
  const [purchaseSuccessSub, setPurchaseSuccessSub] = useState<Subscription | null>(null);
  const handledCheckoutResultRef = useRef(false);

  const authUser = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);

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
    if (normalized === 'premium_yearly') return 'Premium Yearly';
    if (normalized === 'premium') return 'Premium Monthly';
    return 'Free';
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Not defined';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString([], {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const pushPurchaseSuccessNotification = (sub?: Subscription | null) => {
    const nowIso = new Date().toISOString();
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? (crypto.randomUUID as () => string)()
        : `local-${Date.now()}`;

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

  useEffect(() => {
    const load = async () => {
      try {
        const [sub, planList] = await Promise.allSettled([
          subscriptionService.getMySubscription(),
          subscriptionService.getPlans(),
        ]);
        if (sub.status === 'fulfilled') setCurrentSub(sub.value);
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
        toast.success('Payment successful!');
        const expected = localStorage.getItem('pending_subscription_plan') || undefined;
        localStorage.removeItem('pending_subscription_plan');
        void (async () => {
          const updatedSub = await refreshUntilPlanMatches(expected);
          if (updatedSub) {
            setPurchaseSuccessSub(updatedSub);
          }
          pushPurchaseSuccessNotification(updatedSub);
          setShowPurchaseSuccessModal(true);
        })();
      }

      if (cancelled === 'true') {
        toast.error('Payment cancelled.');
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
      setUpgrading(true);
      try {
        localStorage.setItem('pending_subscription_plan', planId);
        const { url } = await subscriptionService.createStripeCheckout(planId);
        if (!url) throw new Error('Missing Stripe checkout URL');
        window.location.assign(url);
      } catch (error) {
        const backendMessage =
          error instanceof AxiosError
            ? (error.response?.data as any)?.message
            : undefined;
        toast.error(
          Array.isArray(backendMessage)
            ? backendMessage.join(', ')
            : backendMessage || 'Failed to start payment. Please try again.',
        );
        localStorage.removeItem('pending_subscription_plan');
        setUpgrading(false);
      }
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
    name: plan.name,
    plan: plan.plan,
    price: plan.price,
    period: plan.duration === -1 ? 'forever' : plan.duration === 365 ? 'year' : 'month',
    currency: plan.currency,
    features: plan.features,
    description: plan.plan === 'free' 
      ? 'Perfect for getting started' 
      : plan.plan === 'premium' 
      ? 'For serious skincare enthusiasts'
      : 'Best value for annual commitment',
    cta: normalizePlan((plan as any).plan) === currentPlan ? 'Current Plan' : 'Upgrade Now',
    current: normalizePlan((plan as any).plan) === currentPlan,
    highlighted: plan.plan === 'premium',
  }));

  const faq = [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! New users get a 7-day free trial of Premium to experience all the advanced features.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and mobile payment methods through our secure payment partner Konnect.'
    },
    {
      question: 'How does the AI analysis work?',
      answer: 'Our AI uses advanced computer vision and dermatological algorithms to analyze your skin photos and provide personalized insights based on medical research.'
    }
  ];


  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
       
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-lg text-[#6B7280]">Unlock premium features for better skin health</p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        </div>
      ) : (
        <>
      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
        {displayPlans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-white text-sm font-medium rounded-full flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Most Popular
              </div>
            )}
            
            <Card className={`h-full ${plan.highlighted ? 'border-2 border-[#0EA5E9] shadow-xl' : ''}`}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold">
                    {plan.price === 0 ? 'Free' : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <>
                      <span className="text-[#6B7280]"> {plan.currency}</span>
                      <div className="text-sm text-[#6B7280]">/{plan.period}</div>
                    </>
                  )}
                </div>
                {/* <p className="text-[#6B7280]">{plan.description}</p>
                {plan.discount && (
                  <div className="mt-2 text-sm text-[#10B981] font-medium">
                    {plan.discount}
                  </div>
                )} */}
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-[#374151]">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                variant={plan.current ? 'outline' : 'primary'}
                disabled={
                  plan.current ||
                  upgrading ||
                  plan.plan === 'free' ||
                  (subscriptionLocked && !plan.current)
                }
                onClick={() =>
                  (!plan.current &&
                    plan.plan !== 'free' &&
                    !(subscriptionLocked && !plan.current)) &&
                  handleUpgrade(plan.plan)
                }
              >
                {upgrading && !plan.current ? <Loader2 className="w-5 h-5 animate-spin" /> : plan.current && <Check className="w-5 h-5" />}
                {plan.current ? 'Current Plan' : plan.cta}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-16"
      >
        <Card>
          <h2 className="text-2xl font-bold mb-8 text-center">Premium Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">Advanced AI Analysis</h3>
              <p className="text-sm text-[#6B7280]">
                Get deeper insights with our premium AI algorithms trained on millions of skin images
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#F9A8D4] to-[#FED7AA] flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">Unlimited Access</h3>
              <p className="text-sm text-[#6B7280]">
                Unlimited photo uploads, AI conversations, and detailed reports whenever you need them
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2">Priority Support</h3>
              <p className="text-sm text-[#6B7280]">
                Get priority responses from our AI coach and access to exclusive skincare resources
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
        <Card>
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {faq.map((item, index) => (
              <div key={index} className="border-b border-[#E5E7EB] last:border-0 pb-6 last:pb-0">
                <h3 className="font-bold mb-2">{item.question}</h3>
                <p className="text-sm text-[#6B7280]">{item.answer}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
        </>
      )}

      <AnimatePresence>
        {showPurchaseSuccessModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPurchaseSuccessModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 200,
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-auto px-4"
              style={{ zIndex: 201 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]" />

                <div
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, #8B5CF6, transparent)',
                    filter: 'blur(60px)',
                  }}
                />
                <div
                  className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-5 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, #0EA5E9, transparent)',
                    filter: 'blur(50px)',
                  }}
                />

                <button
                  onClick={() => setShowPurchaseSuccessModal(false)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative p-8">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
                    <PartyPopper className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-center text-gray-900">Paiement confirme</h3>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Votre abonnement premium est actif. Profitez de toutes les fonctionnalites.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500 inline-flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#F59E0B]" /> Plan
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPlanName(purchaseSuccessSub?.plan)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500 inline-flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-[#0EA5E9]" /> Fin
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(purchaseSuccessSub?.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end">
                    <Button onClick={() => setShowPurchaseSuccessModal(false)}>
                      <Check className="w-4 h-4" />
                      Continuer
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
