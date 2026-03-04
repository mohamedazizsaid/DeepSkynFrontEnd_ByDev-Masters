import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { Button } from '../button';

interface FitzpatrickStepProps {
    onNext: (data: { fitzpatrickType: number }) => void;
    onBack: () => void;
    initialValue?: number;
}

const fitzpatrickTypes = [
    {
        type: 1,
        label: 'Type I',
        emoji: '👩🏻',
        shortDesc: 'Très claire',
        description: 'Brûle toujours, ne bronze jamais',
        details: 'Peau très pâle, taches de rousseur, cheveux roux/blonds, yeux clairs',
        skinColor: '#FDEBD0',
        borderColor: '#F5CBA7',
        spf: 'SPF 50+ indispensable',
    },
    {
        type: 2,
        label: 'Type II',
        emoji: '👩🏻',
        shortDesc: 'Claire',
        description: 'Brûle facilement, bronze légèrement',
        details: 'Peau claire, cheveux blonds à châtains, yeux clairs',
        skinColor: '#FAD7A0',
        borderColor: '#F0C27A',
        spf: 'SPF 50 recommandé',
    },
    {
        type: 3,
        label: 'Type III',
        emoji: '👩🏽',
        shortDesc: 'Intermédiaire',
        description: 'Brûle modérément, bronze graduellement',
        details: 'Peau mate claire, cheveux châtains, yeux noisette',
        skinColor: '#E8C495',
        borderColor: '#D4A76A',
        spf: 'SPF 30-50 recommandé',
    },
    {
        type: 4,
        label: 'Type IV',
        emoji: '👩🏽',
        shortDesc: 'Mate',
        description: 'Brûle rarement, bronze facilement',
        details: 'Peau mate, cheveux bruns/noirs, yeux bruns',
        skinColor: '#D4A76A',
        borderColor: '#C19A6B',
        spf: 'SPF 30 recommandé',
    },
    {
        type: 5,
        label: 'Type V',
        emoji: '👩🏾',
        shortDesc: 'Foncée',
        description: 'Brûle très rarement, bronze très facilement',
        details: 'Peau brune, cheveux noirs, yeux bruns foncés',
        skinColor: '#A67B5B',
        borderColor: '#8C6744',
        spf: 'SPF 15-30 recommandé',
    },
    {
        type: 6,
        label: 'Type VI',
        emoji: '👩🏿',
        shortDesc: 'Très foncée',
        description: 'Ne brûle jamais, pigmentation profonde',
        details: 'Peau très foncée, cheveux noirs, yeux très foncés',
        skinColor: '#795548',
        borderColor: '#5D4037',
        spf: 'SPF 15 minimum',
    },
];

export function FitzpatrickStep({ onNext, onBack, initialValue }: FitzpatrickStepProps) {
    const [selected, setSelected] = useState<number | null>(initialValue || null);
    const [showInfo, setShowInfo] = useState(false);

    const handleSubmit = () => {
        if (selected !== null) {
            onNext({ fitzpatrickType: selected });
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
                    className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-[#F59E0B]/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                    <Sun className="w-8 h-8 text-white" />
                </motion.div>
                <div className="flex items-center justify-center gap-2 mb-3">
                    <h2 className="text-3xl font-extrabold text-[#111827]">
                        Votre Phototype Fitzpatrick
                    </h2>
                    <motion.button
                        onClick={() => setShowInfo(!showInfo)}
                        className="text-[#9CA3AF] hover:text-[#0EA5E9] transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <HelpCircle className="w-5 h-5" />
                    </motion.button>
                </div>
                <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
                    Identifiez votre sensibilité solaire pour des conseils SPF personnalisés
                </p>
            </motion.div>

            {/* Info tooltip */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#FBBF24]/10 rounded-2xl p-5 border border-[#F59E0B]/20">
                            <p className="text-sm text-[#374151]">
                                <strong>L'échelle de Fitzpatrick</strong> est une classification dermatologique qui évalue la réponse de votre peau au soleil.
                                Elle aide à déterminer votre risque de coup de soleil et les mesures de protection solaire appropriées.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fitzpatrick Type Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {fitzpatrickTypes.map((type, index) => {
                    const isSelected = selected === type.type;

                    return (
                        <motion.button
                            key={type.type}
                            type="button"
                            onClick={() => setSelected(type.type)}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.07, type: 'spring', stiffness: 200, damping: 20 }}
                            whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                    ? 'border-[#0EA5E9] shadow-xl'
                                    : 'border-[#E5E7EB] hover:border-[#0EA5E9]/40 hover:shadow-md bg-white'
                                }`}
                        >
                            {/* Selection badge */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-[#0EA5E9] rounded-full flex items-center justify-center shadow-lg shadow-[#0EA5E9]/30 z-10"
                                >
                                    <Check className="w-4 h-4 text-white" />
                                </motion.div>
                            )}

                            {/* Skin color swatch */}
                            <div className="flex items-center gap-3 mb-3">
                                <motion.div
                                    className="w-12 h-12 rounded-xl shadow-inner border-2"
                                    style={{
                                        backgroundColor: type.skinColor,
                                        borderColor: type.borderColor,
                                    }}
                                    animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                                    transition={{ duration: 0.4 }}
                                />
                                <div>
                                    <div className="text-sm font-bold text-[#111827]">{type.label}</div>
                                    <div className="text-xs text-[#6B7280]">{type.shortDesc}</div>
                                </div>
                            </div>

                            <p className="text-xs text-[#374151] mb-2 leading-relaxed">{type.description}</p>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <p className="text-xs text-[#9CA3AF] mb-2">{type.details}</p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
                                            <span className="text-xs font-medium text-[#F59E0B]">{type.spf}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Skip option */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center mb-6"
            >
                <button
                    onClick={() => onNext({ fitzpatrickType: 0 })}
                    className="text-sm text-[#9CA3AF] hover:text-[#0EA5E9] transition-colors underline underline-offset-4"
                >
                    Je ne suis pas sûr(e), passer cette étape
                </button>
            </motion.div>

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
                <Button onClick={handleSubmit} className="flex-1" disabled={selected === null}>
                    Continuer
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </motion.div>
        </motion.div>
    );
}
