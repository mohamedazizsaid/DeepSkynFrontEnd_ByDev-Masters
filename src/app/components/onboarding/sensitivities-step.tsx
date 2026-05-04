import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft, ArrowRight, Check, ShieldAlert,
    FlaskConical, Wine, Droplet, Leaf, Beaker, Flame, Pill
} from 'lucide-react';
import { Button } from '../button';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface SensitivitiesStepProps {
    onNext: (data: { sensitivities: string[] }) => void;
    onBack: () => void;
    initialValue?: string[];
}

const sensitivities = [
    {
        id: 'fragrance',
        label: 'Parfums / Fragrances',
        emoji: '🌺',
        icon: <Leaf className="w-6 h-6" />,
        description: 'Réactions aux parfums synthétiques ou naturels',
        gradient: 'from-[#EC4899] to-[#F472B6]',
        color: '#EC4899',
        lightBg: '#FDF2F8',
    },
    {
        id: 'alcohol',
        label: 'Alcool',
        emoji: '🧴',
        icon: <Wine className="w-6 h-6" />,
        description: 'Alcool dénaturé dans les produits cosmétiques',
        gradient: 'from-[#EF4444] to-[#F87171]',
        color: '#EF4444',
        lightBg: '#FEF2F2',
    },
    {
        id: 'retinol',
        label: 'Rétinol / Vitamine A',
        emoji: '⚡',
        icon: <Flame className="w-6 h-6" />,
        description: 'Desquamation, irritation due au rétinol',
        gradient: 'from-[#F59E0B] to-[#FBBF24]',
        color: '#F59E0B',
        lightBg: '#FFFBEB',
    },
    {
        id: 'aha-bha',
        label: 'AHA / BHA (Acides)',
        emoji: '🧪',
        icon: <FlaskConical className="w-6 h-6" />,
        description: 'Acides glycolique, salicylique, lactique',
        gradient: 'from-[#F59E0B] to-[#FBBF24]',
        color: '#8B5CF6',
        lightBg: '#F5F3FF',
    },
    {
        id: 'essential-oils',
        label: 'Huiles Essentielles',
        emoji: '🪔',
        icon: <Droplet className="w-6 h-6" />,
        description: 'Huiles essentielles irritantes (menthe, citron...)',
        gradient: 'from-[#10B981] to-[#34D399]',
        color: '#10B981',
        lightBg: '#ECFDF5',
    },
    {
        id: 'sulfates',
        label: 'Sulfates (SLS/SLES)',
        emoji: '🥏',
        icon: <Beaker className="w-6 h-6" />,
        description: 'Agents moussants agressifs',
        gradient: 'from-[#06B6D4] to-[#22D3EE]',
        color: 'var(--accent-secondary)',
        lightBg: '#ECFEFF',
    },
    {
        id: 'parabens',
        label: 'Parabens',
        emoji: '🚫',
        icon: <Pill className="w-6 h-6" />,
        description: 'Conservateurs chimiques controversés',
        gradient: 'from-[#EC4899] to-[#F472B6]',
        color: '#6366F1',
        lightBg: '#EEF2FF',
    },
    {
        id: 'vitamin-c',
        label: 'Vitamine C concentrée',
        emoji: '🍊',
        icon: <FlaskConical className="w-6 h-6" />,
        description: 'Concentrations élevées d\'acide ascorbique',
        gradient: 'from-[#D97706] to-[#F59E0B]',
        color: '#D97706',
        lightBg: '#FFFBEB',
    },
    {
        id: 'niacinamide',
        label: 'Niacinamide',
        emoji: '💊',
        icon: <Pill className="w-6 h-6" />,
        description: 'Vitamine B3 à haute concentration',
        gradient: 'from-[#14B8A6] to-[#2DD4BF]',
        color: '#14B8A6',
        lightBg: '#F0FDFA',
    },
    {
        id: 'none',
        label: 'Aucune sensibilité',
        emoji: '✅',
        icon: <Check className="w-6 h-6" />,
        description: 'Ma peau tolère bien la plupart des ingrédients',
        gradient: 'from-[#22C55E] to-[#4ADE80]',
        color: '#22C55E',
        lightBg: '#F0FDF4',
    },
];

export function SensitivitiesStep({ onNext, onBack, initialValue }: SensitivitiesStepProps) {
    const { t } = useAccessibilityStore();
    const [selected, setSelected] = useState<string[]>(initialValue || []);

    const toggleSensitivity = (id: string) => {
        if (id === 'none') {
            // if 'none' is clicked, deselect everything else
            setSelected(prev => prev.includes('none') ? [] : ['none']);
            return;
        }
        // Remove 'none' if something else is selected
        setSelected(prev => {
            const withoutNone = prev.filter(s => s !== 'none');
            return withoutNone.includes(id)
                ? withoutNone.filter(s => s !== id)
                : [...withoutNone, id];
        });
    };

    const handleSubmit = () => {
        const finalSensitivities = selected.filter(s => s !== 'none');
        onNext({ sensitivities: finalSensitivities });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-4xl mx-auto"
        >
            {/* Header */}
            <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div
                    className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#F87171] flex items-center justify-center shadow-lg shadow-[#EF4444]/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                    <ShieldAlert className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-extrabold mb-3 text-[#111827]">
                    {t('onboarding.sensTitle')}
                </h2>
                <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
                    {t('onboarding.sensSub')}
                </p>
            </motion.div>

            {/* Sensitivities Grid */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sensitivities.map((item, index) => {
                        const isSelected = selected.includes(item.id);

                        return (
                            <motion.button
                                key={item.id}
                                type="button"
                                onClick={() => toggleSensitivity(item.id)}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.04, type: 'spring', stiffness: 200, damping: 20 }}
                                whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.2 } }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${isSelected
                                        ? 'border-[#0EA5E9] shadow-lg'
                                        : 'border-[#E5E7EB] hover:border-[#0EA5E9]/40'
                                    }`}
                                style={{
                                    backgroundColor: isSelected ? item.lightBg : 'white',
                                }}
                            >
                                {/* Selection indicator */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: 'spring', stiffness: 400 }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-[#0EA5E9] rounded-full flex items-center justify-center shadow-lg z-10"
                                        >
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-3 mb-2">
                                    <motion.div
                                        className={`w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md`}
                                        animate={isSelected ? { rotate: [0, -5, 5, 0] } : {}}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {item.icon}
                                    </motion.div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-[#374151] truncate">
                                            {item.emoji} {item.label}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-[#9CA3AF] leading-relaxed pl-[52px]">{item.description}</p>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Selected count */}
            <AnimatePresence>
                {selected.length > 0 && !selected.includes('none') && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-6"
                    >
                        <div className="bg-gradient-to-r from-[#EF4444]/10 to-[#EC4899]/10 rounded-2xl p-5 border border-[#EF4444]/15">
                            <p className="text-sm text-[#374151] text-center">
                                ⚠️ <strong className="text-[#EF4444]">{selected.length}</strong> {t('onboarding.sensSelection')}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Buttons */}
            <motion.div
                className="flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
            >
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeft className="w-5 h-5" />
                    {t('onboarding.back')}
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={selected.length === 0}>
                    {t('onboarding.next')}
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </motion.div>
        </motion.div>
    );
}
