import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressBar } from './onboarding/progress-bar';
import { WelcomeStep } from './onboarding/welcome-step';
import { ProfileSetupStep } from './onboarding/profile-setup-step';
import { SkinTypeQuizStep } from './onboarding/skin-type-quiz-step';
import { FitzpatrickStep } from './onboarding/fitzpatrick-step';
import { ConcernsStep } from './onboarding/concerns-step';
import { SensitivitiesStep } from './onboarding/sensitivities-step';
import { SummaryStep } from './onboarding/summary-step';
import { skinProfileService } from '../../lib/services/skin-profile.service';
import toast from 'react-hot-toast';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingData {
  skinType?: string;
  fitzpatrickType?: number;
  concerns?: string[];
  sensitivities?: string[];
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total steps: Welcome(0), Profile(1), SkinType(2), Fitzpatrick(3), Concerns(4), Sensitivities(5), Summary(6)
  const stepLabels = [
    'Bienvenue',
    'Profil',
    'Type de peau',
    'Phototype',
    'Préoccupations',
    'Sensibilités',
    'Résumé'
  ];
  const totalSteps = stepLabels.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setDirection('forward');
      setCurrentStep((curr) => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection('back');
      setCurrentStep((curr) => curr - 1);
    }
  };

  const updateData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    nextStep();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (!onboardingData.skinType) {
        toast.error('Type de peau manquant');
        return;
      }

      await skinProfileService.upsert({
        skinType: onboardingData.skinType,
        fitzpatrickType: onboardingData.fitzpatrickType,
        concerns: onboardingData.concerns,
        sensitivities: onboardingData.sensitivities,
      });

      toast.success('Profil créé avec succès !');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      toast.error('Erreur lors de la création du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction: string) => ({
      x: direction === 'forward' ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      zIndex: 0,
      x: direction === 'forward' ? -50 : 50,
      opacity: 0,
    }),
  };

  const steps = [
    <WelcomeStep onNext={nextStep} />,
    <ProfileSetupStep onComplete={nextStep} />,
    <SkinTypeQuizStep
      onNext={updateData}
      onBack={prevStep}
      initialValue={onboardingData.skinType}
    />,
    <FitzpatrickStep
      onNext={updateData}
      onBack={prevStep}
      initialValue={onboardingData.fitzpatrickType}
    />,
    <ConcernsStep
      onNext={updateData}
      onBack={prevStep}
      initialValue={onboardingData.concerns}
    />,
    <SensitivitiesStep
      onNext={updateData}
      onBack={prevStep}
      initialValue={onboardingData.sensitivities}
    />,
    <SummaryStep
      data={onboardingData}
      onBack={prevStep}
      onSubmit={handleComplete}
      isSubmitting={isSubmitting}
    />,
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ═══ FULLSCREEN ANIMATED BACKGROUND ═══ */}
      <div
        className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1a1a3e] to-[#24243e]" />

        {/* Animated gradient mesh blobs */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`blob-${i}`}
            className="absolute rounded-full"
            style={{
              width: 200 + i * 80,
              height: 200 + i * 80,
              background: `radial-gradient(circle, ${
                i % 3 === 0
                  ? 'rgba(14,165,233,0.15)'
                  : i % 3 === 1
                  ? 'rgba(139,92,246,0.12)'
                  : 'rgba(6,182,212,0.1)'
              }, transparent 70%)`,
              left: `${(i * 17 + 5) % 90}%`,
              top: `${(i * 23 + 10) % 80}%`,
              filter: 'blur(40px)',
            }}
            animate={{
              y: [0, -40 - i * 10, 0],
              x: [0, 20 + i * 5, 0],
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.7,
            }}
          />
        ))}

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 4) * 2,
              height: 2 + (i % 4) * 2,
              background: i % 2 === 0 ? '#0EA5E9' : '#8B5CF6',
              left: `${(i * 5 + 3) % 100}%`,
              top: `${(i * 7 + 5) % 100}%`,
            }}
            animate={{
              y: [0, -60 - i * 5, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ═══ FOREGROUND CONTENT ═══ */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Progress bar with adapted dark theme */}
        <div className="pt-6 px-6">
          <ProgressBar currentStep={currentStep + 1} totalSteps={totalSteps} steps={stepLabels} />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 relative min-h-[600px]">
          {currentStep === 1 && (
            <button
              onClick={prevStep}
              className="absolute top-0 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors z-10 font-medium"
            >
              ← Retour
            </button>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full"
            >
              {steps[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
