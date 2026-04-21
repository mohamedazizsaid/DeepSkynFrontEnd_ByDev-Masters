import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    imageSrc?: string;
}

export function AuthLayout({ children, title, subtitle, imageSrc }: AuthLayoutProps) {
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    // Logo Animation State
    const fullLogoText = 'DeepSkyn';
    const [visibleLogoText, setVisibleLogoText] = useState('');
    const [logoLoopKey, setLogoLoopKey] = useState(0);
    const [isNavIconShifted, setIsNavIconShifted] = useState(false);

    useEffect(() => {
        if (shouldReduceMotion) {
            setVisibleLogoText(fullLogoText);
            setIsNavIconShifted(true);
            return;
        }

        setVisibleLogoText('');
        setIsNavIconShifted(false);
        const charDelay = 60;
        const holdDelay = 5000;
        const timeouts: NodeJS.Timeout[] = [];

        const type = (index: number) => {
            if (index <= fullLogoText.length) {
                setVisibleLogoText(fullLogoText.slice(0, index));
                timeouts.push(setTimeout(() => type(index + 1), charDelay));
            } else {
                timeouts.push(setTimeout(() => {
                    setLogoLoopKey(prev => prev + 1);
                }, holdDelay));
            }
        };

        timeouts.push(setTimeout(() => {
            setIsNavIconShifted(true);
            timeouts.push(setTimeout(() => type(1), 500));
        }, 1000));

        return () => timeouts.forEach(clearTimeout);
    }, [logoLoopKey, shouldReduceMotion]);

    // Title Animation State
    const [visibleTitleText, setVisibleTitleText] = useState('');
    const [titleLoopKey, setTitleLoopKey] = useState(0);

    useEffect(() => {
        if (shouldReduceMotion) {
            setVisibleTitleText(title);
            return;
        }

        setVisibleTitleText('');
        const charDelay = 45;
        const holdDelay = 5000;
        const timeouts: NodeJS.Timeout[] = [];

        const type = (index: number) => {
            if (index <= title.length) {
                setVisibleTitleText(title.slice(0, index));
                timeouts.push(setTimeout(() => type(index + 1), charDelay));
            } else {
                timeouts.push(setTimeout(() => {
                    setTitleLoopKey(prev => prev + 1);
                }, holdDelay));
            }
        };

        timeouts.push(setTimeout(() => type(1), 150));

        return () => timeouts.forEach(clearTimeout);
    }, [title, shouldReduceMotion, titleLoopKey]);

    const defaultImage = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2574&auto=format&fit=crop&crop=entropy&cs=tinysrgb";

    const floatingBadges = [
        {
            text: 'Analyse complete',
            className: 'top-10 left-8',
            delay: 0,
            duration: 9,
        },
        {
            text: 'Routine personnalisee',
            className: 'top-24 right-8',
            delay: 0.1,
            duration: 10.2,
        },
        {
            text: 'Resultats en 60 sec',
            className: 'top-1/2 left-10',
            delay: 0.2,
            duration: 11,
        },
    ];

    const decorDots = [
        { className: 'left-[6%] top-[20%] h-24 w-24 bg-[#3BBDF4]/12' },
        { className: 'left-[38%] top-[12%] h-40 w-40 bg-[#F472B6]/12' },
        { className: 'right-[14%] top-[28%] h-28 w-28 bg-[#3BBDF4]/15' },
        { className: 'right-[8%] bottom-[14%] h-44 w-44 bg-[#FADADD]/35' },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#F0F6FF] via-[#E8F3FF] to-[#F0F6FF] dark:from-[#0f172a] dark:via-[#1a2844] dark:to-[#16213e]" style={{ zIndex: 1, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
            <div className="pointer-events-none absolute inset-0">
                {decorDots.map((dot, index) => (
                    <motion.div
                        key={dot.className}
                        className={`absolute rounded-full blur-2xl ${dot.className}`}
                        animate={{ y: [0, -14, 0], x: [0, index % 2 === 0 ? 7 : -7, 0] }}
                        transition={{ duration: 8 + index, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/40 dark:border-white/10 bg-white/75 dark:bg-[#1a2844]/75 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 cursor-pointer min-w-[150px] hover:opacity-90 transition-opacity"
                    >
                        <motion.div 
                            animate={{ x: isNavIconShifted ? 0 : 40 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20 overflow-hidden"
                        >
                            <motion.div
                                animate={{ 
                                    rotate: [-10, 10, -10, 10, 0],
                                    scale: [1, 1.1, 1, 1.1, 1]
                                }}
                                transition={{ 
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatDelay: 2,
                                    ease: "easeInOut"
                                }}
                            >
                                <Sparkles className="w-5 h-5 text-white" />
                            </motion.div>
                        </motion.div>
                        <span className="text-2xl font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent flex items-center">
                            {visibleLogoText}
                            {visibleLogoText.length > 0 && visibleLogoText.length < fullLogoText.length && (
                                <motion.span
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block ml-0.5 text-[#0EA5E9]"
                                >
                                    |
                                </motion.span>
                            )}
                        </span>
                    </button>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="hidden sm:flex text-gray-900 dark:text-gray-100" onClick={() => navigate('/')}>
                            Retour à l'accueil
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 relative z-10">

                {/* Left Side - Form */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md flex-shrink-0"
                >
                    <div className="bg-white/92 dark:bg-[#1a2844]/92 rounded-3xl shadow-[0_30px_70px_-35px_rgba(59,189,244,0.45)] dark:shadow-[0_30px_70px_-35px_rgba(14,165,233,0.15)] border border-white/60 dark:border-white/10 p-8 sm:p-10 backdrop-blur-xl">
                        <div className="mb-8 text-center sm:text-left">
                            <h1 className="text-3xl font-extrabold text-[#1A1A2E] dark:text-white mb-3 tracking-tight leading-[1.2] min-h-[36px]">
                                {visibleTitleText}
                                {visibleTitleText.length < title.length && !shouldReduceMotion && (
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="inline-block ml-1 text-[#0EA5E9]"
                                    >
                                        |
                                    </motion.span>
                                )}
                            </h1>
                            <p className="text-[#475569] dark:text-gray-400 leading-relaxed">{subtitle}</p>
                        </div>
                        {children}
                    </div>
                </motion.div>

                {/* Right Side - Image & Context */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-lg lg:max-w-xl hidden lg:block"
                >
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_35px_80px_-35px_rgba(26,26,46,0.55)] dark:shadow-[0_35px_80px_-35px_rgba(0,0,0,0.8)] h-[600px] border-[8px] border-white/85 dark:border-gray-700/85 bg-gradient-to-br from-[#F0F6FF] to-[#E8F3FF] dark:from-[#1a2844] dark:to-[#16213e]">
                        {!imageError ? (
                            <img
                                className="absolute inset-0 h-full w-full object-cover"
                                src={imageSrc || defaultImage}
                                alt="DeepSkyn Experience"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-[#F0F6FF] via-[#E8F3FF] to-[#F0F6FF] dark:from-[#1a2844] dark:via-[#1a3a52] dark:to-[#162335] flex items-center justify-center">
                                <div className="text-center text-[#64748B] dark:text-gray-400">
                                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">Image en cours de chargement...</p>
                                </div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/10 via-transparent to-[#1A1A2E]/72" />

                        {floatingBadges.map((badge) => (
                            <motion.div
                                key={badge.text}
                                className={`absolute ${badge.className} rounded-full border border-white/45 bg-white/30 px-4 py-2 text-xs font-semibold text-white backdrop-blur-lg shadow-lg`}
                                initial={{ opacity: 0, y: 8, x: 0 }}
                                animate={{ opacity: 1, y: [-8, 8, -8], x: [-3, 3, -3] }}
                                transition={{
                                    opacity: { delay: 0.4 + badge.delay, duration: 0.55 },
                                    y: { delay: 0.4 + badge.delay + 0.55, duration: badge.duration, repeat: Infinity, ease: 'easeInOut' },
                                    x: { delay: 0.4 + badge.delay + 0.55, duration: badge.duration, repeat: Infinity, ease: 'easeInOut' }
                                }}
                            >
                                {badge.text}
                            </motion.div>
                        ))}

                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <motion.div
                                initial={{ y: 22, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="rounded-3xl border border-white/35 bg-white/18 p-6 backdrop-blur-xl shadow-[0_20px_45px_-30px_rgba(0,0,0,0.8)]"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3BBDF4]/20 rounded-full mb-4 border border-white/25">
                                    <Sparkles className="w-4 h-4 text-[#7DD3FC]" />
                                    <span className="text-xs font-semibold tracking-wide uppercase">Diagnostic IA premium</span>
                                </div>
                                <h3 className="text-xl font-bold leading-snug">
                                    "DeepSkyn a transforme ma routine: plus simple, plus precise, et vraiment adaptee a ma peau."
                                </h3>
                                <p className="mt-3 text-sm text-white/80">Sarah L., cliente depuis 8 mois</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
