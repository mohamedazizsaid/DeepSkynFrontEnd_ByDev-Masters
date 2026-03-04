import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Crown, Sparkles, Shield, Loader2 } from 'lucide-react';
import { Button } from '../button';
import { Card } from '../card';
import { subscriptionService } from '../../../lib/services/subscription.service';
import type { Subscription, SubscriptionPlanInfo } from '../../../lib/types';

interface SubscriptionPageProps {
  onBack: () => void;
}

export function SubscriptionPage({ onBack }: SubscriptionPageProps) {
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      const result = await subscriptionService.upgrade(plan);
      setCurrentSub(result);
    } catch { /* handle */ } finally { setUpgrading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await subscriptionService.cancel();
      setCurrentSub(result);
    } catch { /* handle */ } finally { setCancelling(false); }
  };

  const isPremium = currentSub?.plan === 'PREMIUM' || currentSub?.plan === 'premium';
  const displayPlans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Basic skin analysis',
        'Personalized routine',
        'Monthly reports',
        '5 AI coach messages/day',
        'Basic progress tracking'
      ],
      limitations: [
        'Limited photo uploads',
        'Standard insights',
        'No priority support'
      ],
      cta: 'Current Plan',
      current: true,
      highlighted: false
    },
    {
      name: 'Premium',
      price: 19,
      period: 'month',
      description: 'For serious skincare enthusiasts',
      features: [
        'Advanced AI analysis',
        'Unlimited AI coach access',
        'Unlimited photo uploads',
        'Detailed skin mapping',
        'Priority support',
        'Advanced analytics',
        'Export reports (PDF)',
        'Product recommendations',
        'Real-time insights',
        'Custom notifications'
      ],
      cta: 'Upgrade Now',
      current: false,
      highlighted: true,
      discount: 'Save 20% with annual plan'
    }
  ];

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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#0EA5E9] mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-lg text-[#6B7280]">Unlock premium features for better skin health</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
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
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[#6B7280]">/{plan.period}</span>
                  )}
                </div>
                <p className="text-[#6B7280]">{plan.description}</p>
                {plan.discount && (
                  <div className="mt-2 text-sm text-[#10B981] font-medium">
                    {plan.discount}
                  </div>
                )}
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
                
                {plan.limitations && plan.limitations.map((limitation, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-50">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-0.5 bg-[#9CA3AF]" />
                    </div>
                    <span className="text-sm text-[#6B7280]">{limitation}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                variant={plan.current ? 'outline' : 'primary'}
                disabled={plan.current || upgrading}
                onClick={() => !plan.current && handleUpgrade(plan.name.toUpperCase())}
              >
                {upgrading && !plan.current ? <Loader2 className="w-5 h-5 animate-spin" /> : plan.current && <Check className="w-5 h-5" />}
                {plan.current ? (isPremium ? 'Current Plan' : 'Current Plan') : plan.cta}
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
    </div>
  );
}
