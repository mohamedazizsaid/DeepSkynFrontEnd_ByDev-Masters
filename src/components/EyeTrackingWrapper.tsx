import React, { useEffect } from 'react';
import { EyeTrackingProvider, useEyeTracking } from './EyeTrackingContext';
import { useAccessibilityStore } from '../stores/accessibility.store';

/**
 * Composant bridge qui connecte le store d'accessibilité au contexte Eye Tracking
 * Il écoute les changements du store et synchronise avec le provider
 */
const EyeTrackingBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsEnabled } = useEyeTracking();
  const { eyeTracking, setEyeTracking } = useAccessibilityStore();

  // Synchroniser l'état initial
  useEffect(() => {
    setIsEnabled(eyeTracking);
  }, [eyeTracking, setIsEnabled]);

  // Écouter les événements du store
  useEffect(() => {
    const handleToggle = (event: CustomEvent<{ enabled: boolean }>) => {
      setIsEnabled(event.detail.enabled);
    };

    window.addEventListener('eye-tracking-toggle', handleToggle as EventListener);
    
    return () => {
      window.removeEventListener('eye-tracking-toggle', handleToggle as EventListener);
    };
  }, [setIsEnabled]);

  return <>{children}</>;
};

/**
 * Wrapper qui englobe l'application avec le Eye Tracking Provider
 * À utiliser dans App.tsx
 */
export const EyeTrackingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <EyeTrackingProvider>
      <EyeTrackingBridge>
        {children}
      </EyeTrackingBridge>
    </EyeTrackingProvider>
  );
};

export default EyeTrackingWrapper;
