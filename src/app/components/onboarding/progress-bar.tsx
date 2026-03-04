import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Top text */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#6B7280]">
          Étape {currentStep} sur {totalSteps}
        </span>
        <span className="text-sm font-bold text-[#0EA5E9]">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Main progress bar */}
      <div className="relative h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-6">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0EA5E9] via-[#06B6D4] to-[#8B5CF6] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
          animate={{ x: ['-100%', '500%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {index < totalSteps - 1 && (
                <div className="absolute top-5 left-[50%] right-[-50%] h-[2px] bg-[#E5E7EB] z-0">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />
                </div>
              )}

              {/* Circle */}
              <motion.div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                    ? 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] border-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/20'
                    : isCurrent
                      ? 'border-[#0EA5E9] bg-white shadow-lg shadow-[#0EA5E9]/10'
                      : 'border-[#E5E7EB] bg-white'
                  }`}
                initial={false}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                  </motion.div>
                ) : (
                  <span className="font-semibold text-sm text-[#9CA3AF]">
                    {stepNumber}
                  </span>
                )}

                {/* Pulse ring for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#0EA5E9]"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                className={`mt-2 text-xs font-medium hidden md:block text-center leading-tight ${isCurrent ? 'text-[#0EA5E9] font-bold' : isCompleted ? 'text-[#10B981]' : 'text-[#9CA3AF]'
                  }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                {step}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
