/**
 * Index d'export pour le système d'accessibilité vidéo
 */

// Services
export { getSpeechToTextService, SpeechToTextService } from '@/lib/services/speech-to-text.service';
export type { TranscriptionResult, SpeechServiceConfig } from '@/lib/services/speech-to-text.service';

export { getSignLanguageService, SignLanguageService } from '@/lib/services/sign-language.service';
export type { GestureData, HandGesture, FingerPosition } from '@/lib/services/sign-language.service';

// Composants
export { SignLanguageAvatarCanvas } from '@/components/3d/sign-language-avatar-canvas';
export { VideoAccessibilityPlayer } from '@/components/video/video-accessibility-player';
export { AvatarGestureMesh } from '@/components/3d/avatar-gesture-mesh';

// Hooks
export { useVideoAccessibility } from '@/hooks/use-video-accessibility';
export type { UseVideoAccessibilityOptions } from '@/hooks/use-video-accessibility';

// Configuration
export {
  ACCESSIBILITY_CONFIG,
  detectDeviceCapabilities,
  optimizeGesturesForDevice,
  PerformanceMonitor,
  GestureCache,
  getGlobalPerformanceMonitor,
  isSpeechAPISupported,
  isWebGLSupported,
} from '@/lib/accessibility-config';
