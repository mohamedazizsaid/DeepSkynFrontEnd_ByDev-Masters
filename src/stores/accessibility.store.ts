import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Speech Recognition type (vendor-prefixed in most browsers) ──────────
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

type SpeechRecognitionInstance = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
};

import { Language, translations, TranslationKeys } from '../lib/i18n/translations';

// ── Store interface ─────────────────────────────────────────────────────
type ContrastMode = 'off' | 'medium' | 'high';
type ColorBlindFilter = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

interface AccessibilityState {
    // State
    language: Language;
    theme: 'light' | 'dark';
    contrastMode: ContrastMode;
    zoomLevel: number;
    reduceMotion: boolean;
    dyslexiaFont: boolean;
    linkHighlight: boolean;
    bigCursor: boolean;
    textSpacing: boolean;
    isSpeaking: boolean;
    isListening: boolean;
    spokenText: string;
    isPanelOpen: boolean;
    focusHighlight: boolean;
    colorBlindFilter: ColorBlindFilter;
    readingGuide: boolean;
    speechRate: number;
    eyeTracking: boolean;

    // Actions
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => any;
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setContrastMode: (mode: ContrastMode) => void;
    resetContrastMode: () => void;
    toggleReduceMotion: () => void;
    toggleDyslexiaFont: () => void;
    toggleLinkHighlight: () => void;
    toggleBigCursor: () => void;
    toggleTextSpacing: () => void;
    toggleFocusHighlight: () => void;
    setColorBlindFilter: (filter: ColorBlindFilter) => void;
    toggleReadingGuide: () => void;
    setSpeechRate: (rate: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    speak: (text: string) => void;
    speakPage: () => void;
    stopSpeaking: () => void;
    startListening: () => void;
    stopListening: () => void;
    clearSpokenText: () => void;
    processVoiceCommand: (command: string) => void;
    togglePanel: () => void;
    closePanel: () => void;
    toggleEyeTracking: () => void;
    setEyeTracking: (enabled: boolean) => void;
}

// Keep recognition instance outside React lifecycle
let recognitionInstance: SpeechRecognitionInstance | null = null;

// ── ARIA Live Region for screen reader announcements ────────────────────
function announce(message: string) {
    let el = document.getElementById('a11y-live-announcer');
    if (!el) {
        el = document.createElement('div');
        el.id = 'a11y-live-announcer';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.style.cssText =
            'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);border:0;';
        document.body.appendChild(el);
    }
    // Force re-announce by toggling content
    el.textContent = '';
    requestAnimationFrame(() => {
        el!.textContent = message;
    });
}

// ── Helpers ─────────────────────────────────────────────────────────────
function applyTheme(theme: 'light' | 'dark') {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

function applyContrast(mode: ContrastMode) {
    const root = document.documentElement;
    root.classList.remove('high-contrast-medium', 'high-contrast-high');
    if (mode === 'medium') {
        root.classList.add('high-contrast-medium');
    } else if (mode === 'high') {
        root.classList.add('high-contrast-high');
    }
}

function applyZoom(zoomLevel: number) {
    document.documentElement.style.setProperty('--font-size', `${zoomLevel}%`);
}

function toggleCssClass(className: string, enabled: boolean) {
    const root = document.documentElement;
    if (enabled) {
        root.classList.add(className);
    } else {
        root.classList.remove(className);
    }
}

function applyColorBlindFilter(filter: ColorBlindFilter) {
    const root = document.documentElement;
    root.classList.remove('cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia', 'cb-achromatopsia');
    if (filter !== 'none') {
        root.classList.add(`cb-${filter}`);
    }
}

function applyLanguageDir(lang: Language) {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

// ── Extract page text for TTS ───────────────────────────────────────────
function getPageText(): string {
    const main = document.querySelector('main') || document.body;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            const el = node.parentElement;
            if (!el) return NodeFilter.FILTER_REJECT;
            const tag = el.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'svg'].includes(tag)) return NodeFilter.FILTER_REJECT;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
            if ((node.textContent || '').trim().length === 0) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const parts: string[] = [];
    while (walker.nextNode()) {
        parts.push((walker.currentNode.textContent || '').trim());
    }
    return parts.join('. ');
}

// ── Store ───────────────────────────────────────────────────────────────
export const useAccessibilityStore = create<AccessibilityState>()(
    persist(
        (set, get) => ({
            language: 'fr',
            theme: 'light',
            contrastMode: 'off',
            zoomLevel: 100,
            reduceMotion: false,
            dyslexiaFont: false,
            linkHighlight: false,
            bigCursor: false,
            textSpacing: false,
            isSpeaking: false,
            isListening: false,
            spokenText: '',
            isPanelOpen: false,
            focusHighlight: false,
            colorBlindFilter: 'none' as ColorBlindFilter,
            readingGuide: false,
            speechRate: 1,
            eyeTracking: false,

            setLanguage: (lang) => {
                set({ language: lang });
                applyLanguageDir(lang);
                if (get().isSpeaking) get().stopSpeaking(); // Stop speech if language changes
            },

            t: (keyPath: string, params?: Record<string, string | number>) => {
                const lang = get().language;
                const path = keyPath.split('.');
                
                const translateWithPath = (dict: any, p: string[]) => {
                    let curr = dict;
                    for (const k of p) {
                        if (curr?.[k] === undefined) return null;
                        curr = curr[k];
                    }
                    return curr;
                };

                let val = translateWithPath(translations[lang], path);
                if (val === null) {
                    val = translateWithPath(translations['fr'], path);
                }

                if (val === null) return keyPath;

                if (params && typeof val === 'string') {
                    let result = val;
                    Object.entries(params).forEach(([k, v]) => {
                        result = result.replace(`{${k}}`, v.toString());
                    });
                    return result;
                }
                return val;
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                applyTheme(newTheme);
                set({ theme: newTheme });
                const { t } = get();
                announce(newTheme === 'dark' ? t('accessibilityPanel.darkModeOn') : t('accessibilityPanel.lightModeOn'));
            },

            setTheme: (theme) => {
                applyTheme(theme);
                set({ theme });
            },

            setContrastMode: (mode) => {
                applyContrast(mode);
                set({ contrastMode: mode });
                const { t } = get();
                announce(t('accessibilityPanel.announcements.contrastSet', { mode: t(`accessibilityPanel.contrastLabels.${mode}`) }));
            },

            resetContrastMode: () => {
                applyContrast('off');
                set({ contrastMode: 'off' });
            },

            toggleReduceMotion: () => {
                const next = !get().reduceMotion;
                toggleCssClass('reduce-motion', next);
                set({ reduceMotion: next });
                const { t } = get();
                announce(next ? t('accessibilityPanel.announcements.animationsReduced') : t('accessibilityPanel.announcements.animationsEnabled'));
            },

            toggleDyslexiaFont: () => {
                const next = !get().dyslexiaFont;
                toggleCssClass('dyslexia-font', next);
                set({ dyslexiaFont: next });
                announce(next ? 'Police dyslexie activée' : 'Police dyslexie désactivée');
            },

            toggleLinkHighlight: () => {
                const next = !get().linkHighlight;
                toggleCssClass('link-highlight', next);
                set({ linkHighlight: next });
            },

            toggleBigCursor: () => {
                const next = !get().bigCursor;
                toggleCssClass('big-cursor', next);
                set({ bigCursor: next });
            },

            toggleTextSpacing: () => {
                const next = !get().textSpacing;
                toggleCssClass('text-spacing', next);
                set({ textSpacing: next });
            },

            toggleFocusHighlight: () => {
                const next = !get().focusHighlight;
                toggleCssClass('focus-highlight', next);
                set({ focusHighlight: next });
                announce(next ? 'Indicateur de focus activé' : 'Indicateur de focus désactivé');
            },

            setColorBlindFilter: (filter) => {
                applyColorBlindFilter(filter);
                set({ colorBlindFilter: filter });
                const labels: Record<ColorBlindFilter, string> = {
                    none: 'Aucun filtre',
                    protanopia: 'Protanopie',
                    deuteranopia: 'Deutéranopie',
                    tritanopia: 'Tritanopie',
                    achromatopsia: 'Achromatopsie',
                };
                announce(`Filtre daltonisme: ${labels[filter]}`);
            },

            toggleReadingGuide: () => {
                const next = !get().readingGuide;
                toggleCssClass('reading-guide', next);
                set({ readingGuide: next });
                announce(next ? 'Guide de lecture activé' : 'Guide de lecture désactivé');
            },

            setSpeechRate: (rate) => {
                set({ speechRate: rate });
            },

            zoomIn: () => {
                const next = Math.min(get().zoomLevel + 10, 150);
                applyZoom(next);
                set({ zoomLevel: next });
                announce(`Zoom ${next}%`);
            },

            zoomOut: () => {
                const next = Math.max(get().zoomLevel - 10, 75);
                applyZoom(next);
                set({ zoomLevel: next });
                announce(`Zoom ${next}%`);
            },

            resetZoom: () => {
                applyZoom(100);
                set({ zoomLevel: 100 });
                announce('Zoom réinitialisé à 100%');
            },

            // ── Text-to-Speech ────────────────────────────────────────────
            speak: (text: string) => {
                if (!('speechSynthesis' in window)) {
                    announce('La synthèse vocale n\'est pas supportée par votre navigateur');
                    return;
                }
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'fr-FR';
                utterance.rate = get().speechRate;
                utterance.pitch = 1;
                utterance.volume = 1;

                // Try to pick a French voice
                const voices = window.speechSynthesis.getVoices();
                const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
                if (frenchVoice) utterance.voice = frenchVoice;

                utterance.onend = () => set({ isSpeaking: false });
                utterance.onerror = () => set({ isSpeaking: false });
                window.speechSynthesis.speak(utterance);
                set({ isSpeaking: true });
                announce('Lecture vocale démarrée');
            },

            speakPage: () => {
                const text = getPageText();
                if (text.length > 0) {
                    get().speak(text);
                } else {
                    announce('Aucun contenu à lire sur cette page');
                }
            },

            stopSpeaking: () => {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                set({ isSpeaking: false });
                announce('Lecture vocale arrêtée');
            },

            // ── Speech-to-Text with voice command processing ─────────────
            startListening: () => {
                const SpeechRecognition =
                    (window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition;

                if (!SpeechRecognition) {
                    announce('La reconnaissance vocale n\'est pas supportée par votre navigateur');
                    return;
                }

                // Stop existing instance if any
                if (recognitionInstance) {
                    recognitionInstance.stop();
                }

                const recognition: SpeechRecognitionInstance = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'fr-FR';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    set({ spokenText: finalTranscript || interimTranscript });

                    // Process voice commands when final
                    if (finalTranscript) {
                        get().processVoiceCommand(finalTranscript.toLowerCase().trim());
                    }
                };

                recognition.onerror = () => {
                    set({ isListening: false });
                    recognitionInstance = null;
                    announce('Erreur de reconnaissance vocale');
                };

                recognition.onend = () => {
                    set({ isListening: false });
                    recognitionInstance = null;
                };

                recognitionInstance = recognition;
                recognition.start();
                set({ isListening: true, spokenText: '' });
                announce('Écoute en cours. Dites une commande.');
            },

            stopListening: () => {
                if (recognitionInstance) {
                    recognitionInstance.stop();
                    recognitionInstance = null;
                }
                set({ isListening: false });
                announce('Écoute arrêtée');
            },

            clearSpokenText: () => set({ spokenText: '' }),

            // ── Voice Command Processing ──────────────────────────────────
            processVoiceCommand: (command: string) => {
                const state = get();

                // Navigation commands
                if (command.includes('accueil') || command.includes('tableau de bord') || command.includes('dashboard')) {
                    announce('Navigation vers le tableau de bord');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'dashboard' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                if (command.includes('analyse') || command.includes('analyser')) {
                    announce('Navigation vers l\'analyse');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'analysis' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                if (command.includes('routine') || command.includes('routines')) {
                    announce('Navigation vers les routines');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'routine' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                if (command.includes('profil')) {
                    announce('Navigation vers le profil');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'profile' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                if (command.includes('communauté') || command.includes('communaute')) {
                    announce('Navigation vers la communauté');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'community' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                if (command.includes('météo') || command.includes('meteo') || command.includes('temps')) {
                    announce('Navigation vers la météo');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'meteo' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                if (command.includes('paramètre') || command.includes('réglage') || command.includes('settings')) {
                    announce('Navigation vers les paramètres');
                    const navEvent = new CustomEvent('a11y-navigate', { detail: { page: 'settings' } });
                    window.dispatchEvent(navEvent);
                    return;
                }

                // Feature toggle commands
                if (command.includes('mode sombre') || command.includes('mode noir') || command.includes('dark mode')) {
                    if (state.theme !== 'dark') state.toggleTheme();
                    return;
                }
                if (command.includes('mode clair') || command.includes('mode jour') || command.includes('light mode')) {
                    if (state.theme !== 'light') state.toggleTheme();
                    return;
                }

                if (command.includes('zoom plus') || command.includes('agrandir') || command.includes('plus grand')) {
                    state.zoomIn();
                    return;
                }
                if (command.includes('zoom moins') || command.includes('réduire') || command.includes('plus petit')) {
                    state.zoomOut();
                    return;
                }

                if (command.includes('lire la page') || command.includes('lis la page') || command.includes('lecture page')) {
                    state.speakPage();
                    return;
                }

                if (command.includes('arrêter') || command.includes('stop') || command.includes('arrête')) {
                    if (state.isSpeaking) state.stopSpeaking();
                    return;
                }

                if (command.includes('contraste élevé') || command.includes('haut contraste')) {
                    state.setContrastMode('high');
                    return;
                }
                if (command.includes('contraste moyen')) {
                    state.setContrastMode('medium');
                    return;
                }
                if (command.includes('contraste normal')) {
                    state.setContrastMode('off');
                    return;
                }

                if (command.includes('aide') || command.includes('commandes')) {
                    announce('Commandes disponibles: accueil, analyse, routine, profil, communauté, météo, mode sombre, mode clair, zoom plus, zoom moins, lire la page, arrêter, contraste élevé, contraste moyen, contraste normal');
                    return;
                }

                // If no command matched
                announce(`Commande non reconnue: ${command}. Dites "aide" pour la liste des commandes.`);
            },

            togglePanel: () => set({ isPanelOpen: !get().isPanelOpen }),
            closePanel: () => set({ isPanelOpen: false }),

            toggleEyeTracking: () => {
                const next = !get().eyeTracking;
                set({ eyeTracking: next });
                // Émettre un événement personnalisé pour que EyeTrackingProvider puisse réagir
                const event = new CustomEvent('eye-tracking-toggle', { detail: { enabled: next } });
                window.dispatchEvent(event);
                announce(next ? 'Suivi oculaire activé. Bougez votre tête pour contrôler le curseur.' : 'Suivi oculaire désactivé');
            },

            setEyeTracking: (enabled: boolean) => {
                set({ eyeTracking: enabled });
                const event = new CustomEvent('eye-tracking-toggle', { detail: { enabled } });
                window.dispatchEvent(event);
            },
        }),
        {
            name: 'deepskyn-accessibility',
            partialize: (state) => ({
                theme: state.theme,
                contrastMode: state.contrastMode,
                zoomLevel: state.zoomLevel,
                reduceMotion: state.reduceMotion,
                dyslexiaFont: state.dyslexiaFont,
                linkHighlight: state.linkHighlight,
                bigCursor: state.bigCursor,
                textSpacing: state.textSpacing,
                focusHighlight: state.focusHighlight,
                colorBlindFilter: state.colorBlindFilter,
                readingGuide: state.readingGuide,
                speechRate: state.speechRate,
            }),
        }
    )
);

// ── Apply persisted preferences on initial load ─────────────────────────
try {
    const stored = localStorage.getItem('deepskyn-accessibility');
    if (stored) {
        const parsed = JSON.parse(stored);
        const state = parsed?.state;
        if (state) {
            if (state.theme) applyTheme(state.theme);
            if (state.contrastMode) applyContrast(state.contrastMode);
            if (state.zoomLevel) applyZoom(state.zoomLevel);
            if (state.reduceMotion) toggleCssClass('reduce-motion', true);
            if (state.dyslexiaFont) toggleCssClass('dyslexia-font', true);
            if (state.linkHighlight) toggleCssClass('link-highlight', true);
            if (state.bigCursor) toggleCssClass('big-cursor', true);
            if (state.textSpacing) toggleCssClass('text-spacing', true);
            if (state.focusHighlight) toggleCssClass('focus-highlight', true);
            if (state.colorBlindFilter && state.colorBlindFilter !== 'none') applyColorBlindFilter(state.colorBlindFilter);
            if (state.readingGuide) toggleCssClass('reading-guide', true);
        }
    }
} catch {
    // Ignore parse errors
}
