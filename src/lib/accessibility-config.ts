/**
 * Configuration et optimisations de performance pour le système d'accessibilité vidéo
 */

/**
 * Configuration des paramètres de performance
 */
export const ACCESSIBILITY_CONFIG = {
  // Speech-to-Text
  SPEECH_CHUNK_SIZE: 1000, // ms
  SPEECH_TIMEOUT: 60000, // ms
  SPEECH_LANGUAGE: 'fr-FR',

  // Avatar 3D
  AVATAR_LOD: {
    HIGH: { handSegments: 256, bodySegments: 128 },
    MEDIUM: { handSegments: 128, bodySegments: 64 },
    LOW: { handSegments: 64, bodySegments: 32 },
  },

  // Animations de gestes
  GESTURE_DURATION_MIN: 300, // ms
  GESTURE_DURATION_MAX: 2000, // ms
  GESTURE_IDLE_TIME: 200, // ms entre les gestes

  // Cache
  CACHE_MAX_SIZE: 100, // nombre d'éléments en cache
  CACHE_TTL: 3600000, // 1 heure en ms

  // Performance
  TARGET_FPS: 60,
  ENABLE_GPU_RENDERING: true,
};

/**
 * Déterminer le niveau de détail (LOD) basé sur les capacités de l'appareil
 */
export function detectDeviceCapabilities(): 'high' | 'medium' | 'low' {
  // Vérifier la RAM disponible
  if ((navigator as any).deviceMemory) {
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory >= 8) return 'high';
    if (deviceMemory >= 4) return 'medium';
    return 'low';
  }

  // Vérifier les capacités GPU (fallback)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) return 'low';

  const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  if (maxTextures >= 16) return 'high';
  if (maxTextures >= 8) return 'medium';
  return 'low';
}

/**
 * Optimiser les gestes en fonction du niveau de détail
 */
export function optimizeGesturesForDevice(gestures: any[], lod: 'high' | 'medium' | 'low'): any[] {
  if (lod === 'high') return gestures;

  return gestures.map((gesture) => {
    const simplified = { ...gesture };

    // Réduire la complexité des gestes
    if (lod === 'medium') {
      simplified.movement.duration = Math.max(
        gesture.movement.duration * 0.8,
        ACCESSIBILITY_CONFIG.GESTURE_DURATION_MIN
      );
    } else if (lod === 'low') {
      simplified.movement.duration = ACCESSIBILITY_CONFIG.GESTURE_DURATION_MIN;
      simplified.movement.hands = simplified.movement.hands.slice(0, 1); // Une seule main
    }

    return simplified;
  });
}

/**
 * Mesurer les performances de rendu
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private onFPSChange?: (fps: number) => void;

  constructor(onFPSChange?: (fps: number) => void) {
    this.onFPSChange = onFPSChange;
  }

  recordFrame() {
    this.frameCount++;
    const now = performance.now();
    const deltaTime = now - this.lastTime;

    if (deltaTime >= 1000) {
      this.fps = (this.frameCount * 1000) / deltaTime;
      if (this.onFPSChange) {
        this.onFPSChange(this.fps);
      }
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  getFPS(): number {
    return this.fps;
  }

  /**
   * Recommander un ajustement de LOD basé sur le FPS
   */
  suggestLODAdjustment(currentLOD: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' | null {
    // Si FPS < 30, réduire le LOD
    if (this.fps < 30) {
      if (currentLOD === 'high') return 'medium';
      if (currentLOD === 'medium') return 'low';
    }

    // Si FPS > 50, augmenter le LOD
    if (this.fps > 50) {
      if (currentLOD === 'low') return 'medium';
      if (currentLOD === 'medium') return 'high';
    }

    return null;
  }
}

/**
 * Cache intelligent pour les gestes
 */
export class GestureCache {
  private cache = new Map<string, any>();
  private maxSize: number;
  private accessCount = new Map<string, number>();

  constructor(maxSize: number = ACCESSIBILITY_CONFIG.CACHE_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  set(key: string, value: any) {
    // Si le cache est plein, supprimer l'élément le moins utilisé
    if (this.cache.size >= this.maxSize) {
      let leastUsed = '';
      let minAccess = Infinity;

      for (const [k, count] of this.accessCount) {
        if (count < minAccess) {
          minAccess = count;
          leastUsed = k;
        }
      }

      if (leastUsed) {
        this.cache.delete(leastUsed);
        this.accessCount.delete(leastUsed);
      }
    }

    this.cache.set(key, value);
    this.accessCount.set(key, 0);
  }

  get(key: string): any | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Incrémenter le compteur d'accès
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    }
    return value;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.accessCount.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Singleton pour le moniteur de performance global
 */
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export function getGlobalPerformanceMonitor(): PerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
  }
  return globalPerformanceMonitor;
}

/**
 * Vérifier le support du Web Speech API
 */
export function isSpeechAPISupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition
  );
}

/**
 * Vérifier le support de Web GL
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('webgl2')));
  } catch {
    return false;
  }
}
