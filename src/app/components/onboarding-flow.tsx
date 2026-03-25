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
import { useAccessibilityStore } from '../../stores/accessibility.store';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingData {
  skinType?: any;
  fitzpatrickType?: number;
  concerns?: string[];
  sensitivities?: string[];
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t } = useAccessibilityStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total steps: Welcome(0), Profile(1), SkinType(2), Fitzpatrick(3), Concerns(4), Sensitivities(5), Summary(6)
  const stepLabels = t('onboarding.steps') as unknown as string[];
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
        toast.error(t('onboarding.notProvided'));
        return;
      }

      await skinProfileService.upsert({
        skinType: onboardingData.skinType,
        fitzpatrickType: onboardingData.fitzpatrickType,
        concerns: onboardingData.concerns,
        sensitivities: onboardingData.sensitivities,
      });

      toast.success(t('auth.signupSuccess') || 'Success');
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
      {/* ═══ FOREGROUND CONTENT ═══ */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Progress bar */}
        <div className="pt-6 px-6">
          <ProgressBar currentStep={currentStep + 1} totalSteps={totalSteps} steps={stepLabels} />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 relative min-h-[600px]">
          {currentStep === 1 && (
            <button
              onClick={prevStep}
              className="absolute top-0 left-6 flex items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-colors z-10 font-medium"
            >
              ← {t('onboarding.back')}
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
