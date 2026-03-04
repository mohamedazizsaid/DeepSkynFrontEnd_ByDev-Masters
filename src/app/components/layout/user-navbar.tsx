import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard,
    Scan,
    TrendingUp,
    Calendar,
    MessageCircle,
    CreditCard,
    User,
    Settings,
    Sparkles,
    LogOut,
    Users,
    Bell,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import { useNotificationStore } from '../../../stores/notification.store';
import { Button } from '../button';

interface UserNavbarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout?: () => void;
    onToggleNotifications?: () => void;
    user?: { name: string; avatar?: string } | null;
}

export function UserNavbar({ currentPage, onNavigate, onLogout, onToggleNotifications, user }: UserNavbarProps) {
    const { unreadCount } = useNotificationStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const mainItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'analysis', label: 'Analyse', icon: <Scan className="w-5 h-5" /> },
        { id: 'routine', label: 'Routine', icon: <Calendar className="w-5 h-5" /> },
        { id: 'chat', label: 'Coach IA', icon: <MessageCircle className="w-5 h-5" /> },
    ];

    const secondaryItems = [
        { id: 'evolution', label: 'Évolution', icon: <TrendingUp className="w-5 h-5" /> },
        { id: 'community', label: 'Communauté', icon: <Users className="w-5 h-5" /> },
        { id: 'subscription', label: 'Abonnement', icon: <CreditCard className="w-5 h-5" /> },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => onNavigate('dashboard')}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center mr-2 shadow-lg shadow-[#0EA5E9]/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent hidden sm:block">
                                DeepSkyn
                            </span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex lg:space-x-1 lg:ml-10 items-center">
                            {mainItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === item.id
                                            ? 'text-[#0EA5E9] bg-blue-50'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}

                            {/* More Dropdown could go here, but I'll put secondary items in Profile or separate */}
                            <div className="h-6 w-px bg-gray-200 mx-2" />

                            {secondaryItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === item.id
                                            ? 'text-[#0EA5E9] bg-blue-50'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {item.icon}
                                    {/* Icon only for secondary items to save space? No, labels fit on LG screens */}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Notifications */}
                        {onToggleNotifications && (
                            <button
                                onClick={onToggleNotifications}
                                className="p-2 text-gray-400 hover:text-gray-500 relative rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="View notifications"
                            >
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </button>
                        )}

                        {/* Profile Dropdown */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                            >
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] p-[2px]">
                                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none z-50 origin-top-right"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Utilisateur'}</p>
                                            <p className="text-xs text-gray-500 truncate">Membre Premium</p>
                                        </div>

                                        <div className="py-1">
                                            <button onClick={() => { onNavigate('profile'); setIsProfileOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                <User className="mr-3 h-4 w-4 text-gray-400" /> Profil
                                            </button>
                                            <button onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                <Settings className="mr-3 h-4 w-4 text-gray-400" /> Paramètres
                                            </button>
                                        </div>

                                        <div className="border-t border-gray-100 py-1">
                                            <button onClick={() => { onLogout?.(); setIsProfileOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                <LogOut className="mr-3 h-4 w-4 text-red-500" /> Déconnexion
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center lg:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0EA5E9]"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-gray-100 bg-white"
                    >
                        <div className="pt-2 pb-3 space-y-1">
                            {[...mainItems, ...secondaryItems].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                                    className={`flex w-full items-center border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors ${currentPage === item.id
                                            ? 'bg-blue-50 border-[#0EA5E9] text-[#0EA5E9]'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
