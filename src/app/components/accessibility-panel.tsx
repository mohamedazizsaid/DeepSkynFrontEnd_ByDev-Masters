import React, { useCallback } from 'react';
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
} from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

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
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4]'
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
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({
    icon: Icon,
    label,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
}) {
    return (
        <div className="flex items-center gap-[8px] mb-[12px]">
            <Icon size={15} className="text-[var(--muted-foreground)]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {label}
            </span>
        </div>
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
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function AccessibilityPanel() {
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
        isPanelOpen,
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
        togglePanel,
        closePanel,
    } = useAccessibilityStore();

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

    // ── FAB ────────────────────────────────────────────────────────────────
    if (!isPanelOpen) {
        return (
            <button
                onClick={togglePanel}
                aria-label="Ouvrir le panneau d'accessibilité"
                className="
          fixed bottom-[24px] right-[24px] z-[9999]
          flex items-center justify-center w-[56px] h-[56px]
          rounded-full shadow-xl
          bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]
          text-white
          hover:scale-110 hover:shadow-2xl
          active:scale-95
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-4 focus:ring-[#0EA5E9]/40
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
        w-[340px] max-h-[85vh] overflow-y-auto
        rounded-2xl
        bg-[var(--background)]/95 backdrop-blur-2xl
        border border-[var(--border)]
        shadow-2xl
        animate-fade-in
      "
            role="dialog"
            aria-label="Panneau d'accessibilité"
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[16px]">
                <div className="flex items-center gap-[12px]">
                    <div className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] shadow-md">
                        <Accessibility size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-[var(--foreground)] leading-tight">Accessibilité</h2>
                        <p className="text-[10px] text-[var(--muted-foreground)]">Personnalisez votre expérience</p>
                    </div>
                </div>
                <button
                    onClick={closePanel}
                    aria-label="Fermer le panneau"
                    className="flex items-center justify-center w-[32px] h-[32px] rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="h-px bg-[var(--border)] mx-[20px]" />

            <div className="flex flex-col gap-[20px] p-[20px]">

                {/* ══════════════════════════════════════════════════════════════
            APPEARANCE
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Eye} label="Apparence" />

                    {/* Theme */}
                    <FeatureCard
                        icon={theme === 'dark' ? Moon : Sun}
                        iconBg={theme === 'dark' ? 'bg-indigo-500' : 'bg-amber-400'}
                        title="Mode sombre"
                        description={theme === 'dark' ? 'Thème sombre activé' : 'Thème clair activé'}
                        action={
                            <ToggleSwitch
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                                ariaLabel="Basculer le mode sombre"
                            />
                        }
                    />

                    {/* ── Contrast for low vision ─────────────────────────── */}
                    <div className="mt-[10px] p-[14px] rounded-xl bg-[var(--card)] border border-[var(--border)]">
                        <div className="flex items-center gap-[8px] mb-[12px]">
                            <div className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-yellow-500/10">
                                <Contrast size={15} className="text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[14px] font-semibold text-[var(--foreground)]">Contraste élevé</span>
                                <p className="text-[10px] text-[var(--muted-foreground)] leading-snug mt-[1px]">Améliore la lisibilité pour les malvoyants</p>
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
                                Normal
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
                                Moyen
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
                                Élevé
                            </button>
                        </div>

                        {contrastMode !== 'off' && (
                            <div className="mt-[8px] flex items-center gap-[6px] px-[10px] py-[6px] rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                <Contrast size={12} className="text-yellow-600 shrink-0" />
                                <span className="text-[10px] font-medium text-yellow-700">
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
                                    <Type size={15} className="text-emerald-600" />
                                </div>
                                <span className="text-[14px] font-semibold text-[var(--foreground)]">Taille du texte</span>
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
                                aria-label="Réduire le zoom"
                                className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <ZoomOut size={16} />
                            </button>

                            {/* Progress bar */}
                            <div className="flex-1 relative h-[8px] rounded-full bg-[var(--secondary)] overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] transition-all duration-300 ease-out"
                                    style={{ width: `${((zoomLevel - 75) / 75) * 100}%` }}
                                />
                            </div>

                            <button
                                onClick={zoomIn}
                                disabled={zoomLevel >= 150}
                                aria-label="Augmenter le zoom"
                                className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>

                        {zoomLevel !== 100 && (
                            <button
                                onClick={resetZoom}
                                className="flex items-center justify-center gap-[6px] mt-[10px] w-full py-[6px] text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-all duration-200"
                                aria-label="Réinitialiser le zoom"
                            >
                                <RotateCcw size={11} />
                                Réinitialiser à 100%
                            </button>
                        )}
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════════
            VISION & LECTURE — WCAG Features
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={BookOpen} label="Vision & lecture" />

                    <div className="flex flex-col gap-[8px]">
                        <FeatureCard
                            icon={Pause}
                            iconBg={reduceMotion ? 'bg-teal-500' : 'bg-teal-500/60'}
                            title="Réduire les animations"
                            description="Désactive les animations et transitions"
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
                            title="Police dyslexie"
                            description="Utilise une police adaptée aux dyslexiques"
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
                            title="Souligner les liens"
                            description="Rend les liens toujours visibles et soulignés"
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
                            title="Grand curseur"
                            description="Agrandit le curseur pour plus de visibilité"
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
                            title="Espacement du texte"
                            description="Augmente l'espacement des lignes et lettres"
                            action={
                                <ToggleSwitch
                                    checked={textSpacing}
                                    onChange={toggleTextSpacing}
                                    ariaLabel="Augmenter l'espacement du texte"
                                />
                            }
                        />
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════════
            TEXT-TO-SPEECH
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Volume2} label="Lecture vocale" />

                    <FeatureCard
                        icon={isSpeaking ? VolumeX : Volume2}
                        iconBg={isSpeaking ? 'bg-red-500' : 'bg-violet-500'}
                        title={isSpeaking ? 'Lecture en cours' : 'Lire le texte'}
                        description={
                            isSpeaking
                                ? 'Cliquez pour arrêter la lecture'
                                : 'Sélectionnez du texte puis activez'
                        }
                        action={
                            isSpeaking ? (
                                <button
                                    onClick={stopSpeaking}
                                    aria-label="Arrêter la lecture"
                                    className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <VolumeX size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleReadSelected}
                                    aria-label="Lire le texte sélectionné"
                                    className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <Volume2 size={18} />
                                </button>
                            )
                        }
                    />
                </section>

                {/* ══════════════════════════════════════════════════════════════
            SPEECH-TO-TEXT
           ══════════════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={Mic} label="Assistant vocal" />

                    <FeatureCard
                        icon={isListening ? MicOff : Mic}
                        iconBg={isListening ? 'bg-rose-500' : 'bg-sky-500'}
                        title="Assistant vocal"
                        description={
                            isListening
                                ? 'Dites une commande pour naviguer'
                                : 'Appuyez pour commencer la dictée'
                        }
                        action={
                            <ToggleSwitch
                                checked={isListening}
                                onChange={isListening ? stopListening : startListening}
                                ariaLabel={isListening ? "Arrêter l'écoute" : "Démarrer l'écoute"}
                            />
                        }
                    />

                    {/* Listening indicator */}
                    {isListening && (
                        <div className="mt-[8px] flex items-center gap-[8px] px-[12px] py-[8px] rounded-lg bg-rose-500/5 border border-rose-500/20">
                            <span className="relative flex h-[10px] w-[10px]">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-rose-500" />
                            </span>
                            <span className="text-[11px] font-medium text-rose-600">Écoute en cours…</span>
                        </div>
                    )}

                    {/* Transcript */}
                    {spokenText && (
                        <div className="relative mt-[8px] p-[12px] rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                            <p className="text-[12px] text-[var(--foreground)] leading-relaxed pr-[24px]">{spokenText}</p>
                            <button
                                onClick={clearSpokenText}
                                aria-label="Effacer le texte dicté"
                                className="absolute top-[8px] right-[8px] w-[20px] h-[20px] flex items-center justify-center rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X size={10} />
                            </button>
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
                    Réinitialiser les paramètres
                </button>
            </div>
        </div>
    );
}
