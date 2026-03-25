import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Sun, Layers, Snowflake, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '../button';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface SkinTypeQuizStepProps {
    onNext: (data: { skinType: string }) => void;
    onBack: () => void;
    initialValue?: string;
}

const skinTypes = [
    {
        id: 'normal',
        label: 'Normale',
        emoji: '✨',
        icon: <Sparkles className="w-8 h-8" />,
        description: 'Peau équilibrée, ni trop grasse ni trop sèche',
        details: 'Texture uniforme, pores peu visibles, teint lumineux',
        gradient: 'from-[#10B981] to-[#34D399]',
        lightBg: '#ECFDF5',
        color: '#10B981',
    },
    {
        id: 'oily',
        label: 'Grasse',
        emoji: '💧',
        icon: <Droplets className="w-8 h-8" />,
        description: 'Peau qui brille, surtout en zone T',
        details: 'Pores dilatés, brillance excessive, tendance acnéique',
        gradient: 'from-[#F59E0B] to-[#FBBF24]',
        lightBg: '#FFFBEB',
        color: '#F59E0B',
    },
    {
        id: 'dry',
        label: 'Sèche',
        emoji: '🏜️',
        icon: <Sun className="w-8 h-8" />,
        description: 'Peau qui tiraille et manque d\'hydratation',
        details: 'Sensations de tiraillement, desquamation, teint terne',
        gradient: 'from-[#EF4444] to-[#F87171]',
        lightBg: '#FEF2F2',
        color: '#EF4444',
    },
    {
        id: 'combination',
        label: 'Mixte',
        emoji: '⚖️',
        icon: <Layers className="w-8 h-8" />,
        description: 'Zone T grasse et joues sèches ou normales',
        details: 'Front, nez et menton gras, joues normales à sèches',
        gradient: 'from-[#8B5CF6] to-[#A78BFA]',
        lightBg: '#F5F3FF',
        color: '#8B5CF6',
    },
    {
        id: 'sensitive',
        label: 'Sensible',
        emoji: '🌸',
        icon: <Snowflake className="w-8 h-8" />,
        description: 'Peau réactive qui rougit facilement',
        details: 'Rougeurs, irritations fréquentes, picotements',
        gradient: 'from-[#EC4899] to-[#F472B6]',
        lightBg: '#FDF2F8',
        color: '#EC4899',
    },
];

export function SkinTypeQuizStep({ onNext, onBack, initialValue }: SkinTypeQuizStepProps) {
    const { t } = useAccessibilityStore();
    const [selected, setSelected] = useState<string>(initialValue || '');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Dynamic translation access
    const skinTypeLabels = t('onboarding.skinTypesLabels') as Record<string, string>;

    const handleSubmit = () => {
        if (selected) {
            onNext({ skinType: selected });
        }
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
                    className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                    <Droplets className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-extrabold mb-3 text-[#111827]">
                    {t('onboarding.skinTitle')}
                </h2>
                <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
                    {t('onboarding.skinSub')}
                </p>
            </motion.div>

            {/* Skin Type Cards */}
            <div className="grid gap-4 mb-8">
                {skinTypes.map((type, index) => {
                    const isSelected = selected === type.id;
                    const isHovered = hoveredId === type.id;

                    return (
                        <motion.button
                            key={type.id}
                            type="button"
                            onClick={() => setSelected(type.id)}
                            onMouseEnter={() => setHoveredId(type.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 200, damping: 25 }}
                            className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                    ? 'border-[#0EA5E9] shadow-xl shadow-[#0EA5E9]/15'
                                    : 'border-[#E5E7EB] hover:border-[#0EA5E9]/40 hover:shadow-lg'
                                }`}
                            style={{
                                backgroundColor: isSelected ? type.lightBg : isHovered ? `${type.lightBg}80` : 'white',
                            }}
                        >
                            <div className="flex items-center gap-5">
                                {/* Icon */}
                                <motion.div
                                    className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-white shadow-lg`}
                                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        boxShadow: isSelected ? `0 8px 25px ${type.color}40` : undefined,
                                    }}
                                >
                                    {type.icon}
                                </motion.div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{type.emoji}</span>
                                        <h3 className="text-lg font-bold text-[#111827]">{skinTypeLabels[type.id] || type.label}</h3>
                                    </div>
                                    <p className="text-[#6B7280] text-sm mb-1">{type.description}</p>
                                    <AnimatePresence>
                                        {(isSelected || isHovered) && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs text-[#9CA3AF] mt-1"
                                            >
                                                {type.details}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Checkmark */}
                                <div className="flex-shrink-0">
                                    <motion.div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected
                                                ? 'bg-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/30'
                                                : 'border-2 border-[#E5E7EB]'
                                            }`}
                                        animate={isSelected ? { scale: [0.8, 1.2, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 300 }}
                                            >
                                                <Check className="w-5 h-5 text-white" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Help banner */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-[#0EA5E9]/5 to-[#8B5CF6]/5 rounded-2xl p-5 mb-8 border border-[#0EA5E9]/10"
            >
                <p className="text-sm text-[#374151] text-center">
                    {t('onboarding.skinHelp')}
                </p>
            </motion.div>

            {/* Buttons */}
            <motion.div
                className="flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeft className="w-5 h-5" />
                    {t('onboarding.back')}
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={!selected}>
                    {t('onboarding.next')}
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </motion.div>
        </motion.div>
    );
}
