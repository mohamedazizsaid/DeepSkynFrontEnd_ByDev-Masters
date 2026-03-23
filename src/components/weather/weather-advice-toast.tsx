// Custom toast component pour afficher les conseils IA avec un beau design
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface WeatherAdviceToastProps {
  advice: string;
  emoji: string;
  urgency: 'low' | 'medium' | 'high';
  onClose?: () => void;
}

export const WeatherAdviceToast: React.FC<WeatherAdviceToastProps> = ({
  advice,
  emoji,
  urgency,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getUrgencyColors = () => {
    switch (urgency) {
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-red-500/10 to-red-600/10',
          border: 'border-red-300 dark:border-red-700',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10',
          border: 'border-yellow-300 dark:border-yellow-700',
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
        };
      case 'low':
      default:
        return {
          bg: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10',
          border: 'border-green-300 dark:border-green-700',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        };
    }
  };

  const colors = getUrgencyColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`
        w-full max-w-md rounded-xl shadow-2xl overflow-hidden
        border ${colors.border}
        ${colors.bg}
        backdrop-blur-xl
        bg-white/80 dark:bg-gray-800/80
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-2xl">{emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Conseil Météo IA
                </h3>
                <span
                  className={`
                    text-xs font-semibold px-2 py-1 rounded-full
                    ${colors.badge}
                  `}
                >
                  {urgency === 'high'
                    ? '🔴 Urgent'
                    : urgency === 'medium'
                      ? '🟡 Modéré'
                      : '🟢 OK'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Message */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {advice}
            </p>
          </div>
          <div className="flex-shrink-0">{colors.icon}</div>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 8, ease: 'linear' }}
          className={`
            mt-3 h-1 rounded-full
            bg-gradient-to-r
            ${
              urgency === 'high'
                ? 'from-red-500 to-red-600'
                : urgency === 'medium'
                  ? 'from-yellow-500 to-orange-500'
                  : 'from-green-500 to-emerald-500'
            }
          `}
        />
      </div>
    </motion.div>
  );
};

/**
 * Helper function pour afficher un toast avec conseil météo
 */
export const showWeatherAdviceToast = (
  advice: string,
  emoji: string,
  urgency: 'low' | 'medium' | 'high'
) => {
  toast.custom(
    (t) => (
      <WeatherAdviceToast
        advice={advice}
        emoji={emoji}
        urgency={urgency}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 8000,
      position: 'top-right',
    }
  );
};
