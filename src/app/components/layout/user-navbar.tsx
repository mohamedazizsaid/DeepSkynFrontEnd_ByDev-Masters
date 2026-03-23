import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    ChevronDown,
    Eye,
    ChevronLeft,
    Sun,
    Moon,
    ZoomIn,
    ZoomOut,
    Volume2,
    VolumeX,
    Mic,
    MicOff,
    RotateCcw,
    Type,
    Contrast,
    MousePointer,
    Link,
    Space,
    BookOpen,
    Pause,
    Monitor,
} from 'lucide-react';
import { useNotificationStore } from '../../../stores/notification.store';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { Button } from '../button';

interface UserNavbarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout?: () => void;
    onToggleNotifications?: () => void;
    user?: { name: string; avatar?: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Toggle Switch for accessibility panel
// ─────────────────────────────────────────────────────────────────────────────
function ToggleSwitch({
    checked,
    onChange,
    ariaLabel,
}: {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
}) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onChange}
            className={`
                relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full
                transition-colors duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/40 focus:ring-offset-1
                ${checked
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]'
                    : 'bg-gray-300'
                }
            `}
        >
            <span
                className={`
                    pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-md
                    ring-0 transition-transform duration-300 ease-in-out
                    ${checked ? 'translate-x-[20px]' : 'translate-x-[3px]'}
                `}
            />
        </button>
    );
}

export function UserNavbar({ currentPage, onNavigate, onLogout, onToggleNotifications, user }: UserNavbarProps) {
    const { unreadCount } = useNotificationStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showAccessibility, setShowAccessibility] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        theme,
        contrastMode,
        zoomLevel,
        reduceMotion,
        dyslexiaFont,
        linkHighlight,
        bigCursor,
        textSpacing,
        isSpeaking,
        isListening,
        spokenText,
        toggleTheme,
        setContrastMode,
        resetContrastMode,
        toggleReduceMotion,
        toggleDyslexiaFont,
        toggleLinkHighlight,
        toggleBigCursor,
        toggleTextSpacing,
        zoomIn,
        zoomOut,
        resetZoom,
        speak,
        stopSpeaking,
        startListening,
        stopListening,
        clearSpokenText,
    } = useAccessibilityStore();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
                setShowAccessibility(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleReadSelected = useCallback(() => {
        const selection = window.getSelection()?.toString().trim();
        if (selection) {
            speak(selection);
        }
    }, [speak]);

    const handleResetAll = useCallback(() => {
        resetZoom();
        resetContrastMode();
        if (reduceMotion) toggleReduceMotion();
        if (dyslexiaFont) toggleDyslexiaFont();
        if (linkHighlight) toggleLinkHighlight();
        if (bigCursor) toggleBigCursor();
        if (textSpacing) toggleTextSpacing();
        if (isSpeaking) stopSpeaking();
        if (isListening) stopListening();
        clearSpokenText();
        if (theme === 'dark') toggleTheme();
    }, [resetZoom, resetContrastMode, reduceMotion, toggleReduceMotion, dyslexiaFont, toggleDyslexiaFont, linkHighlight, toggleLinkHighlight, bigCursor, toggleBigCursor, textSpacing, toggleTextSpacing, isSpeaking, stopSpeaking, isListening, stopListening, clearSpokenText, theme, toggleTheme]);

    const mainItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ];

    const rightNavItems = [
        { id: 'analysis', label: 'Analyse', icon: <Scan className="w-5 h-5" /> },
        { id: 'routine', label: 'Routine', icon: <Calendar className="w-5 h-5" /> },
        { id: 'chat', label: 'Coach IA', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'community', label: 'Communauté', icon: <Users className="w-5 h-5" /> },
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Right Navigation Items - Desktop Only */}
                        <div className="hidden lg:flex lg:space-x-1 items-center">
                            {rightNavItems.map((item) => (
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
                        </div>

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
                        <div className="relative ml-2" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(!isProfileOpen);
                                    if (isProfileOpen) setShowAccessibility(false);
                                }}
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
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                        className="absolute right-0 mt-3 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-black/5 focus:outline-none z-50 origin-top-right overflow-hidden"
                                        style={{ width: showAccessibility ? '420px' : '340px' }}
                                    >
                                        <AnimatePresence mode="wait">
                                            {!showAccessibility ? (
                                                /* ═══════════════════════════════════════════
                                                   MAIN DROPDOWN MENU
                                                   ═══════════════════════════════════════════ */
                                                <motion.div
                                                    key="main-menu"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {/* User Header */}
                                                    <div className="px-5 pt-5 pb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] p-[2px] shadow-lg shadow-[#0EA5E9]/20">
                                                                <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                                                    {user?.avatar ? (
                                                                        <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <User className="w-5 h-5 text-gray-400" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Utilisateur'}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#0EA5E9]/10 to-[#06B6D4]/10 text-[#0EA5E9]">
                                                                        <Sparkles className="w-2.5 h-2.5" />
                                                                        Premium
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

                                                    {/* Menu Items */}
                                                    <div className="py-2 px-2">
                                                        <button
                                                            onClick={() => { onNavigate('profile'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#0EA5E9]/5 hover:to-[#06B6D4]/5 hover:text-[#0EA5E9] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#0EA5E9]/10 transition-colors duration-200">
                                                                <User className="h-4 w-4 text-gray-500 group-hover:text-[#0EA5E9] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">Profil</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('evolution'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#EC4899]/5 hover:to-[#F43F5E]/5 hover:text-[#EC4899] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#EC4899]/10 transition-colors duration-200">
                                                                <TrendingUp className="h-4 w-4 text-gray-500 group-hover:text-[#EC4899] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">Évolution</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('subscription'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#F59E0B]/5 hover:to-[#FCD34D]/5 hover:text-[#F59E0B] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#F59E0B]/10 transition-colors duration-200">
                                                                <CreditCard className="h-4 w-4 text-gray-500 group-hover:text-[#F59E0B] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">Abonnement</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('settings'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#8B5CF6]/5 hover:to-[#6366F1]/5 hover:text-[#8B5CF6] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#8B5CF6]/10 transition-colors duration-200">
                                                                <Settings className="h-4 w-4 text-gray-500 group-hover:text-[#8B5CF6] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">Paramètres</span>
                                                        </button>

                                                        <button
                                                            onClick={() => setShowAccessibility(true)}
                                                            className="flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#06B6D4]/5 hover:to-[#0EA5E9]/5 hover:text-[#06B6D4] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#06B6D4]/10 transition-colors duration-200">
                                                                    <Monitor className="h-4 w-4 text-gray-500 group-hover:text-[#06B6D4] transition-colors duration-200" />
                                                                </div>
                                                                <span className="font-medium">Affichage & Accessibilité</span>
                                                            </div>
                                                            <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-[#06B6D4] transition-colors duration-200" />
                                                        </button>
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

                                                    {/* Logout */}
                                                    <div className="py-2 px-2 pb-3">
                                                        <button
                                                            onClick={() => { onLogout?.(); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors duration-200">
                                                                <LogOut className="h-4 w-4 text-red-500" />
                                                            </div>
                                                            <span className="font-medium">Déconnexion</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                /* ═══════════════════════════════════════════
                                                   ACCESSIBILITY PANEL (INSIDE DROPDOWN)
                                                   ═══════════════════════════════════════════ */
                                                <motion.div
                                                    key="accessibility-panel"
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="max-h-[75vh] overflow-y-auto"
                                                    style={{ fontSize: '16px' }}
                                                >
                                                    {/* Header with back button */}
                                                    <div className="flex items-center gap-3 px-5 pt-5 pb-4 sticky top-0 bg-white/95 backdrop-blur-xl z-10">
                                                        <button
                                                            onClick={() => setShowAccessibility(false)}
                                                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                                        >
                                                            <ChevronLeft className="w-5 h-5" />
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] shadow-sm">
                                                                <Eye className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-gray-900 leading-tight">Affichage & Accessibilité</h3>
                                                                <p className="text-[10px] text-gray-500">Personnalisez votre expérience</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

                                                    <div className="flex flex-col gap-4 p-4">

                                                        {/* ── APPEARANCE ─────────────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <Eye className="w-3 h-3 text-gray-400" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Apparence</span>
                                                            </div>

                                                            {/* Theme Toggle */}
                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                                                                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${theme === 'dark' ? 'bg-indigo-500' : 'bg-amber-400'} shadow-sm`}>
                                                                    {theme === 'dark' ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[13px] font-semibold text-gray-900">Mode sombre</p>
                                                                    <p className="text-[10px] text-gray-500">{theme === 'dark' ? 'Thème sombre activé' : 'Thème clair activé'}</p>
                                                                </div>
                                                                <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} ariaLabel="Basculer le mode sombre" />
                                                            </div>

                                                            {/* Contrast */}
                                                            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                                <div className="flex items-center gap-2 mb-2.5">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-yellow-500/10">
                                                                        <Contrast className="w-3.5 h-3.5 text-yellow-600" />
                                                                    </div>
                                                                    <span className="text-[13px] font-semibold text-gray-900">Contraste élevé</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    {(['off', 'medium', 'high'] as const).map((mode) => {
                                                                        const labels = { off: 'Normal', medium: 'Moyen', high: 'Élevé' };
                                                                        const isActive = contrastMode === mode;
                                                                        const activeStyles = {
                                                                            off: 'bg-gray-800 text-white shadow-md',
                                                                            medium: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25',
                                                                            high: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md shadow-yellow-400/30',
                                                                        };
                                                                        return (
                                                                            <button
                                                                                key={mode}
                                                                                onClick={() => setContrastMode(mode)}
                                                                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 ${isActive ? activeStyles[mode] : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200'}`}
                                                                            >
                                                                                {labels[mode]}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Zoom */}
                                                            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                                <div className="flex items-center justify-between mb-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10">
                                                                            <Type className="w-3.5 h-3.5 text-emerald-600" />
                                                                        </div>
                                                                        <span className="text-[13px] font-semibold text-gray-900">Taille du texte</span>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-full">{zoomLevel}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2.5">
                                                                    <button onClick={zoomOut} disabled={zoomLevel <= 75} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">
                                                                        <ZoomOut className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <div className="flex-1 relative h-[6px] rounded-full bg-gray-200 overflow-hidden">
                                                                        <div
                                                                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] transition-all duration-300 ease-out"
                                                                            style={{ width: `${((zoomLevel - 75) / 75) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <button onClick={zoomIn} disabled={zoomLevel >= 150} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">
                                                                        <ZoomIn className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                {zoomLevel !== 100 && (
                                                                    <button onClick={resetZoom} className="flex items-center justify-center gap-1.5 mt-2 w-full py-1 text-[10px] font-medium text-gray-500 hover:text-[#0EA5E9] rounded-md hover:bg-white transition-all duration-200">
                                                                        <RotateCcw className="w-2.5 h-2.5" /> Réinitialiser à 100%
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </section>

                                                        {/* ── VISION & READING ──────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <BookOpen className="w-3 h-3 text-gray-400" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Vision & lecture</span>
                                                            </div>

                                                            <div className="flex flex-col gap-2">
                                                                {[
                                                                    { icon: Pause, title: 'Réduire les animations', desc: 'Désactive les animations', checked: reduceMotion, onChange: toggleReduceMotion, color: 'bg-teal-500' },
                                                                    { icon: BookOpen, title: 'Police dyslexie', desc: 'Police adaptée dyslexiques', checked: dyslexiaFont, onChange: toggleDyslexiaFont, color: 'bg-pink-500' },
                                                                    { icon: Link, title: 'Souligner les liens', desc: 'Liens toujours visibles', checked: linkHighlight, onChange: toggleLinkHighlight, color: 'bg-blue-500' },
                                                                    { icon: MousePointer, title: 'Grand curseur', desc: 'Curseur plus visible', checked: bigCursor, onChange: toggleBigCursor, color: 'bg-orange-500' },
                                                                    { icon: Space, title: 'Espacement du texte', desc: 'Augmente l\'espacement', checked: textSpacing, onChange: toggleTextSpacing, color: 'bg-lime-500' },
                                                                ].map((feature) => (
                                                                    <div key={feature.title} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${feature.checked ? feature.color : feature.color + '/60'} shadow-sm`}>
                                                                            <feature.icon className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[12px] font-semibold text-gray-900 leading-tight">{feature.title}</p>
                                                                            <p className="text-[10px] text-gray-500 leading-tight">{feature.desc}</p>
                                                                        </div>
                                                                        <ToggleSwitch checked={feature.checked} onChange={feature.onChange} ariaLabel={feature.title} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </section>

                                                        {/* ── VOCAL ─────────────────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <Volume2 className="w-3 h-3 text-gray-400" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Audio & vocal</span>
                                                            </div>

                                                            {/* Text-to-Speech */}
                                                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isSpeaking ? 'bg-red-500' : 'bg-violet-500'} shadow-sm`}>
                                                                    {isSpeaking ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-semibold text-gray-900 leading-tight">{isSpeaking ? 'Lecture en cours' : 'Lire le texte'}</p>
                                                                    <p className="text-[10px] text-gray-500 leading-tight">{isSpeaking ? 'Cliquez pour arrêter' : 'Sélectionnez du texte'}</p>
                                                                </div>
                                                                {isSpeaking ? (
                                                                    <button onClick={stopSpeaking} className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-200 hover:scale-105 active:scale-95">
                                                                        <VolumeX className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={handleReadSelected} className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-all duration-200 hover:scale-105 active:scale-95">
                                                                        <Volume2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Speech-to-Text */}
                                                            <div className="mt-2 flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isListening ? 'bg-rose-500' : 'bg-sky-500'} shadow-sm`}>
                                                                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-semibold text-gray-900 leading-tight">Assistant vocal</p>
                                                                    <p className="text-[10px] text-gray-500 leading-tight">{isListening ? 'Écoute en cours…' : 'Appuyez pour commencer'}</p>
                                                                </div>
                                                                <ToggleSwitch checked={isListening} onChange={isListening ? stopListening : startListening} ariaLabel="Assistant vocal" />
                                                            </div>

                                                            {/* Listening indicator */}
                                                            {isListening && (
                                                                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/5 border border-rose-500/20">
                                                                    <span className="relative flex h-2.5 w-2.5">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                                                                    </span>
                                                                    <span className="text-[10px] font-medium text-rose-600">Écoute en cours…</span>
                                                                </div>
                                                            )}

                                                            {/* Transcript */}
                                                            {spokenText && (
                                                                <div className="relative mt-2 p-2.5 rounded-xl bg-white border border-gray-200">
                                                                    <p className="text-[11px] text-gray-700 leading-relaxed pr-5">{spokenText}</p>
                                                                    <button
                                                                        onClick={clearSpokenText}
                                                                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                                                    >
                                                                        <X className="w-2.5 h-2.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </section>
                                                    </div>

                                                    {/* Reset button */}
                                                    <div className="px-4 pb-4 pt-1">
                                                        <button
                                                            onClick={handleResetAll}
                                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 hover:text-gray-700"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Réinitialiser les paramètres
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                            {[...mainItems, ...rightNavItems].map((item) => (
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
