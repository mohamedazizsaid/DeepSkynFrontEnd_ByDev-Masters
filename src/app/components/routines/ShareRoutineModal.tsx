import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Loader2, Sparkles } from 'lucide-react';
import type { Routine } from '../../../lib/types';
import { routineService } from '../../../lib/services/routine.service';
import toast from 'react-hot-toast';

interface ShareRoutineModalProps {
  routine: Routine | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareRoutineModal({ routine, isOpen, onClose }: ShareRoutineModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!routine || !mounted) return null;

  const handleShare = async () => {
    try {
      setIsLoading(true);
      await routineService.shareRoutine(routine.id, {
        routineId: routine.id,
        customMessage: customMessage || undefined,
      });
      toast.success('✨ Routine partagée avec succès!');
      setCustomMessage('');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du partage');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeEmoji = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'AM') return '🌅';
    if (t === 'PM') return '🌙';
    if (t.includes('WEEKLY')) return '⭐';
    return '✨';
  };

  const previewMessage = () => {
    const emoji = getTypeEmoji(routine.type);
    let msg = `${emoji} ${routine.name}\n${routine.type} • ${routine.steps.length} étapes`;

    if (customMessage) {
      msg += `\n\n💬 "${customMessage}"`;
    }

    msg += '\n\n📋 Routine:\n';
    routine.steps.slice(0, 3).forEach((step, idx) => {
      msg += `${idx + 1}. ${step.name}`;
      if (step.productName) msg += ` - ${step.productName}`;
      msg += '\n';
    });

    if (routine.steps.length > 3) {
      msg += `\n... et ${routine.steps.length - 3} étape(s)`;
    }

    msg += '\n\n#SkincareRoutine #DeepSkyn';
    return msg;
  };

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
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl max-h-[85vh] mx-auto p-4"
            style={{ zIndex: 201 }}
          >
            <div className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white m-4">
              {/* Top gradient accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0EA5E9] via-[#8B5CF6] to-[#EC4899]" />

              {/* Decorative glow circles */}
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

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={isLoading}
                className="absolute top-5 right-5 p-2.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Content - Horizontal Layout */}
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div
                      className="p-3 rounded-2xl flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(139,92,246,0.1))',
                        border: '1px solid rgba(14,165,233,0.2)',
                      }}
                    >
                      <Share2 className="w-6 h-6 text-[#0EA5E9]" />
                    </div>
                    <div>
                      <h2 className="text-gray-900 font-bold text-2xl">Partager la routine</h2>
                      <p className="text-gray-500 text-xs mt-0.5">Inspirez votre communauté avec vos meilleurs conseils</p>
                    </div>
                </div>

                {/* Main Flex Container - Left Column, Divider, Right Column */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column */}
                  <div className="flex-1 space-y-6">
                    {/* Routine Info Card */}
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className={`rounded-2xl p-6 shadow-sm border backdrop-blur-sm ${
                        routine.type === 'AM' || routine.type === 'MORNING'
                          ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/50 border-amber-100/60'
                          : 'bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border-indigo-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                          routine.type === 'AM' || routine.type === 'MORNING'
                            ? 'bg-amber-100/80 text-amber-700'
                            : 'bg-indigo-100/80 text-indigo-700'
                        }`}>
                          <span className="text-sm">{getTypeEmoji(routine.type)}</span>
                          <span>{routine.type}</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 backdrop-blur-sm">
                          {routine.steps.length} Étapes
                        </span>
                      </div>
                      <h3 className="font-extrabold text-2xl text-gray-900 leading-tight">{routine.name}</h3>
                      {routine.notes && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{routine.notes}</p>}
                    </motion.div>

                    {/* Custom Message */}
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="space-y-3"
                    >
                      <label htmlFor="message" className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        <span></span>
                        Ajouter un message (optionnel)
                      </label>
                      <textarea
                        id="message"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value.slice(0, 200))}
                        placeholder="Qu'est-ce qui rend cette routine spéciale pour vous ?"
                        maxLength={200}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 focus:border-[#0EA5E9] resize-none transition-all text-sm shadow-sm"
                      />
                      <div className={`text-xs font-medium text-right ${
                        customMessage.length >= 180 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {customMessage.length}/200
                      </div>
                    </motion.div>

                    {/* Disclaimer */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100/60"
                    >
                      <span className="text-base leading-none flex-shrink-0">✨</span>
                      <p className="text-gray-600 text-[12px] leading-relaxed">
                        Votre routine sera partagée avec votre communauté. Assurez-vous que les produits et conseils sont vérifiés.
                      </p>
                    </motion.div>
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

                  {/* Right Column */}
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Steps Preview */}
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="space-y-3"
                    >
                      <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                        Aperçu de la routine
                      </label>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {routine.steps.slice(0, 4).map((step, idx) => (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.05, duration: 0.3 }}
                            key={idx}
                            className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-[#0EA5E9]/30 hover:bg-[#0EA5E9]/2 transition-all"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0 border border-gray-200 group-hover:text-[#0EA5E9] group-hover:border-[#0EA5E9]/40 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-blue-100 transition-all">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs text-gray-900 truncate">{step.name}</div>
                              {step.productName ? (
                                <div className="text-[10px] text-[#0EA5E9] font-semibold truncate mt-0.5">
                                  {step.productName}
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5 capitalize">
                                  {step.category}
                                </div>
                              )}
                            </div>
                            {step.duration && (
                              <div className="text-[10px] text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded-md border border-gray-100 group-hover:bg-[#0EA5E9]/5 group-hover:text-[#0EA5E9] group-hover:border-[#0EA5E9]/20 transition-all flex-shrink-0">
                                {Math.round(Number(step.duration) / 60)}m
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {routine.steps.length > 4 && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-xs text-gray-500 font-semibold p-2.5 text-center bg-gray-50/80 rounded-xl border border-gray-100 border-dashed"
                          >
                            + {routine.steps.length - 4} autre(s) étape(s)
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Bottom Actions Box */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-col gap-3 mt-auto"
                    >
                      <motion.button
                        onClick={handleShare}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] hover:from-[#0284C7] hover:to-[#7C3AED] text-white rounded-xl font-semibold shadow-lg shadow-[#0EA5E9]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Partage en cours...
                          </>
                        ) : (
                          <>
                            <Share2 size={16} />
                            Publier la routine
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-all"
                      >
                        Annuler
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
