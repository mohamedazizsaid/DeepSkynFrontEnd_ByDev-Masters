import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
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

    return (
        <div className="min-h-screen relative" style={{ zIndex: 1 }}>
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#E5E7EB]">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                            DeepSkyn
                        </span>
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Contextual buttons could go here, for now keeping it simple */}
                        <Button variant="ghost" className="hidden sm:flex" onClick={() => navigate('/')}>
                            Retour à l'accueil
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

                {/* Left Side - Form */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md flex-shrink-0"
                >
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
                        <div className="mb-8 text-center sm:text-left">
                            <h1 className="text-3xl font-extrabold text-[#111827] mb-3 tracking-tight">{title}</h1>
                            <p className="text-[#6B7280]">{subtitle}</p>
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
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[600px] border-[8px] border-white">
                        <img
                            className="absolute inset-0 h-full w-full object-cover"
                            src={imageSrc || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2574&auto=format&fit=crop"}
                            alt="DeepSkyn Experience"
                        />
                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 via-transparent to-transparent" />

                        {/* Context Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full mb-4 border border-white/10">
                                    <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                                    <span className="text-sm font-medium">Technologie IA Avancée</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3 leading-snug">
                                    "Une analyse de peau précise pour des résultats visibles."
                                </h3>
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((i) => (
                                            <img key={i} src={`https://i.pravatar.cc/100?img=${i + 20}`} className="w-8 h-8 rounded-full border-2 border-slate-900" alt="User" />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-white/80">+10k utilisateurs satisfaits</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
