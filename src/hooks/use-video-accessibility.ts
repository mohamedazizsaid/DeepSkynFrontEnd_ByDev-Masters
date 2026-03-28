/**
 * Hook personnalisé pour la traduction vidéo accessible
 * Gère l'état et les performances
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getSpeechToTextService } from '../lib/services/speech-to-text.service';
import { getSignLanguageService } from '../lib/services/sign-language.service';
import type { GestureData } from '../lib/services/sign-language.service';

interface UseVideoAccessibilityOptions {
  autoStart?: boolean;
  language?: string;
  cacheGestures?: boolean;
}

export function useVideoAccessibility(options: UseVideoAccessibilityOptions = {}) {
  const {
    autoStart = false,
    language = 'fr-FR',
    cacheGestures = true,
  } = options;

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [gestures, setGestures] = useState<GestureData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const speechService = useMemo(() => getSpeechToTextService(), []);
  const signLanguageService = useMemo(() => getSignLanguageService(), []);

  // Cache pour les gestes traduits (optimisation)
  const gestureCache = useRef<Map<string, GestureData[]>>(new Map());

  /**
   * Traduire le texte en gestes (avec cache)
   */
  const translateText = useCallback(
    (text: string): GestureData[] => {
      // Vérifier le cache
      if (cacheGestures && gestureCache.current.has(text)) {
        return gestureCache.current.get(text)!;
      }

      // Traduire
      const translatedGestures = signLanguageService.translateToGestures(text, language);

      // Sauvegarder en cache
      if (cacheGestures) {
        gestureCache.current.set(text, translatedGestures);
      }

      return translatedGestures;
    },
    [signLanguageService, language, cacheGestures]
  );

  /**
   * Démarrer la traduction
   */
  const startTranscription = useCallback(
    async (audioElement: HTMLAudioElement | HTMLVideoElement) => {
      if (!audioElement || isTranscribing) return;

      setIsTranscribing(true);
      setError(null);
      setTranscription('');
      setGestures([]);

      try {
        const text = await speechService.transcribeAudioElement(
          audioElement,
          {
            language,
            continuous: true,
            interimResults: true,
          },
          {
            onResult: (result) => {
              setTranscription(result.text);
              setProgress(result.isFinal ? 100 : 50);

              // Traduire immédiatement en gestes
              const translatedGestures = translateText(result.text);
              setGestures(translatedGestures);
            },
            onError: (err) => {
              setError(err);
              console.error('Erreur de traduction:', err);
            },
            onComplete: (finalText) => {
              setTranscription(finalText);
              setProgress(100);
              const translatedGestures = translateText(finalText);
              setGestures(translatedGestures);
            },
          }
        );

        return text;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setIsTranscribing(false);
      }
    },
    [speechService, language, isTranscribing, translateText]
  );

  /**
   * Arrêter la traduction
   */
  const stopTranscription = useCallback(() => {
    speechService.stop();
    setIsTranscribing(false);
  }, [speechService]);

  /**
   * Réinitialiser l'état
   */
  const reset = useCallback(() => {
    setTranscription('');
    setGestures([]);
    setError(null);
    setProgress(0);
    setIsTranscribing(false);
    speechService.stop();
  }, [speechService]);

  /**
   * Nettoyer les ressources
   */
  useEffect(() => {
    return () => {
      speechService.stop();
      gestureCache.current.clear();
    };
  }, [speechService]);

  return {
    isTranscribing,
    transcription,
    gestures,
    error,
    progress,
    startTranscription,
    stopTranscription,
    reset,
    translateText,
  };
}

export type { UseVideoAccessibilityOptions };
