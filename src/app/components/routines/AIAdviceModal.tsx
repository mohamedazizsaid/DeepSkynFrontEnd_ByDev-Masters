import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface AIAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  advice: {
    advice: string;
    rating: 'good' | 'neutral' | 'caution';
    emoji: string;
  } | null;
  isLoading?: boolean;
}

export function AIAdviceModal({ isOpen, onClose, advice, isLoading }: AIAdviceModalProps) {
  const ratingConfig = {
    good: {
      icon: <CheckCircle className="w-6 h-6" />,
      color: '#10B981',
      bgColor: 'rgba(16,185,129,0.1)',
      borderColor: 'rgba(16,185,129,0.3)',
      label: 'Bonne modification',
    },
    neutral: {
      icon: <Info className="w-6 h-6" />,
      color: '#0EA5E9',
      bgColor: 'rgba(14,165,233,0.1)',
      borderColor: 'rgba(14,165,233,0.3)',
      label: 'Information',
    },
    caution: {
      icon: <AlertTriangle className="w-6 h-6" />,
      color: '#F59E0B',
      bgColor: 'rgba(245,158,11,0.1)',
      borderColor: 'rgba(245,158,11,0.3)',
      label: 'Attention',
    },
  };

  const config = advice ? ratingConfig[advice.rating] || ratingConfig.neutral : ratingConfig.neutral;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 100 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-auto"
            style={{ zIndex: 101 }}
          >
            <div
              className="relative rounded-3xl border border-gray-100 p-6 shadow-2xl overflow-hidden bg-white"
              style={{
                backdropFilter: 'blur(40px)',
              }}
            >
              {/* Decorative glow */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${config.color}, transparent)`,
                  filter: 'blur(60px)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {isLoading ? (
                /* Loading state */
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <Sparkles className="w-12 h-12 text-[#0EA5E9]" />
                  </motion.div>
                  <p className="text-gray-500 text-sm">L'IA analyse votre modification...</p>
                  <div className="flex justify-center gap-1 mt-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#0EA5E9]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              ) : advice ? (
                /* Advice content */
                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{
                        backgroundColor: config.bgColor,
                        border: `1px solid ${config.borderColor}`,
                        color: config.color,
                      }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-base">Avis de l'IA</h3>
                      <p className="text-xs" style={{ color: config.color }}>
                        {config.label}
                      </p>
                    </div>
                    <span className="text-2xl ml-auto">{advice.emoji}</span>
                  </div>

                  {/* Advice text */}
                  <div
                    className="rounded-2xl p-4 mb-6 bg-gray-50 border border-gray-100"
                  >
                    <p className="text-gray-700 text-sm leading-relaxed">{advice.advice}</p>
                  </div>

                  {/* AI disclaimer */}
                  <p className="text-gray-400 text-[10px] text-center mb-4">
                    💡 Avis généré par IA — consultez un dermatologue pour des conseils médicaux
                  </p>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all"
                  >
                    Compris ✨
                  </motion.button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
