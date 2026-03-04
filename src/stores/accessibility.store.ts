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

// ── Store interface ─────────────────────────────────────────────────────
type ContrastMode = 'off' | 'medium' | 'high';

interface AccessibilityState {
    // State
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

    // Actions
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setContrastMode: (mode: ContrastMode) => void;
    resetContrastMode: () => void;
    toggleReduceMotion: () => void;
    toggleDyslexiaFont: () => void;
    toggleLinkHighlight: () => void;
    toggleBigCursor: () => void;
    toggleTextSpacing: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
    startListening: () => void;
    stopListening: () => void;
    clearSpokenText: () => void;
    togglePanel: () => void;
    closePanel: () => void;
}

// Keep recognition instance outside React lifecycle
let recognitionInstance: SpeechRecognitionInstance | null = null;

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

// ── Store ───────────────────────────────────────────────────────────────
export const useAccessibilityStore = create<AccessibilityState>()(
    persist(
        (set, get) => ({
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

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                applyTheme(newTheme);
                set({ theme: newTheme });
            },

            setTheme: (theme) => {
                applyTheme(theme);
                set({ theme });
            },

            setContrastMode: (mode) => {
                applyContrast(mode);
                set({ contrastMode: mode });
            },

            resetContrastMode: () => {
                applyContrast('off');
                set({ contrastMode: 'off' });
            },

            toggleReduceMotion: () => {
                const next = !get().reduceMotion;
                toggleCssClass('reduce-motion', next);
                set({ reduceMotion: next });
            },

            toggleDyslexiaFont: () => {
                const next = !get().dyslexiaFont;
                toggleCssClass('dyslexia-font', next);
                set({ dyslexiaFont: next });
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

            zoomIn: () => {
                const next = Math.min(get().zoomLevel + 10, 150);
                applyZoom(next);
                set({ zoomLevel: next });
            },

            zoomOut: () => {
                const next = Math.max(get().zoomLevel - 10, 75);
                applyZoom(next);
                set({ zoomLevel: next });
            },

            resetZoom: () => {
                applyZoom(100);
                set({ zoomLevel: 100 });
            },

            // ── Text-to-Speech ────────────────────────────────────────────
            speak: (text: string) => {
                if (!('speechSynthesis' in window)) return;
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'fr-FR'; // Default to French for DeepSkyn
                utterance.rate = 0.95;
                utterance.onend = () => set({ isSpeaking: false });
                utterance.onerror = () => set({ isSpeaking: false });
                window.speechSynthesis.speak(utterance);
                set({ isSpeaking: true });
            },

            stopSpeaking: () => {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                set({ isSpeaking: false });
            },

            // ── Speech-to-Text ────────────────────────────────────────────
            startListening: () => {
                const SpeechRecognition =
                    (window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition;

                if (!SpeechRecognition) return;

                // Stop existing instance if any
                if (recognitionInstance) {
                    recognitionInstance.stop();
                }

                const recognition: SpeechRecognitionInstance = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'fr-FR';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                    }
                    set({ spokenText: transcript });
                };

                recognition.onerror = () => {
                    set({ isListening: false });
                    recognitionInstance = null;
                };

                recognition.onend = () => {
                    set({ isListening: false });
                    recognitionInstance = null;
                };

                recognitionInstance = recognition;
                recognition.start();
                set({ isListening: true, spokenText: '' });
            },

            stopListening: () => {
                if (recognitionInstance) {
                    recognitionInstance.stop();
                    recognitionInstance = null;
                }
                set({ isListening: false });
            },

            clearSpokenText: () => set({ spokenText: '' }),

            togglePanel: () => set({ isPanelOpen: !get().isPanelOpen }),
            closePanel: () => set({ isPanelOpen: false }),
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
        }
    }
} catch {
    // Ignore parse errors
}
