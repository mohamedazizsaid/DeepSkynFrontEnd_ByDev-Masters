import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      color: 'var(--primary)',
      bgColor: 'rgba(var(--accent-primary-rgb),0.1)',
      borderColor: 'rgba(var(--accent-primary-rgb),0.3)',
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Light Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl mx-auto"
            style={{ zIndex: 101 }}
          >
            <div
              className="relative rounded-3xl border border-gray-100 p-7 shadow-2xl overflow-hidden bg-white"
              style={{
                backdropFilter: 'blur(40px)',
              }}
            >
              {/* Top gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]" />

              {/* Decorative glow */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${config.color}, transparent)`,
                  filter: 'blur(60px)',
                }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-10"
                style={{
                  background: 'radial-gradient(circle, #0EA5E9, transparent)',
                  filter: 'blur(50px)',
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
                  <div className="flex items-center gap-3 mb-5 mt-1">
                    <div
                      className="p-2.5 rounded-2xl"
                      style={{
                        backgroundColor: config.bgColor,
                        border: `1px solid ${config.borderColor}`,
                        color: config.color,
                      }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-lg leading-tight">Avis intelligent de l'IA</h3>
                      <p className="text-xs font-semibold" style={{ color: config.color }}>
                        {config.label}
                      </p>
                    </div>
                    <span className="text-2xl ml-auto">{advice.emoji}</span>
                  </div>

                  {/* Advice text */}
                  <div
                    className="rounded-2xl p-5 mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <p className="text-gray-700 text-sm leading-relaxed">{advice.advice}</p>
                  </div>

                  {/* AI disclaimer */}
                  <div className="flex items-start gap-2 mb-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-base leading-none">💡</span>
                    <p className="text-gray-400 text-[10px] leading-relaxed">
                      Avis généré par IA pour la cohérence de votre routine. Consultez un dermatologue pour des conseils médicaux personnalisés.
                    </p>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all"
                  >
                    Compris ✨
                  </motion.button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
