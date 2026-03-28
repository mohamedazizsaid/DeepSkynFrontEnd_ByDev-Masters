import { useState, useCallback } from 'react';
import { signTranslationService, type SignTranslationResponse } from '../lib/services/sign-translation.service';

interface UseSignTranslationReturn {
  isLoading: boolean;
  error: string | null;
  data: SignTranslationResponse | null;
  translate: (text: string, language?: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook pour traduire un texte en langage des signes via le backend
 */
export function useSignTranslation(): UseSignTranslationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SignTranslationResponse | null>(null);

  const translate = useCallback(
    async (text: string, language: string = 'fr') => {
      if (!text?.trim()) {
        setError('Le texte ne peut pas être vide');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await signTranslationService.translateText(text, language);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la traduction');
        console.error('Translation error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    translate,
    reset,
  };
}
