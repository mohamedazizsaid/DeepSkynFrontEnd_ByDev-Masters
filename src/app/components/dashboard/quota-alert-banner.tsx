import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Crown, Lock, Sparkles } from 'lucide-react';

interface QuotaAlertBannerProps {
  variant: 'info' | 'warning' | 'blocked';
  title: string;
  message: string;
  used?: number;
  limit?: number | null;
  onUpgrade?: () => void;
  upgradeLabel?: string;
}

const variantStyles = {
  info: {
    container: 'border-[#BAE6FD] bg-gradient-to-r from-[#F0F9FF] via-white to-[#ECFEFF] text-[#0C4A6E]',
    badge: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    icon: 'text-[#0284C7]',
    progress: 'from-[#0EA5E9] to-[#06B6D4]',
  },
  warning: {
    container: 'border-[#FCD34D] bg-gradient-to-r from-[#FFFBEB] via-white to-[#FEF3C7] text-[#92400E]',
    badge: 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]',
    icon: 'text-[#D97706]',
    progress: 'from-[#F59E0B] to-[#FBBF24]',
  },
  blocked: {
    container: 'border-[#FCA5A5] bg-gradient-to-r from-[#FEF2F2] via-white to-[#FEE2E2] text-[#991B1B]',
    badge: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]',
    icon: 'text-[#DC2626]',
    progress: 'from-[#F87171] to-[#EF4444]',
  },
} as const;

export function QuotaAlertBanner({
  variant,
  title,
  message,
  used,
  limit,
  onUpgrade,
  upgradeLabel = 'Upgrade',
}: QuotaAlertBannerProps) {
  const styles = variantStyles[variant];
  const progressValue =
    typeof used === 'number' && typeof limit === 'number' && limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`rounded-2xl border px-4 py-3 shadow-sm ${styles.container}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">
            {variant === 'blocked' ? (
              <Lock className={`w-4 h-4 ${styles.icon}`} />
            ) : variant === 'warning' ? (
              <AlertTriangle className={`w-4 h-4 ${styles.icon}`} />
            ) : (
              <Sparkles className={`w-4 h-4 ${styles.icon}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{title}</p>
              <span className={`text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 ${styles.badge}`}>
                {variant === 'blocked' ? 'Limit' : variant === 'warning' ? 'Warning' : 'Info'}
              </span>
            </div>
            <p className="text-xs mt-1 opacity-95">{message}</p>
          </div>
        </div>

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-current px-2.5 py-1.5 text-xs font-semibold hover:bg-white/40 transition-colors"
          >
            <Crown className="w-3.5 h-3.5" />
            {upgradeLabel}
          </button>
        )}
      </div>

      {progressValue !== null && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-white/70 overflow-hidden border border-white/70">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${styles.progress}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
