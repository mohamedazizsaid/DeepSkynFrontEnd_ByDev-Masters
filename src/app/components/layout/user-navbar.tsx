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
    Cloud,
    ChevronRight,
} from 'lucide-react';
import { useNotificationStore } from '../../../stores/notification.store';
import { useAccessibilityStore } from '../../../stores/accessibility.store';
import { Button } from '../button';
import WeatherNavbar from '../../../components/weather/weather-navbar';
import { subscriptionService } from '../../../lib/services/subscription.service';

interface UserNavbarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout?: () => void;
    onToggleNotifications?: () => void;
    user?: { name: string; avatar?: string } | null;
}

function normalizePlan(plan: unknown): 'free' | 'premium' | 'premium_yearly' {
    if (typeof plan !== 'string') return 'free';
    const p = plan.trim();
    if (!p) return 'free';

    if (p === 'FREE' || p.toLowerCase() === 'free') return 'free';
    if (p === 'PREMIUM' || p.toLowerCase() === 'premium') return 'premium';
    if (
        p === 'PREMIUM_YEARLY' ||
        p.toLowerCase() === 'premium_yearly' ||
        p.toLowerCase() === 'premium-yearly'
    ) {
        return 'premium_yearly';
    }
    return 'free';
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

    const [currentPlan, setCurrentPlan] = useState<string>('free');

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
        focusHighlight,
        colorBlindFilter,
        readingGuide,
        speechRate,
        toggleTheme,
        setContrastMode,
        resetContrastMode,
        toggleReduceMotion,
        toggleDyslexiaFont,
        toggleLinkHighlight,
        toggleBigCursor,
        toggleTextSpacing,
        toggleFocusHighlight,
        setColorBlindFilter,
        toggleReadingGuide,
        setSpeechRate,
        zoomIn,
        zoomOut,
        resetZoom,
        speak,
        speakPage,
        stopSpeaking,
        startListening,
        stopListening,
        clearSpokenText,
        t,
    } = useAccessibilityStore();

    useEffect(() => {
        let mounted = true;

        const loadCurrentPlan = async () => {
            try {
                const sub = await subscriptionService.getMySubscription();
                if (mounted) setCurrentPlan(normalizePlan((sub as any)?.plan));
            } catch {
                if (mounted) setCurrentPlan('free');
            }
        };

        loadCurrentPlan();

        // Refetch plan when returning from Stripe checkout
        const handleFocus = () => {
            loadCurrentPlan();
        };

        const handleSubscriptionUpdated = (e: Event) => {
            const detail = (e as CustomEvent).detail as { plan?: string } | undefined;
            if (detail?.plan) {
                setCurrentPlan(normalizePlan(detail.plan));
                return;
            }
            loadCurrentPlan();
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('subscription-updated', handleSubscriptionUpdated);

        return () => {
            mounted = false;
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('subscription-updated', handleSubscriptionUpdated);
        };
    }, []);

    const currentPlanLabel =
        currentPlan === 'premium_yearly'
            ? 'Premium Annuel'
            : currentPlan === 'premium'
                ? 'Premium Mensuel'
                : 'Free';

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

    // Global keyboard shortcuts for accessibility
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!e.altKey) return;
            switch (e.key.toLowerCase()) {
                case 'd': e.preventDefault(); toggleTheme(); break;
                case 'r': {
                    e.preventDefault();
                    const sel = window.getSelection()?.toString().trim();
                    if (sel) speak(sel);
                    break;
                }
                case 'p': e.preventDefault(); speakPage(); break;
                case 's': e.preventDefault(); stopSpeaking(); break;
                case 'm': e.preventDefault(); isListening ? stopListening() : startListening(); break;
                case '+': case '=': e.preventDefault(); zoomIn(); break;
                case '-': e.preventDefault(); zoomOut(); break;
                case 'c': e.preventDefault(); {
                    const modes = ['off', 'medium', 'high'] as const;
                    const idx = modes.indexOf(contrastMode);
                    setContrastMode(modes[(idx + 1) % modes.length]);
                    break;
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleTheme, speak, speakPage, stopSpeaking, isListening, startListening, stopListening, zoomIn, zoomOut, contrastMode, setContrastMode]);

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
        if (focusHighlight) toggleFocusHighlight();
        if (readingGuide) toggleReadingGuide();
        if (colorBlindFilter !== 'none') setColorBlindFilter('none');
        if (isSpeaking) stopSpeaking();
        if (isListening) stopListening();
        clearSpokenText();
        if (theme === 'dark') toggleTheme();
        setSpeechRate(1);
    }, [
        resetZoom, resetContrastMode, reduceMotion, toggleReduceMotion, dyslexiaFont,
        toggleDyslexiaFont, linkHighlight, toggleLinkHighlight, bigCursor, toggleBigCursor,
        textSpacing, toggleTextSpacing, focusHighlight, toggleFocusHighlight, readingGuide,
        toggleReadingGuide, colorBlindFilter, setColorBlindFilter, isSpeaking, stopSpeaking,
        isListening, stopListening, clearSpokenText, theme, toggleTheme, setSpeechRate,
    ]);

    const mainItems = [
        { id: 'dashboard', label: '', icon: <LayoutDashboard className="w-5 h-5" /> },

    ];

    const rightNavItems = [
        { id: 'analysis', label: t('nav.analysis'), icon: <Scan className="w-5 h-5" /> },
        { id: 'routine', label: t('nav.routine'), icon: <Calendar className="w-5 h-5" /> },
        { id: 'chat', label: t('nav.coach'), icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'community', label: t('nav.community'), icon: <Users className="w-5 h-5" /> },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex">
                        {/* Logo */}
                        <div data-tour="navbar-logo" className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => onNavigate('dashboard')}>
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
                                    data-tour={`nav-${item.id === 'chat' ? 'coach' : item.id}`}
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
                                data-tour="nav-notifications"
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

                        {/* Weather Widget */}
                        <WeatherNavbar className="hidden lg:block" />

                        {/* Profile Dropdown */}
                        <div data-tour="nav-profile" className="relative ml-2" ref={dropdownRef}>
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
                                        className="absolute ltr:right-0 rtl:left-0 mt-3 rounded-2xl shadow-2xl bg-white/95 dark:bg-[#16213e]/95 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 ltr:origin-top-right rtl:origin-top-left overflow-hidden border border-transparent dark:border-gray-800"
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
                                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'Utilisateur'}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#0EA5E9]/10 to-[#06B6D4]/10 text-[#0EA5E9] dark:text-[#38BDF8]">
                                                                        <Sparkles className="w-2.5 h-2.5" />
                                                                        {currentPlanLabel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-4" />

                                                    {/* Menu Items */}
                                                    <div className="py-2 px-2">
                                                        <button
                                                            onClick={() => { onNavigate('profile'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#0EA5E9]/5 hover:to-[#06B6D4]/5 dark:hover:from-[#0EA5E9]/10 dark:hover:to-[#06B6D4]/10 hover:text-[#0EA5E9] dark:hover:text-[#38bdf8] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#0EA5E9]/10 transition-colors duration-200">
                                                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[#0EA5E9] dark:group-hover:text-[#38bdf8] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">{t('nav.profile')}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('evolution'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#EC4899]/5 hover:to-[#F43F5E]/5 dark:hover:from-[#EC4899]/10 dark:hover:to-[#F43F5E]/10 hover:text-[#EC4899] dark:hover:text-[#F472B6] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#EC4899]/10 transition-colors duration-200">
                                                                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[#EC4899] dark:group-hover:text-[#F472B6] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">{t('dashboard.healthEvolution')}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('subscription'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#F59E0B]/5 hover:to-[#FCD34D]/5 dark:hover:from-[#F59E0B]/10 dark:hover:to-[#FCD34D]/10 hover:text-[#F59E0B] dark:hover:text-[#FBBF24] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#F59E0B]/10 transition-colors duration-200">
                                                                <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[#F59E0B] dark:group-hover:text-[#FBBF24] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">{t('community.subscriptions')}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('settings'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#8B5CF6]/5 hover:to-[#6366F1]/5 dark:hover:from-[#8B5CF6]/10 dark:hover:to-[#6366F1]/10 hover:text-[#8B5CF6] dark:hover:text-[#A78BFA] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#8B5CF6]/10 transition-colors duration-200">
                                                                <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[#8B5CF6] dark:group-hover:text-[#A78BFA] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">{t('nav.settings')}</span>
                                                        </button>

                                                        <button
                                                            onClick={() => { onNavigate('meteo'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#06B6D4]/5 hover:to-[#0EA5E9]/5 dark:hover:from-[#06B6D4]/10 dark:hover:to-[#0EA5E9]/10 hover:text-[#06B6D4] dark:hover:text-[#22D3EE] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#06B6D4]/10 transition-colors duration-200">
                                                                <Cloud className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[#06B6D4] dark:group-hover:text-[#22D3EE] transition-colors duration-200" />
                                                            </div>
                                                            <span className="font-medium">Météo</span>
                                                        </button>

                                                        <button
                                                            onClick={() => setShowAccessibility(true)}
                                                            className="flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#06B6D4]/5 hover:to-[#0EA5E9]/5 dark:hover:from-[#06B6D4]/10 dark:hover:to-[#0EA5E9]/10 hover:text-[#06B6D4] dark:hover:text-[#22D3EE] transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-[#06B6D4]/10 transition-colors duration-200">
                                                                    <Monitor className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[#06B6D4] dark:group-hover:text-[#22D3EE] transition-colors duration-200" />
                                                                </div>
                                                                <span className="font-medium">{t('accessibility.title')}</span>
                                                            </div>
                                                            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 -rotate-90 group-hover:text-[#06B6D4] dark:group-hover:text-[#22D3EE] transition-colors duration-200" />
                                                        </button>
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-4" />

                                                    {/* Logout */}
                                                    <div className="py-2 px-2 pb-3">
                                                        <button
                                                            onClick={() => { onLogout?.(); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors duration-200">
                                                                <LogOut className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                            </div>
                                                            <span className="font-medium">{t('nav.logout')}</span>
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
                                                    <div className="flex items-center gap-3 px-5 pt-5 pb-4 sticky top-0 bg-white/95 dark:bg-[#16213e]/95 backdrop-blur-xl z-10">
                                                        <button
                                                            onClick={() => setShowAccessibility(false)}
                                                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                                                        >
                                                            <ChevronLeft className="w-5 h-5" />
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] shadow-sm">
                                                                <Eye className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Affichage & Accessibilité</h3>
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Personnalisez votre expérience</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent mx-4" />

                                                    <div className="flex flex-col gap-4 p-4">

                                                        {/* ── MÉTÉO SHORTCUT ─────────────────────────── */}
                                                        <button
                                                            onClick={() => { onNavigate('meteo'); setIsProfileOpen(false); setShowAccessibility(false); }}
                                                            className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-[#06B6D4]/10 to-[#0EA5E9]/10 dark:from-[#06B6D4]/20 dark:to-[#0EA5E9]/20 border border-[#06B6D4]/30 dark:border-[#06B6D4]/40 hover:border-[#0EA5E9] dark:hover:border-[#0EA5E9] hover:shadow-md transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#0EA5E9] shadow-sm group-hover:shadow-md transition-shadow">
                                                                <Cloud className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Page Météo</p>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">Conseils skincare selon la météo</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0EA5E9] transition-colors" />
                                                        </button>

                                                        {/* ── APPEARANCE ─────────────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <Eye className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Apparence</span>
                                                            </div>

                                                            {/* Theme Toggle */}
                                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                                                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${theme === 'dark' ? 'bg-indigo-500' : 'bg-amber-400'} shadow-sm`}>
                                                                    {theme === 'dark' ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Mode sombre</p>
                                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Thème sombre activé' : 'Thème clair activé'}</p>
                                                                </div>
                                                                <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} ariaLabel="Basculer le mode sombre" />
                                                            </div>

                                                            {/* Contrast */}
                                                            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-2 mb-2.5">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-yellow-500/10">
                                                                        <Contrast className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                                                                    </div>
                                                                    <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Contraste élevé</span>
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
                                                                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 ${isActive ? activeStyles[mode] : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-600'}`}
                                                                            >
                                                                                {labels[mode]}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Zoom */}
                                                            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center justify-between mb-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10">
                                                                            <Type className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                        </div>
                                                                        <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Taille du texte</span>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-full">{zoomLevel}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-2.5">
                                                                    <button onClick={zoomOut} disabled={zoomLevel <= 75} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">
                                                                        <ZoomOut className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <div className="flex-1 relative h-[6px] rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                                                        <div
                                                                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] transition-all duration-300 ease-out"
                                                                            style={{ width: `${((zoomLevel - 75) / 75) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <button onClick={zoomIn} disabled={zoomLevel >= 150} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">
                                                                        <ZoomIn className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                {zoomLevel !== 100 && (
                                                                    <button onClick={resetZoom} className="flex items-center justify-center gap-1.5 mt-2 w-full py-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-[#0EA5E9] rounded-md hover:bg-white dark:hover:bg-gray-700 transition-all duration-200">
                                                                        <RotateCcw className="w-2.5 h-2.5" /> Réinitialiser à 100%
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </section>

                                                        {/* ── VISION & READING ──────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <BookOpen className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Vision & lecture</span>
                                                            </div>

                                                            <div className="flex flex-col gap-2">
                                                                {[
                                                                    { icon: Pause, title: 'Réduire les animations', desc: 'WCAG 2.3.3 — Désactive les animations', checked: reduceMotion, onChange: toggleReduceMotion, color: 'bg-teal-500' },
                                                                    { icon: BookOpen, title: 'Police dyslexie', desc: 'WCAG 1.4.8 — Police Lexend adaptée', checked: dyslexiaFont, onChange: toggleDyslexiaFont, color: 'bg-pink-500' },
                                                                    { icon: Link, title: 'Souligner les liens', desc: 'WCAG 1.4.1 — Liens toujours visibles', checked: linkHighlight, onChange: toggleLinkHighlight, color: 'bg-blue-500' },
                                                                    { icon: MousePointer, title: 'Grand curseur', desc: 'Curseur agrandi pour la visibilité', checked: bigCursor, onChange: toggleBigCursor, color: 'bg-orange-500' },
                                                                    { icon: Space, title: 'Espacement du texte', desc: 'WCAG 1.4.12 — Lignes & lettres espacées', checked: textSpacing, onChange: toggleTextSpacing, color: 'bg-lime-500' },
                                                                    { icon: Eye, title: 'Indicateur de focus', desc: 'WCAG 2.4.7 — Surligne le focus clavier', checked: focusHighlight, onChange: toggleFocusHighlight, color: 'bg-cyan-500' },
                                                                    { icon: Type, title: 'Guide de lecture', desc: 'Bande suivant la souris pour faciliter la lecture', checked: readingGuide, onChange: toggleReadingGuide, color: 'bg-emerald-500' },
                                                                ].map((feature) => (
                                                                    <div key={feature.title} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${feature.checked ? feature.color : feature.color + '/60'} shadow-sm`}>
                                                                            <feature.icon className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">{feature.title}</p>
                                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{feature.desc}</p>
                                                                        </div>
                                                                        <ToggleSwitch checked={feature.checked} onChange={feature.onChange} ariaLabel={feature.title} />
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Color Blind Filters */}
                                                            <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-2 mb-2.5">
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/10">
                                                                        <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Filtre daltonisme</span>
                                                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-snug">Adapte les couleurs selon votre vision</p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-1.5">
                                                                    {([
                                                                        { value: 'none', label: 'Aucun' },
                                                                        { value: 'protanopia', label: 'Protanopie' },
                                                                        { value: 'deuteranopia', label: 'Deutéranopie' },
                                                                        { value: 'tritanopia', label: 'Tritanopie' },
                                                                        { value: 'achromatopsia', label: 'Achromatopsie' },
                                                                    ] as { value: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'; label: string }[]).map((f) => (
                                                                        <button
                                                                            key={f.value}
                                                                            onClick={() => setColorBlindFilter(f.value)}
                                                                            aria-pressed={colorBlindFilter === f.value}
                                                                            className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                                                                                colorBlindFilter === f.value
                                                                                    ? 'bg-purple-500 text-white shadow-sm'
                                                                                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                                                            }`}
                                                                        >
                                                                            {f.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </section>

                                                        {/* ── VOCAL ─────────────────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <Volume2 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Audio & vocal</span>
                                                            </div>

                                                            {/* Text-to-Speech — Read selected */}
                                                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isSpeaking ? 'bg-red-500' : 'bg-violet-500'} shadow-sm`}>
                                                                    {isSpeaking ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">{isSpeaking ? 'Lecture en cours' : 'Lire le texte sélectionné'}</p>
                                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{isSpeaking ? 'Cliquez pour arrêter' : 'Sélectionnez du texte (Alt+R)'}</p>
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

                                                            {/* Read entire page */}
                                                            <div className="mt-2 flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 shadow-sm">
                                                                    <BookOpen className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">Lire toute la page</p>
                                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Lecture vocale du contenu visible (Alt+P)</p>
                                                                </div>
                                                                <button
                                                                    onClick={speakPage}
                                                                    disabled={isSpeaking}
                                                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                                                                >
                                                                    <BookOpen className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            {/* Speech Rate */}
                                                            <div className="mt-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-[12px] font-semibold text-gray-900 dark:text-gray-100">Vitesse de lecture</span>
                                                                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{speechRate.toFixed(1)}x</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500">0.5x</span>
                                                                    <input
                                                                        type="range" min="0.5" max="2" step="0.1" value={speechRate}
                                                                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                                                        aria-label="Vitesse de lecture vocale"
                                                                        className="flex-1 h-[5px] rounded-full appearance-none bg-gray-200 dark:bg-gray-600 accent-violet-500 cursor-pointer"
                                                                    />
                                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500">2.0x</span>
                                                                </div>
                                                            </div>

                                                            {/* Speaking indicator */}
                                                            {isSpeaking && (
                                                                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/20">
                                                                    <span className="relative flex h-2.5 w-2.5">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
                                                                    </span>
                                                                    <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">Lecture en cours…</span>
                                                                    <button onClick={stopSpeaking} className="ml-auto text-[9px] font-bold text-red-500 hover:text-red-600 transition-colors">Arrêter</button>
                                                                </div>
                                                            )}

                                                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent my-2" />

                                                            {/* Speech-to-Text / Voice Assistant */}
                                                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isListening ? 'bg-rose-500' : 'bg-sky-500'} shadow-sm`}>
                                                                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">Assistant vocal</p>
                                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{isListening ? 'Dites une commande…' : 'Naviguer par la voix (Alt+M)'}</p>
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
                                                                    <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">Écoute en cours…</span>
                                                                </div>
                                                            )}

                                                            {/* Transcript */}
                                                            {spokenText && (
                                                                <div className="relative mt-2 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                                                                    <p className="text-[11px] text-gray-700 dark:text-gray-200 leading-relaxed pr-5">{spokenText}</p>
                                                                    <button
                                                                        onClick={clearSpokenText}
                                                                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                                    >
                                                                        <X className="w-2.5 h-2.5" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Voice commands info */}
                                                            <div className="mt-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200/50 dark:border-sky-700/30">
                                                                <p className="text-[10px] font-bold text-sky-700 dark:text-sky-300 mb-1.5">Commandes vocales :</p>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                                                    {[
                                                                        '"Accueil"', '"Analyse"', '"Routine"', '"Profil"',
                                                                        '"Mode sombre"', '"Mode clair"', '"Zoom plus"', '"Zoom moins"',
                                                                        '"Lire la page"', '"Arrêter"', '"Contraste élevé"', '"Aide"',
                                                                    ].map((cmd) => (
                                                                        <span key={cmd} className="text-[9px] text-sky-600 dark:text-sky-400 font-mono">{cmd}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </section>

                                                        {/* ── KEYBOARD SHORTCUTS ────────────────── */}
                                                        <section>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <Settings className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Raccourcis clavier</span>
                                                            </div>
                                                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                    {[
                                                                        { key: 'Alt+D', desc: 'Mode sombre' },
                                                                        { key: 'Alt+R', desc: 'Lire sélection' },
                                                                        { key: 'Alt+P', desc: 'Lire la page' },
                                                                        { key: 'Alt+S', desc: 'Stop lecture' },
                                                                        { key: 'Alt+M', desc: 'Micro' },
                                                                        { key: 'Alt++/-', desc: 'Zoom' },
                                                                    ].map((s) => (
                                                                        <div key={s.key} className="flex items-center gap-1.5">
                                                                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[8px] font-mono font-bold text-gray-700 dark:text-gray-300">{s.key}</kbd>
                                                                            <span className="text-[9px] text-gray-500 dark:text-gray-400">{s.desc}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </section>
                                                    </div>

                                                    {/* Reset button */}
                                                    <div className="px-4 pb-4 pt-1">
                                                        <button
                                                            onClick={handleResetAll}
                                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-200"
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
