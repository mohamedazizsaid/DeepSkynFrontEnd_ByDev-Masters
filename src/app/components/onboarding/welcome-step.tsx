import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Scan, Calendar, TrendingUp, Shield, Heart } from 'lucide-react';
import { Button } from '../button';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useAccessibilityStore();
  const features = [
    {
      icon: <Scan className="w-7 h-7" />,
      title: 'Analyse de Peau IA',
      description: 'Analyse avancée de votre type de peau unique',
      gradient: 'from-[#0EA5E9] to-[#06B6D4]',
      bgGlow: '#0EA5E9'
    },
    {
      icon: <Calendar className="w-7 h-7" />,
      title: 'Routine Personnalisée',
      description: 'Un programme de soins adapté à vos besoins',
      gradient: 'from-[#8B5CF6] to-[#A78BFA]',
      bgGlow: '#8B5CF6'
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: 'Suivi de Progrès',
      description: 'Suivez l\'évolution de votre peau au fil du temps',
      gradient: 'from-[#10B981] to-[#34D399]',
      bgGlow: '#10B981'
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Protection Solaire',
      description: 'Recommandations SPF selon votre phototype',
      gradient: 'from-[#F59E0B] to-[#FBBF24]',
      bgGlow: '#F59E0B'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        {/* Animated logo */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] blur-xl opacity-40" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-2xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-[#111827]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {t('onboarding.welcomeTitle')}{' '}
          <span className="bg-gradient-to-r from-[#0EA5E9] via-[#06B6D4] to-[#8B5CF6] bg-clip-text text-transparent">
            DeepSkyn
          </span>
          {' '}! ✨
        </motion.h1>

        <motion.p
          className="text-xl text-[#6B7280] mb-14 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {t('onboarding.welcomeSub')}
        </motion.p>

        {/* Feature cards — equal width via grid + h-full */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
              whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.25 } }}
              className="relative group cursor-default"
            >
              {/* Glow effect */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
                style={{ background: feature.bgGlow }}
              />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:border-[#0EA5E9]/30 transition-all duration-300 h-full flex flex-col items-center">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-[#111827] mb-2 text-base">{feature.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0EA5E9]/10 to-[#8B5CF6]/10 rounded-2xl blur-sm" />
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#0EA5E9]/20">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#EF4444]" />
                <span className="text-sm text-[#374151] font-medium">{t('onboarding.customized')}</span>
              </div>
              <div className="w-px h-6 bg-[#E5E7EB] hidden sm:block" />
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-[#10B981]"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-sm text-[#374151] font-medium">{t('onboarding.timeMin')}</span>
              </div>
              <div className="w-px h-6 bg-[#E5E7EB] hidden sm:block" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0EA5E9]" />
                <span className="text-sm text-[#374151] font-medium">{t('onboarding.secure')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button size="lg" onClick={onNext} className="px-12 py-5 text-lg shadow-xl shadow-[#0EA5E9]/25 hover:shadow-2xl hover:shadow-[#0EA5E9]/30">
              {t('onboarding.startInfo')}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
