import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Sparkles, CheckCircle, Loader, ArrowLeft, ArrowRight,
    Droplets, Sun, AlertCircle, ShieldAlert, Heart
} from 'lucide-react';
import { Button } from '../button';
import { useAccessibilityStore } from '../../../stores/accessibility.store';

interface SummaryStepProps {
    data: {
        skinType?: string;
        fitzpatrickType?: number;
        concerns?: string[];
        sensitivities?: string[];
    };
    onSubmit: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    submitLabel?: string;
}

export function SummaryStep({ data, onSubmit, onBack, isSubmitting, submitLabel }: SummaryStepProps) {
    const { t } = useAccessibilityStore();
    const [showConfetti, setShowConfetti] = useState(false);

    // Dynamic translations
    const skinTypeLabels: Record<string, string> = t('onboarding.skinTypesLabels') as Record<string, string>;
    const fitzpatrickLabels: Record<string, string> = t('onboarding.fitzTypesLabels') as Record<string, string>;
    const categories = t('onboarding.categories') as unknown as string[];

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(true), 600);
        return () => clearTimeout(timer);
    }, []);

    const sections = [
        {
            icon: <Droplets className="w-5 h-5" />,
            label: categories[0],
            value: data.skinType ? skinTypeLabels[data.skinType] || data.skinType : t('onboarding.notProvided'),
            gradient: 'from-[#0EA5E9] to-[#06B6D4]',
            color: '#0EA5E9',
        },
        {
            icon: <Sun className="w-5 h-5" />,
            label: categories[1],
            value: data.fitzpatrickType ? fitzpatrickLabels[data.fitzpatrickType.toString()] || `Type ${data.fitzpatrickType}` : t('onboarding.notProvided'),
            gradient: 'from-[#F59E0B] to-[#FBBF24]',
            color: '#F59E0B',
        },
        {
            icon: <AlertCircle className="w-5 h-5" />,
            label: categories[2],
            value: data.concerns && data.concerns.length > 0
                ? data.concerns.join(', ')
                : t('onboarding.none'),
            gradient: 'from-[#EC4899] to-[#F472B6]',
            color: '#EC4899',
        },
        {
            icon: <ShieldAlert className="w-5 h-5" />,
            label: categories[3],
            value: data.sensitivities && data.sensitivities.length > 0
                ? data.sensitivities.join(', ')
                : t('onboarding.none'),
            gradient: 'from-[#EF4444] to-[#F87171]',
            color: '#EF4444',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-3xl mx-auto"
        >
            {/* Confetti-like particles */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                                left: `${10 + Math.random() * 80}%`,
                                top: '-5%',
                                backgroundColor: [
                                    '#0EA5E9', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'
                                ][i % 6],
                            }}
                            animate={{
                                y: ['0vh', '110vh'],
                                x: [0, (Math.random() - 0.5) * 200],
                                rotate: [0, 720],
                                opacity: [1, 0],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                delay: Math.random() * 0.8,
                                ease: 'easeIn',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Header */}
            <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div
                    className="relative w-20 h-20 mx-auto mb-6"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#34D399] blur-xl opacity-30" />
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-xl">
                        <Heart className="w-10 h-10 text-white" />
                    </div>
                </motion.div>
                <h2 className="text-3xl font-extrabold mb-3 text-[#111827]">
                    {t('onboarding.sumTitle')}
                </h2>
                <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
                    {t('onboarding.sumSub')}
                </p>
            </motion.div>

            {/* Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 mb-8"
            >
                <div className="space-y-5">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/50 hover:border-[#0EA5E9]/20 transition-colors"
                        >
                            <div
                                className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white shadow-md`}
                            >
                                {section.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">
                                    {section.label}
                                </div>
                                <div className="text-base font-medium text-[#111827] leading-relaxed capitalize">
                                    {section.value}
                                </div>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8 + index * 0.1, type: 'spring' }}
                            >
                                <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-1" />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Privacy note */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 bg-[#F9FAFB] rounded-full px-5 py-2.5 border border-[#E5E7EB]">
                    <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                    <span className="text-xs text-[#6B7280]">
                        {t('onboarding.sumPrivacy')}
                    </span>
                </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
                className="flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
            >
                <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
                    <ArrowLeft className="w-5 h-5" />
                    {t('onboarding.sumModify')}
                </Button>
                <Button onClick={onSubmit} className="flex-1 shadow-lg shadow-[#0EA5E9]/20" loading={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" />
                            {t('onboarding.sumSave')}
                        </>
                    ) : (
                        <>
                            {submitLabel || t('onboarding.sumConfirm')}
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </motion.div>
        </motion.div>
    );
}
