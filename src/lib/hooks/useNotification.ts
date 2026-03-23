import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for showing notifications
 */
export const useNotification = () => {
  const toastIdRef = useRef<string | null>(null);

  const show = useCallback((message: string, type: 'success' | 'error' | 'loading' = 'success') => {
    if (toastIdRef.current) {
      toast.remove(toastIdRef.current);
    }

    toastIdRef.current = toast[type](message);
    return toastIdRef.current;
  }, []);

  const success = useCallback((message: string) => show(message, 'success'), [show]);
  const error = useCallback((message: string) => show(message, 'error'), [show]);
  const loading = useCallback((message: string) => show(message, 'loading'), [show]);

  return {
    show,
    success,
    error,
    loading,
  };
};
