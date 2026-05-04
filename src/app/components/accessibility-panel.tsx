import React, { useCallback, useEffect, useState } from 'react';
import {
    Accessibility,
    Sun,
    Moon,
    ZoomIn,
    ZoomOut,
    Volume2,
    VolumeX,
    Mic,
    MicOff,
    X,
    RotateCcw,
    Eye,
    Type,
    Contrast,
    MousePointer,
    Link,
    Space,
    BookOpen,
    Pause,
    Focus,
    Palette,
    Ruler,
    Gauge,
    HelpCircle,
    Keyboard,
    ChevronDown,
    ChevronUp,
    FileText,
    Globe,
    Check,
} from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { LANGUAGES, Language } from '../../lib/i18n/translations';

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Switch
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
        relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2
                ${checked
                    ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]'
                    : 'bg-[var(--switch-background,#D1D5DB)]'
                }
      `}
        >
            <span
                className={`
          pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md
          ring-0 transition-transform duration-300 ease-in-out
          ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}
        `}
            />
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header — collapsible
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({
    icon: Icon,
    label,
    isOpen,
    onToggle,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    isOpen?: boolean;
    onToggle?: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className="flex items-center gap-[8px] mb-[12px] w-full group"
            aria-expanded={isOpen}
            type="button"
        >
            <Icon size={15} className="text-[var(--muted-foreground)]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] flex-1 text-left">
                {label}
            </span>
            {onToggle && (
                <span className="text-[var(--muted-foreground)] opacity-60 group-hover:opacity-100 transition-opacity">
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
            )}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Card
// ─────────────────────────────────────────────────────────────────────────────
function FeatureCard({
    icon: Icon,
    iconBg,
    title,
    description,
    action,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconBg: string;
    title: string;
    description: string;
    action: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-[12px] p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)] transition-all duration-200 hover:shadow-sm">
            <div
                className={`flex items-center justify-center w-[40px] h-[40px] rounded-xl shrink-0 ${iconBg}`}
            >
                <Icon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[var(--foreground)] leading-tight">{title}</p>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-snug mt-[2px]">{description}</p>
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice commands list
// ─────────────────────────────────────────────────────────────────────────────
const SHORTCUTS_BY_LANGUAGE: Record<Language, { key: string; desc: string }[]> = {
    fr: [
        { key: 'Alt + A', desc: 'Panneau' },
        { key: 'Alt + D', desc: 'Mode sombre' },
        { key: 'Alt + R', desc: 'Lire sélection' },
        { key: 'Alt + P', desc: 'Lire la page' },
        { key: 'Alt + S', desc: 'Stop lecture' },
        { key: 'Alt + M', desc: 'Micro' },
        { key: 'Alt + +', desc: 'Zoom +' },
        { key: 'Alt + -', desc: 'Zoom -' },
        { key: 'Échap', desc: 'Fermer' },
    ],
    en: [
        { key: 'Alt + A', desc: 'Panel' },
        { key: 'Alt + D', desc: 'Dark mode' },
        { key: 'Alt + R', desc: 'Read selection' },
        { key: 'Alt + P', desc: 'Read page' },
        { key: 'Alt + S', desc: 'Stop reading' },
        { key: 'Alt + M', desc: 'Mic' },
        { key: 'Alt + +', desc: 'Zoom +' },
        { key: 'Alt + -', desc: 'Zoom -' },
        { key: 'Esc', desc: 'Close' },
    ],
    ar: [
        { key: 'Alt + A', desc: 'اللوحة' },
        { key: 'Alt + D', desc: 'الوضع الداكن' },
        { key: 'Alt + R', desc: 'قراءة التحديد' },
        { key: 'Alt + P', desc: 'قراءة الصفحة' },
        { key: 'Alt + S', desc: 'إيقاف القراءة' },
        { key: 'Alt + M', desc: 'الميكروفون' },
        { key: 'Alt + +', desc: 'تكبير +' },
        { key: 'Alt + -', desc: 'تكبير -' },
        { key: 'Esc', desc: 'إغلاق' },
    ],
    es: [
        { key: 'Alt + A', desc: 'Panel' },
        { key: 'Alt + D', desc: 'Modo oscuro' },
        { key: 'Alt + R', desc: 'Leer selección' },
        { key: 'Alt + P', desc: 'Leer página' },
        { key: 'Alt + S', desc: 'Detener lectura' },
        { key: 'Alt + M', desc: 'Micrófono' },
        { key: 'Alt + +', desc: 'Zoom +' },
        { key: 'Alt + -', desc: 'Zoom -' },
        { key: 'Esc', desc: 'Cerrar' },
    ],
};

const VOICE_COMMANDS_BY_LANGUAGE: Record<Language, { command: string; desc: string }[]> = {
    fr: [
        { command: '"Accueil" / "Tableau de bord"', desc: 'Aller au tableau de bord' },
        { command: '"Analyse"', desc: 'Ouvrir l\'analyse' },
        { command: '"Routine"', desc: 'Ouvrir les routines' },
        { command: '"Profil"', desc: 'Ouvrir le profil' },
        { command: '"Communauté"', desc: 'Ouvrir la communauté' },
        { command: '"Météo"', desc: 'Ouvrir la météo' },
        { command: '"Mode sombre" / "Mode clair"', desc: 'Changer le thème' },
        { command: '"Zoom plus" / "Zoom moins"', desc: 'Ajuster la taille' },
        { command: '"Lire la page"', desc: 'Lecture vocale de la page' },
        { command: '"Arrêter"', desc: 'Stopper la lecture' },
        { command: '"Contraste élevé" / "moyen" / "normal"', desc: 'Changer le contraste' },
        { command: '"Aide"', desc: 'Liste des commandes' },
    ],
    en: [
        { command: '"Home" / "Dashboard"', desc: 'Go to dashboard' },
        { command: '"Analysis"', desc: 'Open analysis' },
        { command: '"Routine"', desc: 'Open routine' },
        { command: '"Profile"', desc: 'Open profile' },
        { command: '"Community"', desc: 'Open community' },
        { command: '"Weather"', desc: 'Open weather page' },
        { command: '"Dark mode" / "Light mode"', desc: 'Change theme' },
        { command: '"Zoom in" / "Zoom out"', desc: 'Adjust size' },
        { command: '"Read page"', desc: 'Read current page' },
        { command: '"Stop"', desc: 'Stop reading' },
        { command: '"High contrast" / "medium" / "normal"', desc: 'Change contrast' },
        { command: '"Help"', desc: 'List commands' },
    ],
    ar: [
        { command: '"الرئيسية" / "لوحة التحكم"', desc: 'الانتقال إلى لوحة التحكم' },
        { command: '"تحليل"', desc: 'فتح التحليل' },
        { command: '"الروتين"', desc: 'فتح الروتين' },
        { command: '"الملف الشخصي"', desc: 'فتح الملف الشخصي' },
        { command: '"المجتمع"', desc: 'فتح المجتمع' },
        { command: '"الطقس"', desc: 'فتح صفحة الطقس' },
        { command: '"الوضع الداكن" / "الوضع الفاتح"', desc: 'تغيير النمط' },
        { command: '"تكبير" / "تصغير"', desc: 'تعديل الحجم' },
        { command: '"اقرأ الصفحة"', desc: 'قراءة الصفحة صوتيا' },
        { command: '"توقف"', desc: 'إيقاف القراءة' },
        { command: '"تباين عال" / "متوسط" / "عادي"', desc: 'تغيير التباين' },
        { command: '"مساعدة"', desc: 'قائمة الأوامر' },
    ],
    es: [
        { command: '"Inicio" / "Panel"', desc: 'Ir al panel' },
        { command: '"Análisis"', desc: 'Abrir análisis' },
        { command: '"Rutina"', desc: 'Abrir rutina' },
        { command: '"Perfil"', desc: 'Abrir perfil' },
        { command: '"Comunidad"', desc: 'Abrir comunidad' },
        { command: '"Clima"', desc: 'Abrir página del clima' },
        { command: '"Modo oscuro" / "Modo claro"', desc: 'Cambiar tema' },
        { command: '"Zoom más" / "Zoom menos"', desc: 'Ajustar tamaño' },
        { command: '"Leer página"', desc: 'Lectura de la página' },
        { command: '"Detener"', desc: 'Detener lectura' },
        { command: '"Alto contraste" / "medio" / "normal"', desc: 'Cambiar contraste' },
        { command: '"Ayuda"', desc: 'Lista de comandos' },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function AccessibilityPanel() {
    const {
        language,
        theme,
        accentTheme,
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
        isPanelOpen,
        focusHighlight,
        colorBlindFilter,
        readingGuide,
        speechRate,
        eyeTracking,
        setLanguage,
        toggleTheme,
        setAccentTheme,
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
        togglePanel,
        closePanel,
        toggleEyeTracking,
        t,
    } = useAccessibilityStore();

    // ── Section toggle state ────────────────────────────────────────────
    const [openSections, setOpenSections] = useState({
        language: true,
        appearance: true,
        vision: true,
        tts: true,
        voice: true,
        extras: false,
    });
    const [showCommands, setShowCommands] = useState(false);
    const shortcuts = SHORTCUTS_BY_LANGUAGE[language] ?? SHORTCUTS_BY_LANGUAGE.fr;
    const voiceCommands = VOICE_COMMANDS_BY_LANGUAGE[language] ?? VOICE_COMMANDS_BY_LANGUAGE.fr;

    const quickLabels = {
        fr: {
            openPanel: "Ouvrir le panneau d'accessibilité (Alt+A)",
            panel: "Panneau d'accessibilité",
            keyboard: 'Raccourcis clavier',
            eyeTrackingTitle: 'Suivi Oculaire',
            eyeTrackingDesc: 'Contrôlez le curseur avec votre tête via la webcam',
            eyeTrackingAria: 'Activer le suivi oculaire',
            eyeTrackingActive: 'Suivi actif - Bougez la tête pour déplacer le curseur',
            listening: 'Écoute en cours…',
            clearTranscript: 'Effacer le texte dicté',
            voiceToggleOn: "Arrêter l'écoute",
            voiceToggleOff: "Démarrer l'écoute (Alt+M)",
            colorThemeTitle: 'Couleur du thème',
            colorThemeDesc: "Choisissez la couleur principale de l'interface",
            colorThemeBlue: 'Bleu',
            colorThemePink: 'Rose',
        },
        en: {
            openPanel: 'Open accessibility panel (Alt+A)',
            panel: 'Accessibility panel',
            keyboard: 'Keyboard shortcuts',
            eyeTrackingTitle: 'Eye Tracking',
            eyeTrackingDesc: 'Control cursor with your head using webcam',
            eyeTrackingAria: 'Enable eye tracking',
            eyeTrackingActive: 'Tracking active - move your head to move the cursor',
            listening: 'Listening…',
            clearTranscript: 'Clear dictated text',
            voiceToggleOn: 'Stop listening',
            voiceToggleOff: 'Start listening (Alt+M)',
            colorThemeTitle: 'Theme color',
            colorThemeDesc: 'Choose the main interface color',
            colorThemeBlue: 'Blue',
            colorThemePink: 'Pink',
        },
        ar: {
            openPanel: 'فتح لوحة إمكانية الوصول (Alt+A)',
            panel: 'لوحة إمكانية الوصول',
            keyboard: 'اختصارات لوحة المفاتيح',
            eyeTrackingTitle: 'تتبع العين',
            eyeTrackingDesc: 'تحكم بالمؤشر عبر حركة الرأس باستخدام الكاميرا',
            eyeTrackingAria: 'تفعيل تتبع العين',
            eyeTrackingActive: 'التتبع نشط - حرّك رأسك لتحريك المؤشر',
            listening: 'جاري الاستماع…',
            clearTranscript: 'مسح النص المملى',
            voiceToggleOn: 'إيقاف الاستماع',
            voiceToggleOff: 'بدء الاستماع (Alt+M)',
            colorThemeTitle: 'لون النمط',
            colorThemeDesc: 'اختر اللون الرئيسي للواجهة',
            colorThemeBlue: 'أزرق',
            colorThemePink: 'وردي',
        },
        es: {
            openPanel: 'Abrir panel de accesibilidad (Alt+A)',
            panel: 'Panel de accesibilidad',
            keyboard: 'Atajos de teclado',
            eyeTrackingTitle: 'Seguimiento ocular',
            eyeTrackingDesc: 'Controla el cursor con la cabeza usando la webcam',
            eyeTrackingAria: 'Activar seguimiento ocular',
            eyeTrackingActive: 'Seguimiento activo - mueve la cabeza para mover el cursor',
            listening: 'Escuchando…',
            clearTranscript: 'Borrar texto dictado',
            voiceToggleOn: 'Detener escucha',
            voiceToggleOff: 'Iniciar escucha (Alt+M)',
            colorThemeTitle: 'Color del tema',
            colorThemeDesc: 'Elige el color principal de la interfaz',
            colorThemeBlue: 'Azul',
            colorThemePink: 'Rosa',
        },
    }[language] ?? {
        openPanel: "Ouvrir le panneau d'accessibilité (Alt+A)",
        panel: "Panneau d'accessibilité",
        keyboard: 'Raccourcis clavier',
        eyeTrackingTitle: 'Suivi Oculaire',
        eyeTrackingDesc: 'Contrôlez le curseur avec votre tête via la webcam',
        eyeTrackingAria: 'Activer le suivi oculaire',
        eyeTrackingActive: 'Suivi actif - Bougez la tête pour déplacer le curseur',
        listening: 'Écoute en cours…',
        clearTranscript: 'Effacer le texte dicté',
        voiceToggleOn: "Arrêter l'écoute",
        voiceToggleOff: "Démarrer l'écoute (Alt+M)",
        colorThemeTitle: 'Couleur du thème',
        colorThemeDesc: "Choisissez la couleur principale de l'interface",
        colorThemeBlue: 'Bleu',
        colorThemePink: 'Rose',
    };

    const toggle = (key: keyof typeof openSections) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

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
        if (accentTheme !== 'blue') setAccentTheme('blue');
        setSpeechRate(1);
    }, [
        resetZoom, resetContrastMode, reduceMotion, toggleReduceMotion, dyslexiaFont,
        toggleDyslexiaFont, linkHighlight, toggleLinkHighlight, bigCursor, toggleBigCursor,
        textSpacing, toggleTextSpacing, focusHighlight, toggleFocusHighlight, readingGuide,
        toggleReadingGuide, colorBlindFilter, setColorBlindFilter, isSpeaking, stopSpeaking,
        isListening, stopListening, clearSpokenText, theme, toggleTheme, accentTheme, setAccentTheme, setSpeechRate,
    ]);

    // ── Keyboard shortcuts ──────────────────────────────────────────────
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Alt+A: toggle panel
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                togglePanel();
            }
            // Alt+D: toggle dark mode
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                toggleTheme();
            }
            // Alt+R: read selected text
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                handleReadSelected();
            }
            // Alt+P: read full page
            if (e.altKey && e.key === 'p') {
                e.preventDefault();
                speakPage();
            }
            // Alt+S: stop speaking
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                if (isSpeaking) stopSpeaking();
            }
            // Alt+M: toggle voice listening
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                isListening ? stopListening() : startListening();
            }
            // Escape: close panel
            if (e.key === 'Escape' && isPanelOpen) {
                closePanel();
            }
            // Alt+ +: zoom in
            if (e.altKey && e.key === '+') {
                e.preventDefault();
                zoomIn();
            }
            // Alt+ -: zoom out
            if (e.altKey && e.key === '-') {
                e.preventDefault();
                zoomOut();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        togglePanel, toggleTheme, handleReadSelected, speakPage, isSpeaking,
        stopSpeaking, isListening, stopListening, startListening, isPanelOpen,
        closePanel, zoomIn, zoomOut,
    ]);

    // ── FAB ────────────────────────────────────────────────────────────────
    if (!isPanelOpen) {
        return (
            <button
                onClick={togglePanel}
                aria-label={quickLabels.openPanel}
                className="
          fixed bottom-[24px] right-[24px] z-[9999]
          flex items-center justify-center w-[56px] h-[56px]
          rounded-full shadow-xl
          bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]
          text-white
          hover:scale-110 hover:shadow-2xl
          active:scale-95
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-4 focus:ring-[var(--accent-primary)]/40
          animate-pulse-glow
        "
            >
                <Accessibility size={26} />
            </button>
        );
    }

    // ── Panel ──────────────────────────────────────────────────────────────
    return (
        <div
            style={{ fontSize: '16px' }} // Force fixed base font size to prevent zoom scaling
            className="
        fixed bottom-[24px] right-[24px] z-[9999]
        w-[360px] max-h-[85vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
        rounded-2xl
        bg-[var(--background)]/95 backdrop-blur-2xl
        border border-[var(--border)]
        shadow-2xl
        animate-fade-in
      "
            role="dialog"
            aria-label={quickLabels.panel}
            aria-modal="false"
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[16px]">
                <div className="flex items-center gap-[12px]">
                    <div className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-md">
                        <Accessibility size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-[var(--foreground)] leading-tight">{t('accessibility.title')}</h2>
                        <p className="text-[10px] text-[var(--muted-foreground)]">{t('accessibilityPanel.customize')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-[4px]">
                    <button
                        onClick={() => setShowCommands(!showCommands)}
                        aria-label={quickLabels.keyboard}
                        title={quickLabels.keyboard}
                        className="flex items-center justify-center w-[32px] h-[32px] rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                    >
                        <Keyboard size={16} />
                    </button>
                    <button
                        onClick={closePanel}
                        aria-label={t('accessibilityPanel.close')}
                        className="flex items-center justify-center w-[32px] h-[32px] rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* ── Keyboard shortcuts popover ──────────────────────────────── */}
            {showCommands && (
                <div className="mx-[20px] mb-[12px] p-[12px] rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                    <p className="text-[11px] font-bold text-[var(--foreground)] mb-[8px] uppercase tracking-wider">{t('accessibilityPanel.shortcuts')}</p>
                    <div className="grid grid-cols-2 gap-[4px]">
                        {shortcuts.map((s) => (
                            <div key={s.key} className="flex items-center gap-[6px]">
                                <kbd className="px-[6px] py-[2px] rounded bg-[var(--background)] border border-[var(--border)] text-[9px] font-mono font-bold text-[var(--foreground)]">
                                    {s.key}
                                </kbd>
                                <span className="text-[10px] text-[var(--muted-foreground)]">{s.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-px bg-[var(--border)] mx-[20px]" />

            <div className="flex flex-col gap-[20px] p-[20px]">

                {/* ══════════════════════════════════════════════════════════════
            LANGUAGE
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Globe} label={t('accessibilityPanel.language')} isOpen={openSections.language} onToggle={() => toggle('language')} />
                    
                    {openSections.language && (
                        <div className="grid grid-cols-2 gap-[8px]">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code as Language)}
                                    aria-pressed={language === lang.code}
                                    className={`
                                        flex flex-col items-center justify-center p-[12px] rounded-xl border transition-all duration-200
                                        ${language === lang.code
                                            ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm'
                                            : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--secondary)] hover:border-[var(--muted-foreground)]'
                                        }
                                    `}
                                >
                                    <span className="text-[20px] mb-[4px]">{lang.flag}</span>
                                    <span className={`text-[12px] font-semibold ${language === lang.code ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                                        {lang.label}
                                    </span>
                                    {language === lang.code && (
                                        <div className="absolute top-[6px] right-[6px] w-[14px] h-[14px] rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                                            <Check size={8} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* ══════════════════════════════════════════════════════════════
            APPEARANCE
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Eye} label={t('accessibilityPanel.appearance')} isOpen={openSections.appearance} onToggle={() => toggle('appearance')} />

                    {openSections.appearance && (
                        <>
                            {/* Theme */}
                            <FeatureCard
                                icon={theme === 'dark' ? Moon : Sun}
                                iconBg={theme === 'dark' ? 'bg-indigo-500' : 'bg-amber-400'}
                                title={t('accessibilityPanel.darkMode')}
                                description={theme === 'dark' ? t('accessibilityPanel.darkModeOn') : t('accessibilityPanel.lightModeOn')}
                                action={
                                    <ToggleSwitch
                                        checked={theme === 'dark'}
                                        onChange={toggleTheme}
                                        ariaLabel="Basculer le mode sombre (Alt+D)"
                                    />
                                }
                            />

                            {/* Accent color theme */}
                            <div className="mt-[10px] p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <div className="flex items-center gap-[8px] mb-[12px]">
                                    <div className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-[var(--primary)]/10">
                                        <Palette size={15} className="text-[var(--primary)]" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[14px] font-semibold text-[var(--foreground)]">{quickLabels.colorThemeTitle}</span>
                                        <p className="text-[10px] text-[var(--muted-foreground)] leading-snug mt-[1px]">{quickLabels.colorThemeDesc}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[6px]">
                                    <button
                                        onClick={() => setAccentTheme('blue')}
                                        aria-pressed={accentTheme === 'blue'}
                                        className={`py-[8px] px-[10px] rounded-lg text-[11px] font-semibold border transition-all duration-200 ${accentTheme === 'blue'
                                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-sm'
                                            : 'bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
                                            }`}
                                    >
                                        {quickLabels.colorThemeBlue}
                                    </button>
                                    <button
                                        onClick={() => setAccentTheme('pink')}
                                        aria-pressed={accentTheme === 'pink'}
                                        className={`py-[8px] px-[10px] rounded-lg text-[11px] font-semibold border transition-all duration-200 ${accentTheme === 'pink'
                                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-sm'
                                            : 'bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
                                            }`}
                                    >
                                        {quickLabels.colorThemePink}
                                    </button>
                                </div>
                            </div>

                            {/* ── Contrast for low vision ─────────────────────────── */}
                            <div className="mt-[10px] p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <div className="flex items-center gap-[8px] mb-[12px]">
                                    <div className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-yellow-500/10">
                                        <Contrast size={15} className="text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[14px] font-semibold text-[var(--foreground)]">{t('accessibilityPanel.highContrast')}</span>
                                        <p className="text-[10px] text-[var(--muted-foreground)] leading-snug mt-[1px]">{t('accessibilityPanel.highContrastDesc')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-[6px]">
                                    {/* Off */}
                                    <button
                                        onClick={() => setContrastMode('off')}
                                        aria-label="Désactiver le contraste élevé"
                                        aria-pressed={contrastMode === 'off'}
                                        className={`
                                            flex-1 flex items-center justify-center gap-[5px] py-[8px] rounded-lg text-[11px] font-semibold
                                            transition-all duration-300 ease-out
                                            ${contrastMode === 'off'
                                                ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md scale-[1.02]'
                                                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                                            }
                                        `}
                                    >
                                        <span className={`w-[6px] h-[6px] rounded-full transition-colors duration-300 ${contrastMode === 'off' ? 'bg-green-400' : 'bg-[var(--muted-foreground)]/40'
                                            }`} />
                                        {t('accessibilityPanel.contrastNormal')}
                                    </button>

                                    {/* Medium */}
                                    <button
                                        onClick={() => setContrastMode('medium')}
                                        aria-label="Activer le contraste moyen"
                                        aria-pressed={contrastMode === 'medium'}
                                        className={`
                                            flex-1 flex items-center justify-center gap-[5px] py-[8px] rounded-lg text-[11px] font-semibold
                                            transition-all duration-300 ease-out
                                            ${contrastMode === 'medium'
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                                                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                                            }
                                        `}
                                    >
                                        <span className={`w-[6px] h-[6px] rounded-full transition-colors duration-300 ${contrastMode === 'medium' ? 'bg-white' : 'bg-[var(--muted-foreground)]/40'
                                            }`} />
                                        {t('accessibilityPanel.contrastMedium')}
                                    </button>

                                    {/* High */}
                                    <button
                                        onClick={() => setContrastMode('high')}
                                        aria-label="Activer le contraste élevé maximum"
                                        aria-pressed={contrastMode === 'high'}
                                        className={`
                                            flex-1 flex items-center justify-center gap-[5px] py-[8px] rounded-lg text-[11px] font-semibold
                                            transition-all duration-300 ease-out
                                            ${contrastMode === 'high'
                                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md shadow-yellow-400/30 scale-[1.02]'
                                                : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                                            }
                                        `}
                                    >
                                        <span className={`w-[6px] h-[6px] rounded-full transition-colors duration-300 ${contrastMode === 'high' ? 'bg-black' : 'bg-[var(--muted-foreground)]/40'
                                            }`} />
                                        {t('accessibilityPanel.contrastHigh')}
                                    </button>
                                </div>

                                {contrastMode !== 'off' && (
                                    <div className="mt-[8px] flex items-center gap-[6px] px-[10px] py-[6px] rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                        <Contrast size={12} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
                                        <span className="text-[10px] font-medium text-yellow-700 dark:text-yellow-300">
                                            {contrastMode === 'medium' ? 'Contraste moyen activé (ratio ≥ 7:1)' : 'Contraste maximum activé (ratio ≥ 10:1)'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Zoom */}
                            <div className="mt-[10px] p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <div className="flex items-center justify-between mb-[12px]">
                                    <div className="flex items-center gap-[8px]">
                                        <div className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-emerald-500/10">
                                            <Type size={15} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-[14px] font-semibold text-[var(--foreground)]">{t('accessibilityPanel.textSize')}</span>
                                    </div>
                                    <span className="text-[12px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-[10px] py-[4px] rounded-full">
                                        {zoomLevel}%
                                    </span>
                                </div>

                                {/* Zoom controls */}
                                <div className="flex items-center gap-[12px]">
                                    <button
                                        onClick={zoomOut}
                                        disabled={zoomLevel <= 75}
                                        aria-label="Réduire le zoom (Alt+-)"
                                        className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <ZoomOut size={16} />
                                    </button>

                                    {/* Progress bar */}
                                    <div className="flex-1 relative h-[8px] rounded-full bg-[var(--secondary)] overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-300 ease-out"
                                            style={{ width: `${((zoomLevel - 75) / 75) * 100}%` }}
                                        />
                                    </div>

                                    <button
                                        onClick={zoomIn}
                                        disabled={zoomLevel >= 150}
                                        aria-label="Augmenter le zoom (Alt++)"
                                        className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                </div>

                                {zoomLevel !== 100 && (
                                    <button
                                        onClick={resetZoom}
                                        className="flex items-center justify-center gap-[6px] mt-[10px] w-full py-[6px] text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-all duration-200"
                                        aria-label={t('accessibilityPanel.resetZoom')}
                                    >
                                        <RotateCcw size={11} />
                                        {t('accessibilityPanel.resetZoom')}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* ══════════════════════════════════════════════════════════════
            VISION & LECTURE — WCAG Features
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={BookOpen} label={t('accessibilityPanel.vision')} isOpen={openSections.vision} onToggle={() => toggle('vision')} />

                    {openSections.vision && (
                        <div className="flex flex-col gap-[8px]">
                            <FeatureCard
                                icon={Pause}
                                iconBg={reduceMotion ? 'bg-teal-500' : 'bg-teal-500/60'}
                                title={t('accessibilityPanel.reduceMotion')}
                                description={t('accessibilityPanel.reduceMotionDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={reduceMotion}
                                        onChange={toggleReduceMotion}
                                        ariaLabel="Réduire les animations"
                                    />
                                }
                            />

                            <FeatureCard
                                icon={BookOpen}
                                iconBg={dyslexiaFont ? 'bg-pink-500' : 'bg-pink-500/60'}
                                title={t('accessibilityPanel.dyslexicFont')}
                                description={t('accessibilityPanel.dyslexicFontDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={dyslexiaFont}
                                        onChange={toggleDyslexiaFont}
                                        ariaLabel="Activer la police dyslexie"
                                    />
                                }
                            />

                            <FeatureCard
                                icon={Link}
                                iconBg={linkHighlight ? 'bg-blue-500' : 'bg-blue-500/60'}
                                title={t('accessibilityPanel.highlightLinks')}
                                description={t('accessibilityPanel.highlightLinksDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={linkHighlight}
                                        onChange={toggleLinkHighlight}
                                        ariaLabel="Souligner les liens"
                                    />
                                }
                            />

                            <FeatureCard
                                icon={MousePointer}
                                iconBg={bigCursor ? 'bg-orange-500' : 'bg-orange-500/60'}
                                title={t('accessibilityPanel.bigCursor')}
                                description={t('accessibilityPanel.bigCursorDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={bigCursor}
                                        onChange={toggleBigCursor}
                                        ariaLabel="Activer le grand curseur"
                                    />
                                }
                            />

                            <FeatureCard
                                icon={Space}
                                iconBg={textSpacing ? 'bg-lime-500' : 'bg-lime-500/60'}
                                title={t('accessibilityPanel.textSpacing')}
                                description={t('accessibilityPanel.textSpacingDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={textSpacing}
                                        onChange={toggleTextSpacing}
                                        ariaLabel="Augmenter l'espacement du texte"
                                    />
                                }
                            />

                            <FeatureCard
                                icon={Focus}
                                iconBg={focusHighlight ? 'bg-cyan-500' : 'bg-cyan-500/60'}
                                title={t('accessibilityPanel.focusHighlight')}
                                description={t('accessibilityPanel.focusHighlightDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={focusHighlight}
                                        onChange={toggleFocusHighlight}
                                        ariaLabel="Activer l'indicateur de focus"
                                    />
                                }
                            />

                            <FeatureCard
                                icon={Ruler}
                                iconBg={readingGuide ? 'bg-emerald-500' : 'bg-emerald-500/60'}
                                title={t('accessibilityPanel.readingGuide')}
                                description={t('accessibilityPanel.readingGuideDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={readingGuide}
                                        onChange={toggleReadingGuide}
                                        ariaLabel="Activer le guide de lecture"
                                    />
                                }
                            />

                            {/* Eye Tracking - Suivi oculaire avec le nez */}
                            <FeatureCard
                                icon={Eye}
                                iconBg={eyeTracking ? 'bg-green-500' : 'bg-green-500/60'}
                                title={quickLabels.eyeTrackingTitle}
                                description={quickLabels.eyeTrackingDesc}
                                action={
                                    <ToggleSwitch
                                        checked={eyeTracking}
                                        onChange={toggleEyeTracking}
                                        ariaLabel={quickLabels.eyeTrackingAria}
                                    />
                                }
                            />

                            {/* Eye Tracking active indicator */}
                            {eyeTracking && (
                                <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-lg bg-green-500/5 border border-green-500/20">
                                    <span className="relative flex h-[10px] w-[10px]">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-green-500" />
                                    </span>
                                    <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                                        {quickLabels.eyeTrackingActive}
                                    </span>
                                </div>
                            )}

                            {/* Color Blind Filter */}
                            <div className="p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <div className="flex items-center gap-[8px] mb-[10px]">
                                    <div className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-purple-500/10">
                                        <Palette size={15} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[14px] font-semibold text-[var(--foreground)]">{t('accessibilityPanel.colorBlind')}</span>
                                        <p className="text-[10px] text-[var(--muted-foreground)] leading-snug mt-[1px]">{t('accessibilityPanel.colorBlindDesc')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[4px]">
                                    {([
                                        { value: 'none', label: 'Aucun' },
                                        { value: 'protanopia', label: 'Protanopie' },
                                        { value: 'deuteranopia', label: 'Deutéranopie' },
                                        { value: 'tritanopia', label: 'Tritanopie' },
                                        { value: 'achromatopsia', label: 'Achromatopsie' },
                                    ] as const).map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setColorBlindFilter(f.value)}
                                            aria-pressed={colorBlindFilter === f.value}
                                            className={`
                                                py-[6px] px-[8px] rounded-lg text-[10px] font-semibold transition-all duration-200
                                                ${colorBlindFilter === f.value
                                                    ? 'bg-purple-500 text-white shadow-sm'
                                                    : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                                                }
                                            `}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* ══════════════════════════════════════════════════════════════
            TEXT-TO-SPEECH
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Volume2} label={t('accessibilityPanel.tts')} isOpen={openSections.tts} onToggle={() => toggle('tts')} />

                    {openSections.tts && (
                        <div className="flex flex-col gap-[8px]">
                            {/* Read selected text */}
                            <FeatureCard
                                icon={isSpeaking ? VolumeX : Volume2}
                                iconBg={isSpeaking ? 'bg-red-500' : 'bg-violet-500'}
                                title={isSpeaking ? t('accessibilityPanel.stopReading') : t('accessibilityPanel.readSelection')}
                                description={t('accessibilityPanel.readSelectionDesc')}
                                action={
                                    isSpeaking ? (
                                        <button
                                            onClick={stopSpeaking}
                                            aria-label="Arrêter la lecture (Alt+S)"
                                            className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
                                        >
                                            <VolumeX size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleReadSelected}
                                            aria-label="Lire le texte sélectionné (Alt+R)"
                                            className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    )
                                }
                            />

                            {/* Read entire page */}
                            <FeatureCard
                                icon={FileText}
                                iconBg="bg-indigo-500"
                                title={t('accessibilityPanel.readPage')}
                                description={t('accessibilityPanel.readPageDesc')}
                                action={
                                    <button
                                        onClick={speakPage}
                                        disabled={isSpeaking}
                                        aria-label="Lire toute la page (Alt+P)"
                                        className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <FileText size={18} />
                                    </button>
                                }
                            />

                            {/* Speech rate */}
                            <div className="p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <div className="flex items-center gap-[8px] mb-[8px]">
                                    <div className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-violet-500/10">
                                        <Gauge size={15} className="text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <span className="text-[13px] font-semibold text-[var(--foreground)] flex-1">{t('accessibilityPanel.speechRate')}</span>
                                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-[8px] py-[2px] rounded-full">
                                        {speechRate.toFixed(1)}x
                                    </span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <span className="text-[10px] text-[var(--muted-foreground)]">0.5x</span>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={speechRate}
                                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                        aria-label="Vitesse de lecture vocale"
                                        className="flex-1 h-[6px] rounded-full appearance-none bg-[var(--secondary)] accent-violet-500 cursor-pointer"
                                    />
                                    <span className="text-[10px] text-[var(--muted-foreground)]">2.0x</span>
                                </div>
                            </div>

                            {/* Active speaking indicator */}
                            {isSpeaking && (
                                <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-lg bg-violet-500/5 border border-violet-500/20">
                                    <span className="relative flex h-[10px] w-[10px]">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-violet-500" />
                                    </span>
                                    <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400">{t('accessibilityPanel.readingInProgress')}</span>
                                    <button
                                        onClick={stopSpeaking}
                                        className="ml-auto text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        {t('accessibilityPanel.stop')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ══════════════════════════════════════════════════════════════
            SPEECH-TO-TEXT / VOICE ASSISTANT
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Mic} label={t('accessibilityPanel.voiceActive')} isOpen={openSections.voice} onToggle={() => toggle('voice')} />

                    {openSections.voice && (
                        <div className="flex flex-col gap-[8px]">
                            <FeatureCard
                                icon={isListening ? MicOff : Mic}
                                iconBg={isListening ? 'bg-rose-500' : 'bg-sky-500'}
                                title={t('accessibilityPanel.voiceActive')}
                                description={t('accessibilityPanel.voiceDesc')}
                                action={
                                    <ToggleSwitch
                                        checked={isListening}
                                        onChange={isListening ? stopListening : startListening}
                                        ariaLabel={isListening ? quickLabels.voiceToggleOn : quickLabels.voiceToggleOff}
                                    />
                                }
                            />

                            {/* Listening indicator */}
                            {isListening && (
                                <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-lg bg-rose-500/5 border border-rose-500/20">
                                    <span className="relative flex h-[10px] w-[10px]">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-rose-500" />
                                    </span>
                                    <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{quickLabels.listening}</span>
                                </div>
                            )}

                            {/* Transcript */}
                            {spokenText && (
                                <div className="relative p-[12px] rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                                    <p className="text-[12px] text-[var(--foreground)] leading-relaxed pr-[24px]">{spokenText}</p>
                                    <button
                                        onClick={clearSpokenText}
                                        aria-label={quickLabels.clearTranscript}
                                        className="absolute top-[8px] right-[8px] w-[20px] h-[20px] flex items-center justify-center rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            )}

                            {/* Voice commands list */}
                            <button
                                onClick={() => setShowCommands(!showCommands)}
                                className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-lg text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                            >
                                <HelpCircle size={13} />
                                {t('accessibilityPanel.voiceCommands')}
                                {showCommands ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {showCommands && (
                                <div className="p-[12px] rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                                    <div className="space-y-[6px]">
                                        {voiceCommands.map((vc, i) => (
                                            <div key={i} className="flex items-start gap-[8px]">
                                                <span className="text-[10px] font-mono font-bold text-[var(--primary)] shrink-0 mt-[1px]">»</span>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-[var(--foreground)]">{vc.command}</span>
                                                    <span className="text-[10px] text-[var(--muted-foreground)]"> — {vc.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* ── Footer / Reset ──────────────────────────────────────────── */}
            <div className="px-[20px] pb-[16px] pt-[4px]">
                <button
                    onClick={handleResetAll}
                    className="
            w-full flex items-center justify-center gap-[8px]
            py-[10px] rounded-xl
            text-[12px] font-medium
            text-[var(--muted-foreground)]
            bg-[var(--secondary)] hover:bg-[var(--border)]
            border border-[var(--border)]
            transition-all duration-200
            hover:text-[var(--foreground)]
          "
                >
                    <RotateCcw size={13} />
                    {t('accessibilityPanel.resetAll')}
                </button>
            </div>
        </div>
    );
}
