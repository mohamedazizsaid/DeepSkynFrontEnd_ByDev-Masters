import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import CountUp from 'react-countup';
import { Sparkles, Brain, Calendar, TrendingUp, Star, Check, ArrowRight, Loader2, AlertTriangle, LogIn, X } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { subscriptionService } from '../../lib/services/subscription.service';
import type { SubscriptionPlanInfo } from '../../lib/types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const { t, reduceMotion } = useAccessibilityStore();
  const [inView, setInView] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const browserReducedMotion = useReducedMotion();
  const shouldReduceMotion = !!(reduceMotion || browserReducedMotion);

  const fullTitle = `${t('landing.heroTitle1')}${t('landing.heroTitleGradient')}${t('landing.heroTitle2')}`;
  const [visibleTitleText, setVisibleTitleText] = useState('');
  const [titleLoopKey, setTitleLoopKey] = useState(0);

  const part1 = t('landing.heroTitle1');
  const part2 = t('landing.heroTitleGradient');

  // Navbar logo animation state
  const fullLogoText = 'DeepSkyn';
  const [visibleLogoText, setVisibleLogoText] = useState('');
  const [logoLoopKey, setLogoLoopKey] = useState(0);
  const [isNavIconShifted, setIsNavIconShifted] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleLogoText(fullLogoText);
      setIsNavIconShifted(true);
      return;
    }

    setVisibleLogoText('');
    setIsNavIconShifted(false);
    const charDelay = 60;
    const holdDelay = 5000;
    const timeouts: NodeJS.Timeout[] = [];

    const type = (index: number) => {
      if (index <= fullLogoText.length) {
        setVisibleLogoText(fullLogoText.slice(0, index));
        timeouts.push(setTimeout(() => type(index + 1), charDelay));
      } else {
        timeouts.push(setTimeout(() => {
          setLogoLoopKey(prev => prev + 1);
        }, holdDelay));
      }
    };

    timeouts.push(setTimeout(() => {
      setIsNavIconShifted(true);
      timeouts.push(setTimeout(() => type(1), 500));
    }, 1000));

    return () => timeouts.forEach(clearTimeout);
  }, [logoLoopKey, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleTitleText(fullTitle);
      return;
    }

    setVisibleTitleText('');
    const charDelay = 45;
    const holdDelay = 5000; // 5s loop
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

    timeouts.push(setTimeout(() => type(1), 150));

    return () => timeouts.forEach(clearTimeout);
  }, [fullTitle, shouldReduceMotion, titleLoopKey]);

  const baseViewport = { once: true, amount: 0.2, margin: '0px 0px -80px 0px' } as const;
  const heroTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' as const };
  const sectionTransition = (delay = 0) => (shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay, ease: 'easeOut' as const });
  
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc')
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc')
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc')
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: t('landing.feature4Title'),
      description: t('landing.feature4Desc')
    }
  ];

  const benefits = t('landing.benefits') as unknown as string[];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Utilisatrice Premium',
      text: '« DeepSkyn a transformé ma routine beauté! L\'analyse IA était d\'une précision fantastique. »',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Utilisateur Gratuit',
      text: '« Je comprends enfin mon type de peau et les produits qui me conviennent vraiment. »',
      rating: 5
    },
    {
      name: 'Emma Williams',
      role: 'Utilisatrice Premium',
      text: '« Le suivi des progrès me motive chaque jour. Je vois de vraies améliorations ! »',
      rating: 5
    }
  ];

  const normalizePlan = (plan: unknown): 'free' | 'premium' | 'premium_yearly' => {
    if (typeof plan !== 'string') return 'free';
    const p = plan.trim();
    if (!p) return 'free';

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

  const loadPlans = async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const planList = await subscriptionService.getPlans();
      setPlans(planList);
    } catch {
      setPlansError(t('landing.pricingLoadError'));
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const displayPlans = useMemo(() => {
    const order: Record<string, number> = {
      free: 0,
      premium: 1,
      premium_yearly: 2,
    };

    return [...plans]
      .sort((a, b) => {
        const aOrder = order[normalizePlan(a.plan)] ?? 99;
        const bOrder = order[normalizePlan(b.plan)] ?? 99;
        return aOrder - bOrder;
      })
      .map((plan) => {
        const normalized = normalizePlan(plan.plan);
        return {
          planCode: plan.plan,
          name: localizePlanName(plan.plan, plan.name),
          price: plan.price,
          currency: plan.currency,
          period: localizePeriod(plan.duration),
          features: Array.from(new Set((plan.features || []).map(localizeFeature))),
          isFree: normalized === 'free',
          highlighted: normalized === 'premium',
        };
      });
  }, [plans, t]);

  const openLoginRequiredModal = (planName: string) => {
    setSelectedPlanName(planName);
    setShowLoginRequiredModal(true);
  };

  const closeLoginRequiredModal = () => {
    setShowLoginRequiredModal(false);
  };

  const handlePaidPlanClick = (planName: string) => {
    openLoginRequiredModal(planName);
  };

  const handleLoginNow = () => {
    setShowLoginRequiredModal(false);
    onLogin();
  };

  return (
    <div className="min-h-screen relative" style={{ zIndex: 1 }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 transform-gpu will-change-transform min-w-[150px]"
            initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
            animate={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            transition={sectionTransition()}
          >
            <motion.div 
                animate={{ x: isNavIconShifted ? 0 : 40 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center overflow-hidden shadow-lg shadow-[#0EA5E9]/20"
            >
                <motion.div
                    animate={{ 
                        rotate: [-10, 10, -10, 10, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                    }}
                >
                    <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
            </motion.div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent flex items-center">
              {visibleLogoText}
              {visibleLogoText.length > 0 && visibleLogoText.length < fullLogoText.length && (
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block ml-0.5 text-[#0EA5E9]"
                >
                    |
                </motion.span>
              )}
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-4 transform-gpu will-change-transform"
            initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
            animate={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            transition={sectionTransition(0.05)}
          >
            <Button variant="ghost" onClick={onLogin}>
              {t('landing.navSignIn')}
            </Button>
            <Button onClick={onGetStarted}>
              {t('landing.navGetStarted')}
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="transform-gpu will-change-transform"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={heroTransition}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0EA5E9]/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                <span className="text-sm text-[#0EA5E9] font-medium">{t('landing.heroTag')}</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight min-h-[160px] lg:min-h-[192px]">
                {visibleTitleText.slice(0, part1.length)}
                <span className="block bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                  {visibleTitleText.slice(part1.length, part1.length + part2.length)}
                </span>
                {visibleTitleText.slice(part1.length + part2.length)}
                {visibleTitleText.length < fullTitle.length && !shouldReduceMotion && (
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block ml-1 text-[#0EA5E9]"
                  >
                    |
                  </motion.span>
                )}
              </h1>
              
              <p
                className="text-xl text-[#6B7280] mb-8 leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {t('landing.heroDesc')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={onGetStarted}>
                  {t('landing.heroStart')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg">
                  {t('landing.heroWatchDemo')}
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">50K+</div>
                  <div className="text-sm text-[#6B7280]">{t('landing.activeUsers')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">4.9★</div>
                  <div className="text-sm text-[#6B7280]">{t('landing.userRating')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#0EA5E9]">95%</div>
                  <div className="text-sm text-[#6B7280]">{t('landing.satisfaction')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative transform-gpu will-change-transform"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={sectionTransition(0.15)}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                
                <ImageWithFallback
                  src="https://i.pinimg.com/736x/98/4f/15/984f1530158bf5689108fb026cc30dce.jpg"
                  alt="Natural skin close-up"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent"></div>
              </div>
              
              <motion.div
                className="absolute bottom-8 left-8 right-8 bg-white/55 backdrop-blur-2xl border border-white/70 rounded-2xl p-6 shadow-xl ltr:text-left rtl:text-right"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={sectionTransition(0.4)}
                onViewportEnter={() => setInView(true)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#6B7280] mb-1">{t('landing.skinHealthScore')}</div>
                    <div className="text-3xl font-bold text-[#0EA5E9]">
                      {inView && <CountUp end={87} duration={shouldReduceMotion ? 0 : 1.6} />}
                      /100
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={baseViewport}
            transition={sectionTransition()}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-xl text-[#6B7280]">{t('landing.featuresDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="transform-gpu will-change-transform"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={baseViewport}
                transition={sectionTransition(index * 0.08)}
              >
                <Card className="h-full p-6 bg-gradient-to-b from-white to-[#F0F9FF] border border-[rgba(59,189,244,0.15)] shadow-[0_4px_24px_rgba(59,189,244,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(59,189,244,0.12)] group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9] flex items-center justify-center text-white mb-4 p-3.5 shadow-lg shadow-[#0EA5E9]/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-[#6B7280]">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="transform-gpu will-change-transform"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={baseViewport}
              transition={sectionTransition()}
            >
              <h2 className="text-4xl font-bold mb-6">
                {t('landing.whyChoose')}
                <span className="block text-[#0EA5E9]">DeepSkyn?</span>
              </h2>
              <p className="text-xl text-[#6B7280] mb-8">
                {t('landing.whyDesc')}
              </p>
              
              <div className="space-y-4">
                {benefits?.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={baseViewport}
                    transition={sectionTransition(index * 0.06)}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#0EA5E9] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#374151]">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative transform-gpu will-change-transform"
              initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={baseViewport}
              transition={sectionTransition(0.1)}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://i.pinimg.com/736x/2c/33/b8/2c33b810ecbb190b29c75ae0ceae95c2.jpg"
                  alt="Skin analysis technology"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={baseViewport}
            transition={sectionTransition()}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.lovedBy')}</h2>
            <p className="text-xl text-[#6B7280]">{t('landing.lovedDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="transform-gpu will-change-transform"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={baseViewport}
                transition={sectionTransition(index * 0.08)}
              >
                <Card className="h-full border border-[#D9ECFF] bg-gradient-to-b from-white to-[#F5FBFF] shadow-md hover:shadow-xl transition-all duration-300 relative pl-4">
                  <div className="absolute top-0 left-0 h-full w-1 bg-[#3BBDF4] rounded-l-lg"></div>
                  <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7] mb-5" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#FBBF24] text-[#FBBF24]" />
                      ))}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold flex items-center justify-center text-sm overflow-hidden">
                      <img src={`https://i.pravatar.cc/40?u=${testimonial.name}`} alt={testimonial.name} />
                    </div>
                  </div>
                  <p className="text-[#374151] mb-6 italic leading-relaxed">{testimonial.text}</p>
                  <div className="pt-4 border-t border-[#E5EEF7]">
                    <div className="font-bold text-[#111827]">{testimonial.name}</div>
                    <div className="text-sm text-[#0369A1] bg-[#E0F2FE] inline-flex px-2.5 py-1 rounded-full mt-1">{testimonial.role}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={baseViewport}
            transition={sectionTransition()}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.pricingTitle')}</h2>
            <p className="text-xl text-[#6B7280]">{t('landing.pricingDesc')}</p>
          </motion.div>

          {plansLoading ? (
            <div className="rounded-3xl border border-[#D7EBFF] bg-white/80 p-10 shadow-sm text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0EA5E9] mb-3" />
              <p className="text-[#6B7280]">{t('landing.pricingLoading')}</p>
            </div>
          ) : plansError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center">
              <p className="text-rose-700 font-medium mb-4">{plansError}</p>
              <Button variant="outline" onClick={() => void loadPlans()}>
                {t('landing.pricingRetry')}
              </Button>
            </div>
          ) : displayPlans.length === 0 ? (
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center text-[#6B7280]">
              {t('landing.pricingNoPlans')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayPlans.map((plan, index) => (
                <motion.div
                  key={plan.planCode}
                  className="transform-gpu will-change-transform"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={baseViewport}
                  transition={sectionTransition(index * 0.08)}
                >
                  <Card className={`h-full relative transition-all duration-300 ${plan.highlighted
                      ? 'border-2 border-[#0EA5E9] bg-gradient-to-b from-white to-[#F0F9FF] shadow-xl shadow-[#38BDF8]/20 md:-translate-y-1'
                      : 'border border-[#D7EBFF] bg-gradient-to-b from-white to-[#F7FCFF] shadow-md hover:shadow-xl'
                    }`}>
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white text-sm font-medium rounded-full">
                        {t('landing.mostPopular')}
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      {plan.price === 0 ? (
                        <div className="text-4xl font-bold text-[#0EA5E9]">
                          {t('subscriptionPage.planNames.free')}
                        </div>
                      ) : (
                        <div className="text-4xl font-bold text-[#0EA5E9]">
                          {formatPrice(plan.price, plan.currency)}
                          <span className="text-lg text-[#6B7280]">/{plan.period}</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-[#0EA5E9]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={plan.isFree ? 'w-full' : 'w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1]'}
                      variant={plan.isFree ? 'outline' : 'primary'}
                      onClick={() => {
                        if (plan.isFree) {
                          onGetStarted();
                          return;
                        }
                        handlePaidPlanClick(plan.name);
                      }}
                    >
                      {plan.isFree ? t('landing.navGetStarted') : t('landing.planConnectToBuy')}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showLoginRequiredModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[120]"
              onClick={closeLoginRequiredModal}
            />

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-[121]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#F59E0B] via-[#0EA5E9] to-[#8B5CF6]" />

                <button
                  onClick={closeLoginRequiredModal}
                  className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t('landing.loginRequiredTitle')}</h3>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {t('landing.loginRequiredDesc')}
                  </p>

                  <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1E3A8A] mb-5">
                    {t('landing.loginRequiredPlanLabel')} <span className="font-semibold">{selectedPlanName}</span>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={closeLoginRequiredModal}>
                      {t('landing.loginRequiredCancel')}
                    </Button>
                    <Button onClick={handleLoginNow}>
                      <LogIn className="w-4 h-4" />
                      {t('landing.loginRequiredAction')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] relative overflow-hidden">
        {/* Animated particles would go here */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            className="transform-gpu will-change-transform"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={baseViewport}
            transition={sectionTransition()}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {t('landing.readyToTransform')}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {t('landing.joinThousands')}
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-[#0EA5E9] hover:bg-gray-50 border-0"
              onClick={onGetStarted}
            >
              {t('landing.freeAnalysis')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="mt-10 flex flex-wrap justify-center items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span role="img" aria-label="lock">🔒</span>
                <span className="text-white/90">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span role="img" aria-label="checkmark">✓</span>
                <span className="text-white/90">Sans engagement</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span role="img" aria-label="zap">⚡</span>
                <span className="text-white/90">Résultats en 60 sec</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <div className="h-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]"></div>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#111827] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">DeepSkyn</span>
              </div>
              <p className="text-gray-400 text-sm">
                {t('landing.footerDesc')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.product')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerFeatures')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerPricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerFaq')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.company')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerAbout')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerBlog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerCareers')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.legal')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerPrivacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerTerms')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerSecurity')}</a></li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center gap-6 my-8">
            {/* Replace with actual icons */}
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM12 18c-3.313 0-6-2.687-6-6s2.687-6 6-6 6 2.687 6 6-2.687 6-6 6zm-2-6h4v-2h-4v2z" clipRule="evenodd" /></svg>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.49-1.74.85-2.7 1.04C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.27 0 .34.04.67.11.98-3.56-.18-6.72-1.88-8.83-4.48-.37.63-.58 1.37-.58 2.15 0 1.48.75 2.79 1.9 3.55-.7-.02-1.36-.21-1.94-.54v.05c0 2.07 1.47 3.8 3.42 4.19-.36.1-.73.15-1.12.15-.27 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.96 2.97-1.46 1.14-3.3 1.82-5.3 1.82-.34 0-.68-.02-1.02-.06C3.43 18.5 5.62 19.5 8.01 19.5c7.2 0 11.13-5.97 11.13-11.13 0-.17 0-.34-.01-.51.77-.56 1.44-1.25 1.97-2.02z" /></svg>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-11 6H5v7h3V9zm-1 8H6v-1h1v1zm4 0H9v-1h1v1zm4 0h-1v-1h1v1zm4-8h-3v7h3V9z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2026 DeepSkyn. {t('landing.allRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
}
