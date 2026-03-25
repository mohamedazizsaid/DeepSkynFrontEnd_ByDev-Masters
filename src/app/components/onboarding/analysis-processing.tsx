import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader, Sparkles, CheckCircle } from 'lucide-react';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface AnalysisProcessingProps {
  onComplete: () => void;
}

export function AnalysisProcessing({ onComplete }: AnalysisProcessingProps) {
  const { t } = useAccessibilityStore();
  const [currentStep, setCurrentStep] = useState(0);

  const initialProcessingSteps = [
    { id: 1, text: '', duration: 2000 },
    { id: 2, text: '', duration: 1500 },
    { id: 3, text: '', duration: 1800 },
    { id: 4, text: '', duration: 1700 },
    { id: 5, text: '', duration: 2000 }
  ];

  const translatedTexts = t('onboarding.analysisSteps') as unknown as string[];
  const processingSteps = initialProcessingSteps.map((s, i) => ({ ...s, text: translatedTexts[i] || s.text }));
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    if (currentStep < processingSteps.length) {
      const step = processingSteps[currentStep];
      
      // Update progress smoothly
      const progressIncrement = 100 / processingSteps.length;
      const startProgress = currentStep * progressIncrement;
      const endProgress = (currentStep + 1) * progressIncrement;
      let currentProgress = startProgress;
      
      progressTimer = setInterval(() => {
        currentProgress += (endProgress - startProgress) / (step.duration / 50);
        if (currentProgress >= endProgress) {
          currentProgress = endProgress;
          clearInterval(progressTimer);
        }
        setProgress(Math.min(currentProgress, 100));
      }, 50);

      // Move to next step
      stepTimer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id]);
        setCurrentStep(prev => prev + 1);
      }, step.duration);
    } else if (currentStep === processingSteps.length) {
      // All steps complete
      setTimeout(() => {
        onComplete();
      }, 1000);
    }

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
    };
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative" style={{ zIndex: 1 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-4">{t('onboarding.analysisTitle')}</h1>
          <p className="text-lg text-[#6B7280]">
            {t('onboarding.analysisSub')}
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-[#E5E7EB]">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#6B7280]">{t('onboarding.analysisProgress')}</span>
              <span className="text-sm font-bold text-[#0EA5E9]">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-4">
            {processingSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                    isCurrent ? 'bg-[#0EA5E9]/10' : isCompleted ? 'bg-[#F9FAFB]' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-[#10B981]' 
                      : isCurrent 
                      ? 'bg-[#0EA5E9]' 
                      : 'bg-[#E5E7EB]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                    )}
                  </div>
                  
                  <span className={`font-medium ${
                    isCompleted 
                      ? 'text-[#10B981]' 
                      : isCurrent 
                      ? 'text-[#0EA5E9]' 
                      : 'text-[#9CA3AF]'
                  }`}>
                    {step.text}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Estimated Time */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#6B7280]">
              {t('onboarding.analysisTime')} <span className="font-medium text-[#0EA5E9]">
                {Math.max(0, Math.ceil((processingSteps.length - currentStep) * 1.5))}s
              </span>
            </p>
          </div>
        </div>

        {/* Fun Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <div className="inline-block bg-white rounded-xl px-6 py-4 shadow-md border border-[#E5E7EB]">
            <p className="text-sm text-[#6B7280]">
              💡 <strong>{t('onboarding.analysisFact')}</strong> {t('onboarding.analysisFactDetail')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
