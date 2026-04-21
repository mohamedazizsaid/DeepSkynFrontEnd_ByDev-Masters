import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Droplets, Waves, Sun, Sparkles, AlertCircle, Wind, Eye, Check } from 'lucide-react';
import { Button } from '../button';

interface SkinConcernsStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const concerns = [
  {
    id: 'acne',
    label: 'Acne & Breakouts',
    icon: <AlertCircle className="w-6 h-6" />,
    color: '#EF4444'
  },
  {
    id: 'wrinkles',
    label: 'Wrinkles & Fine Lines',
    icon: <Waves className="w-6 h-6" />,
    color: '#8B5CF6'
  },
  {
    id: 'dark-spots',
    label: 'Dark Spots',
    icon: <Sun className="w-6 h-6" />,
    color: '#F59E0B'
  },
  {
    id: 'dryness',
    label: 'Dryness',
    icon: <Droplets className="w-6 h-6" />,
    color: 'var(--accent-secondary)'
  },
  {
    id: 'sensitivity',
    label: 'Sensitivity',
    icon: <Sparkles className="w-6 h-6" />,
    color: '#F9A8D4'
  },
  {
    id: 'redness',
    label: 'Redness',
    icon: <AlertCircle className="w-6 h-6" />,
    color: '#FB7185'
  },
  {
    id: 'large-pores',
    label: 'Large Pores',
    icon: <Wind className="w-6 h-6" />,
    color: '#14B8A6'
  },
  {
    id: 'dark-circles',
    label: 'Dark Circles',
    icon: <Eye className="w-6 h-6" />,
    color: '#6366F1'
  },
  {
    id: 'uneven-texture',
    label: 'Uneven Texture',
    icon: <Sparkles className="w-6 h-6" />,
    color: '#EC4899'
  },
  {
    id: 'dullness',
    label: 'Dullness',
    icon: <Sun className="w-6 h-6" />,
    color: '#A855F7'
  }
];

export function SkinConcernsStep({ onNext, onBack }: SkinConcernsStepProps) {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  const toggleConcern = (id: string) => {
    setSelectedConcerns(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onNext({ concerns: selectedConcerns });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">What Are Your Skin Concerns?</h2>
        <p className="text-lg text-[#6B7280]">
          Select all that apply - this helps us personalize your routine
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-md border border-[#E5E7EB] mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {concerns.map((concern) => {
            const isSelected = selectedConcerns.includes(concern.id);
            
            return (
              <motion.button
                key={concern.id}
                type="button"
                onClick={() => toggleConcern(concern.id)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#0EA5E9] bg-[#0EA5E9]/5'
                    : 'border-[#E5E7EB] hover:border-[#0EA5E9]/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#0EA5E9] rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
                
                <div
                  className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${concern.color}20`, color: concern.color }}
                >
                  {concern.icon}
                </div>
                
                <div className="text-sm font-medium text-center text-[#374151]">
                  {concern.label}
                </div>
              </motion.button>
            );
          })}
        </div>

        {selectedConcerns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-[#0EA5E9]/10 rounded-xl"
          >
            <p className="text-sm text-[#0EA5E9]">
              ✨ You've selected <strong>{selectedConcerns.length}</strong> concern{selectedConcerns.length !== 1 ? 's' : ''}. 
              We'll tailor your skincare routine to address these.
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={selectedConcerns.length === 0}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
