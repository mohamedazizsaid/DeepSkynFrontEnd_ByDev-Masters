import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft, ArrowRight, Check,
    AlertCircle, Waves, Sun, Sparkles,
    Wind, Eye, Droplets, Zap, Palette, Heart
} from 'lucide-react';
import { Button } from '../button';

interface ConcernsStepProps {
    onNext: (data: { concerns: string[] }) => void;
    onBack: () => void;
    initialValue?: string[];
}

const concerns = [
    {
        id: 'acne',
        label: 'Acné & Boutons',
        emoji: '🔴',
        icon: <AlertCircle className="w-6 h-6" />,
        gradient: 'from-[#EF4444] to-[#F87171]',
        color: '#EF4444',
        lightBg: '#FEF2F2',
    },
    {
        id: 'wrinkles',
        label: 'Rides & Ridules',
        emoji: '〰️',
        icon: <Waves className="w-6 h-6" />,
        gradient: 'from-[#8B5CF6] to-[#A78BFA]',
        color: '#8B5CF6',
        lightBg: '#F5F3FF',
    },
    {
        id: 'dark-spots',
        label: 'Taches Brunes',
        emoji: '🟤',
        icon: <Sun className="w-6 h-6" />,
        gradient: 'from-[#F59E0B] to-[#FBBF24]',
        color: '#F59E0B',
        lightBg: '#FFFBEB',
    },
    {
        id: 'dryness',
        label: 'Sécheresse',
        emoji: '🏜️',
        icon: <Droplets className="w-6 h-6" />,
        gradient: 'from-[#06B6D4] to-[#22D3EE]',
        color: '#06B6D4',
        lightBg: '#ECFEFF',
    },
    {
        id: 'sensitivity',
        label: 'Sensibilité',
        emoji: '🌸',
        icon: <Heart className="w-6 h-6" />,
        gradient: 'from-[#EC4899] to-[#F472B6]',
        color: '#EC4899',
        lightBg: '#FDF2F8',
    },
    {
        id: 'redness',
        label: 'Rougeurs',
        emoji: '🔴',
        icon: <Zap className="w-6 h-6" />,
        gradient: 'from-[#FB7185] to-[#FDA4AF]',
        color: '#FB7185',
        lightBg: '#FFF1F2',
    },
    {
        id: 'large-pores',
        label: 'Pores Dilatés',
        emoji: '🔵',
        icon: <Wind className="w-6 h-6" />,
        gradient: 'from-[#14B8A6] to-[#2DD4BF]',
        color: '#14B8A6',
        lightBg: '#F0FDFA',
    },
    {
        id: 'dark-circles',
        label: 'Cernes',
        emoji: '👁️',
        icon: <Eye className="w-6 h-6" />,
        gradient: 'from-[#6366F1] to-[#818CF8]',
        color: '#6366F1',
        lightBg: '#EEF2FF',
    },
    {
        id: 'uneven-texture',
        label: 'Texture Irrégulière',
        emoji: '✋',
        icon: <Sparkles className="w-6 h-6" />,
        gradient: 'from-[#D946EF] to-[#E879F9]',
        color: '#D946EF',
        lightBg: '#FAF5FF',
    },
    {
        id: 'dullness',
        label: 'Teint Terne',
        emoji: '😶',
        icon: <Palette className="w-6 h-6" />,
        gradient: 'from-[#A855F7] to-[#C084FC]',
        color: '#A855F7',
        lightBg: '#FAF5FF',
    },
    {
        id: 'hyperpigmentation',
        label: 'Hyperpigmentation',
        emoji: '🎨',
        icon: <Sun className="w-6 h-6" />,
        gradient: 'from-[#D97706] to-[#F59E0B]',
        color: '#D97706',
        lightBg: '#FFFBEB',
    },
    {
        id: 'oiliness',
        label: 'Excès de Sébum',
        emoji: '💧',
        icon: <Droplets className="w-6 h-6" />,
        gradient: 'from-[#0EA5E9] to-[#38BDF8]',
        color: '#0EA5E9',
        lightBg: '#F0F9FF',
    },
];

export function ConcernsStep({ onNext, onBack, initialValue }: ConcernsStepProps) {
    const [selectedConcerns, setSelectedConcerns] = useState<string[]>(initialValue || []);

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
                    className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center shadow-lg shadow-[#EC4899]/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                    <AlertCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-extrabold mb-3 text-[#111827]">
                    Quelles sont vos préoccupations ?
                </h2>
                <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
                    Sélectionnez toutes celles qui vous concernent
                </p>
            </motion.div>

            {/* Concerns Grid */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {concerns.map((concern, index) => {
                        const isSelected = selectedConcerns.includes(concern.id);

                        return (
                            <motion.button
                                key={concern.id}
                                type="button"
                                onClick={() => toggleConcern(concern.id)}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.04, type: 'spring', stiffness: 200, damping: 20 }}
                                whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${isSelected
                                        ? 'border-[#0EA5E9] shadow-lg'
                                        : 'border-[#E5E7EB] hover:border-[#0EA5E9]/40'
                                    }`}
                                style={{
                                    backgroundColor: isSelected ? concern.lightBg : 'white',
                                }}
                            >
                                {/* Selection badge */}
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

                                <motion.div
                                    className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${concern.gradient} flex items-center justify-center text-white shadow-md`}
                                    animate={isSelected ? { rotate: [0, -5, 5, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        boxShadow: isSelected ? `0 4px 15px ${concern.color}30` : undefined,
                                    }}
                                >
                                    {concern.icon}
                                </motion.div>

                                <div className="text-sm font-semibold text-center text-[#374151]">
                                    {concern.emoji} {concern.label}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Counter */}
            <AnimatePresence>
                {selectedConcerns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-6"
                    >
                        <div className="bg-gradient-to-r from-[#0EA5E9]/10 to-[#8B5CF6]/10 rounded-2xl p-5 border border-[#0EA5E9]/15">
                            <p className="text-sm text-[#374151] text-center">
                                ✨ Vous avez sélectionné <strong className="text-[#0EA5E9]">{selectedConcerns.length}</strong> préoccupation{selectedConcerns.length > 1 ? 's' : ''}.
                                Nous personnaliserons votre routine en conséquence.
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
                    Retour
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={selectedConcerns.length === 0}>
                    Continuer
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </motion.div>
        </motion.div>
    );
}
