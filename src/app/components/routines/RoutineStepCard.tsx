import React from 'react';
import { motion, Reorder } from 'motion/react';
import { GripVertical, Check, X, Clock, AlertTriangle } from 'lucide-react';

interface RoutineStepCardProps {
  step: {
    id: string;
    name: string;
    category: string;
    description?: string;
    duration?: number | string;
    completed?: boolean;
  };
  index: number;
  isHighlighted?: boolean;
  onRemove?: () => void;
  onComplete?: () => void;
}

const categoryColors: Record<string, string> = {
  cleanser: '#06B6D4',
  toner: '#F9A8D4',
  serum: '#8B5CF6',
  moisturizer: '#FBBF24',
  sunscreen: '#F59E0B',
  eye_cream: '#EC4899',
  night_cream: '#6366F1',
  exfoliant: '#10B981',
  makeup_remover: '#F472B6',
  mask: '#22D3EE',
  deep_cleanser: '#14B8A6',
  treatment: '#A78BFA',
};

const categoryLabels: Record<string, string> = {
  cleanser: 'Nettoyant',
  toner: 'Tonique',
  serum: 'Sérum',
  moisturizer: 'Hydratant',
  sunscreen: 'SPF',
  eye_cream: 'Contour yeux',
  night_cream: 'Crème nuit',
  exfoliant: 'Exfoliant',
  makeup_remover: 'Démaquillant',
  mask: 'Masque',
  deep_cleanser: 'Nettoyage profond',
  treatment: 'Traitement',
};

function formatDuration(d?: number | string): string {
  if (!d) return '';
  const sec = typeof d === 'string' ? parseInt(d) : d;
  if (isNaN(sec)) return '';
  if (sec >= 60) return `${Math.round(sec / 60)} min`;
  return `${sec}s`;
}

export function RoutineStepCard({
  step,
  index,
  isHighlighted = false,
  onRemove,
  onComplete,
}: RoutineStepCardProps) {
  const color = categoryColors[step.category] || '#6B7280';
  const label = categoryLabels[step.category] || step.category || 'Produit';

  return (
    <Reorder.Item
      value={step}
      className="relative"
      whileDrag={{
        scale: 1.04,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        zIndex: 50,
      }}
    >
      <motion.div
        layout
        className={`relative overflow-hidden rounded-2xl border-2 cursor-grab active:cursor-grabbing transition-all duration-300 ${
          isHighlighted
            ? 'border-[#0EA5E9] bg-blue-50/50 shadow-md shadow-[#0EA5E9]/10'
            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
        }`}
        style={{
          backdropFilter: 'blur(12px)',
        }}
        whileHover={{ y: -2 }}
        animate={
          isHighlighted
            ? {
                borderColor: ['rgba(14,165,233,0.3)', 'rgba(14,165,233,0.8)', 'rgba(14,165,233,0.3)'],
              }
            : {}
        }
        transition={isHighlighted ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {/* Subtle gradient accent */}
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
        />

        <div className="flex items-center gap-4 p-4 pl-5">
          {/* Drag handle */}
          <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />

          {/* Step number */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, ${color}33, ${color}11)`,
              color: color,
              border: `1px solid ${color}44`,
            }}
          >
            {step.completed ? (
              <Check className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{step.name}</h4>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider flex-shrink-0"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                  border: `1px solid ${color}33`,
                }}
              >
                {label}
              </span>
            </div>
            {step.description && (
              <p className="text-xs text-gray-500 truncate">{step.description}</p>
            )}
          </div>

          {/* Duration */}
          {step.duration && (
            <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatDuration(step.duration)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onComplete && !step.completed && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                <Check className="w-4 h-4" />
              </motion.button>
            )}
            {onRemove && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}
