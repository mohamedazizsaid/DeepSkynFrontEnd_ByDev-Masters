import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Star,
  ExternalLink,
  ShoppingBag,
  FlaskConical,
  BadgeCheck,
  BookOpen,
  QrCode,
} from 'lucide-react';
import type { ProductRecommendation } from '../../../lib/types';

interface AIProductRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ProductRecommendation | null;
  isLoading?: boolean;
  stepName?: string;
}

const ratingConfig = {
  excellent: {
    label: 'Excellent choix',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
    icon: <BadgeCheck className="w-5 h-5" />,
    stars: 5,
  },
  good: {
    label: 'Bon choix',
    color: 'var(--primary)',
    bgColor: 'rgba(var(--accent-primary-rgb),0.08)',
    borderColor: 'rgba(var(--accent-primary-rgb),0.25)',
    icon: <Star className="w-5 h-5" />,
    stars: 4,
  },
  alternative: {
    label: 'Alternative',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
    icon: <FlaskConical className="w-5 h-5" />,
    stars: 3,
  },
};

export function AIProductRecommendModal({
  isOpen,
  onClose,
  recommendation,
  isLoading,
  stepName,
}: AIProductRecommendModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = recommendation
    ? ratingConfig[recommendation.rating] || ratingConfig.good
    : ratingConfig.good;

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
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl mx-auto"
            style={{ zIndex: 201 }}
          >
            <div
              className="relative rounded-3xl border border-gray-100 shadow-2xl overflow-hidden bg-white"
            >
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
                  background: 'radial-gradient(circle, var(--primary), transparent)',
                  filter: 'blur(50px)',
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {isLoading ? (
                  /* ─── Loading State ─── */
                  <div className="text-center py-20">
                    <motion.div
                      className="relative w-20 h-20 mx-auto mb-5"
                    >
                      {/* Spinning outer ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: '3px solid transparent',
                          borderTopColor: 'var(--primary)',
                          borderRightColor: '#8B5CF6',
                        }}
                      />
                      {/* Inner icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ShoppingBag className="w-8 h-8 text-[#0EA5E9]" />
                        </motion.div>
                      </div>
                    </motion.div>
                    <p className="text-gray-900 font-semibold text-lg mb-1">
                      Recherche IA en cours...
                    </p>
                    <p className="text-gray-500 text-sm">
                      Analyse des articles dermatologiques pour{' '}
                      <span className="text-[#0EA5E9] font-medium">{stepName || 'ce step'}</span>
                    </p>
                    <div className="flex justify-center gap-1.5 mt-5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: 'var(--primary)' }}
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                ) : recommendation ? (
                  /* ─── Recommendation Content (Horizontal Layout) ─── */
                  <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left Column: Product Info */}
                    <div className="flex-1 md:w-[55%]">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className="p-2.5 rounded-2xl flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(139,92,246,0.1))',
                            border: '1px solid rgba(var(--accent-primary-rgb),0.2)',
                          }}
                        >
                          <Sparkles className="w-6 h-6 text-[#0EA5E9]" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-bold text-xl leading-tight">
                            Produit Recommandé
                          </h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Basé sur votre profil peau et experts dermatologues
                          </p>
                        </div>
                      </div>

                      {/* Product Card */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl p-6 mb-5"
                        style={{
                          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {/* Brand & Name */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="pr-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#8B5CF6]">
                              {recommendation.brand}
                            </span>
                            <h4 className="text-gray-900 font-bold text-lg mt-1 leading-snug">
                              {recommendation.productName}
                            </h4>
                          </div>
                          {/* Rating badge */}
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: config.bgColor,
                              border: `1px solid ${config.borderColor}`,
                            }}
                          >
                            <span style={{ color: config.color }}>{config.icon}</span>
                            <span
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{ color: config.color }}
                            >
                              {config.label}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          {recommendation.description}
                        </p>

                        {/* Price & Stars Row */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-900">
                              {recommendation.estimatedPrice}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                              Prix estimé
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-5 h-5"
                                fill={i < config.stars ? config.color : 'transparent'}
                                color={i < config.stars ? config.color : '#d1d5db'}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Key Ingredients */}
                        {recommendation.keyIngredients?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <FlaskConical className="w-4 h-4 text-[#8B5CF6]" />
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Ingrédients clés
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {recommendation.keyIngredients.map((ingredient, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                                  style={{
                                    backgroundColor: 'rgba(139,92,246,0.08)',
                                    color: '#7c3aed',
                                    border: '1px solid rgba(139,92,246,0.15)',
                                  }}
                                >
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {/* Why Recommended */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl p-5"
                        style={{
                          background: config.bgColor,
                          border: `1px solid ${config.borderColor}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BadgeCheck className="w-5 h-5" style={{ color: config.color }} />
                          <span className="text-sm font-bold" style={{ color: config.color }}>
                            Pourquoi ce produit ?
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {recommendation.whyRecommended}
                        </p>
                      </motion.div>
                    </div>

                    {/* Right Column: Divider for Desktop */}
                    <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

                    {/* Right Column: QR Code & Actions */}
                    <div className="flex-1 md:w-[45%] flex flex-col justify-between">
                      <div>
                        {/* QR Code Section */}
                        {recommendation.qrCodeDataUrl && (
                          <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-3xl p-6 mb-6 text-center shadow-inner"
                            style={{
                              background: 'linear-gradient(135deg, rgba(14,165,233,0.03), rgba(139,92,246,0.03))',
                              border: '1px solid rgba(14,165,233,0.1)',
                            }}
                          >
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <QrCode className="w-5 h-5 text-[#0EA5E9]" />
                              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Scannez pour acheter
                              </span>
                            </div>
                            <motion.div
                              className="inline-block p-4 bg-white rounded-3xl shadow-lg border border-gray-100"
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              <img
                                src={recommendation.qrCodeDataUrl}
                                alt="QR Code"
                                className="w-[180px] h-[180px] object-contain"
                              />
                            </motion.div>
                            <p className="text-xs text-gray-500 mt-4 leading-relaxed px-4">
                              📱 Utilisez l'appareil photo de votre téléphone pour
                              accéder à la page produit
                            </p>
                          </motion.div>
                        )}

                        {/* Source Articles */}
                        {recommendation.sourceArticles?.length > 0 && (
                          <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-6"
                          >
                            <div className="flex items-center gap-1.5 mb-3">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Articles de référence ({recommendation.sourceArticles.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {recommendation.sourceArticles.slice(0, 2).map((article, i) => (
                                <a
                                  key={i}
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-[#0EA5E9]/5 hover:border-[#0EA5E9]/20 transition-colors group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-gray-700 group-hover:text-[#0EA5E9] truncate block transition-colors">
                                      {article.title}
                                    </span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0EA5E9] flex-shrink-0 transition-colors" />
                                </a>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Bottom Actions Box */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {/* AI Disclaimer */}
                        <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-base leading-none">🤖</span>
                          <p className="text-gray-400 text-[10px] leading-relaxed">
                            Cette recommandation est générée par l'IA à partir de la littérature dermatologique. Consultez un professionnel pour des cas spécifiques.
                          </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-3">
                          <motion.a
                            href={recommendation.purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all text-center no-underline"
                          >
                            <ShoppingBag className="w-5 h-5" />
                            Acheter maintenant
                          </motion.a>
                          <motion.button
                            whileHover={{ backgroundColor: '#f9fafb' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full py-4 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-700 transition-all"
                          >
                            Fermer
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
