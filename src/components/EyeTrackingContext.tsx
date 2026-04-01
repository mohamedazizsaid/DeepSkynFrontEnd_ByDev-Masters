import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';

/**
 * Contexte global pour le suivi de la tête (nose tracking)
 * Le curseur suit le mouvement de la tête (haut/bas/gauche/droite)
 * Les clics se font par immobilité du curseur (3 secondes)
 */

interface EyeStatus {
  left: 'open' | 'closed';
  right: 'open' | 'closed';
}

interface CursorPosition {
  x: number;
  y: number;
}

interface EyeTrackingContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  cursorPos: CursorPosition;
  eyeStatus: EyeStatus;
  isLoading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isEyeClosed: (eye: 'left' | 'right') => boolean;
}

const EyeTrackingContext = createContext<EyeTrackingContextType | null>(null);

interface EyeTrackingProviderProps {
  children: ReactNode;
}

export const EyeTrackingProvider: React.FC<EyeTrackingProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [cursorPos, setCursorPos] = useState<CursorPosition>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
  });
  const [eyeStatus, setEyeStatus] = useState<EyeStatus>({ left: 'open', right: 'open' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<any>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const previousCursorPosRef = useRef<CursorPosition>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
  });

  // Refs pour détection de clic par immobilité
  const cursorStabilityRef = useRef({
    lastPos: { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300 },
    stableStartTime: null as number | null,
    isStable: false,
    threshold: 30,
    stableDuration: 3000,
    clickType: 'left' as 'left' | 'right'
  });

  // Facteur de lissage du curseur
  const SMOOTHING_FACTOR = 0.05;

  // Variables de calibration de la tête
  const headCalibrationRef = useRef({
    isCalibrating: false,
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    dataPoints: [] as { x: number; y: number }[]
  });

  // Simuler un clic souris
  const simulateClick = (x: number, y: number, button: 'left' | 'right' = 'left') => {
    if (!isFinite(x) || !isFinite(y)) {
      console.warn(`[Eye Tracking] ⚠️ Coordonnées invalides: x=${x}, y=${y}`);
      return;
    }

    const element = document.elementFromPoint(x, y);
    if (!element) return;

    if (button === 'right') {
      const contextmenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: 2,
      });
      element.dispatchEvent(contextmenuEvent);
      console.log(`[Eye Tracking] ✅ Clic DROIT simulé à (${Math.round(x)}, ${Math.round(y)})`);
    } else {
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: 0,
      });

      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: 0,
      });

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: 0,
      });

      element.dispatchEvent(mousedownEvent);
      element.dispatchEvent(mouseupEvent);
      element.dispatchEvent(clickEvent);
      console.log(`[Eye Tracking] ✅ Clic GAUCHE simulé à (${Math.round(x)}, ${Math.round(y)})`);
    }
  };

  // Calibration de la tête
  const calibrateHeadTracking = (landmarks: number[][]) => {
    const cal = headCalibrationRef.current;
    const nose = landmarks[30] || landmarks[1] || [0, 0];
    const headX = nose[0];
    const headY = nose[1];

    cal.minX = Math.min(cal.minX, headX);
    cal.maxX = Math.max(cal.maxX, headX);
    cal.minY = Math.min(cal.minY, headY);
    cal.maxY = Math.max(cal.maxY, headY);
    cal.dataPoints.push({ x: headX, y: headY });
  };

  // Mapper les coordonnées de la tête à l'écran
  const mapHeadCoordinatesToScreen = (headX: number, headY: number): CursorPosition => {
    if (!isFinite(headX) || !isFinite(headY)) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const cal = headCalibrationRef.current;

    let minX = cal.minX !== Infinity ? cal.minX : 200;
    let maxX = cal.maxX !== -Infinity ? cal.maxX : 440;
    let minY = cal.minY !== Infinity ? cal.minY : 150;
    let maxY = cal.maxY !== -Infinity ? cal.maxY : 350;

    const paddingX = (maxX - minX) * 0.15;
    const paddingY = (maxY - minY) * 0.15;
    minX += paddingX;
    maxX -= paddingX;
    minY += paddingY;
    maxY -= paddingY;

    if (minX >= maxX) { minX = 200; maxX = 440; }
    if (minY >= maxY) { minY = 150; maxY = 350; }

    const normalizedX = (headX - minX) / (maxX - minX);
    const normalizedY = (headY - minY) / (maxY - minY);

    const sensitivityX = 1.5;
    const sensitivityY = 1.5;

    const adjustedX = 0.5 + (normalizedX - 0.5) * sensitivityX;
    const adjustedY = 0.5 + (normalizedY - 0.5) * sensitivityY;

    const screenX = (1 - adjustedX) * window.innerWidth;
    const screenY = adjustedY * window.innerHeight;

    return {
      x: Math.max(0, Math.min(window.innerWidth, screenX)),
      y: Math.max(0, Math.min(window.innerHeight, screenY))
    };
  };

  // Vérifier la disponibilité de getUserMedia
  const checkBrowserSupport = (): boolean => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('❌ Votre navigateur ne supporte pas l\'accès webcam');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!isEnabled) {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
      return;
    }

    // Créer le curseur personnalisé
    if (!cursorRef.current) {
      const cursor = document.createElement('div');
      cursor.className = 'eye-tracking-cursor';
      cursor.innerHTML = `
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          width: 12px; height: 12px;
          background: #00ff88;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        "></div>
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          width: 36px; height: 36px;
          border: 3px solid #00ff88;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulseRing 1.5s ease-out infinite;
        "></div>
      `;
      cursor.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%);
        filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.8));
        display: none;
      `;

      const style = document.createElement('style');
      style.id = 'eye-tracking-styles';
      style.textContent = `
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        .eye-tracking-cursor-stable .stable-ring {
          border-color: #ffaa00 !important;
        }
        .eye-tracking-cursor-stable > div:first-child {
          background: #ffaa00 !important;
        }
      `;
      
      if (!document.getElementById('eye-tracking-styles')) {
        document.head.appendChild(style);
      }
      document.body.appendChild(cursor);
      cursorRef.current = cursor;
    }
    
    cursorRef.current.style.display = 'block';

    const initialCursorPos = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    setCursorPos(initialCursorPos);
    if (cursorRef.current) {
      cursorRef.current.style.left = initialCursorPos.x + 'px';
      cursorRef.current.style.top = initialCursorPos.y + 'px';
    }

    headCalibrationRef.current = {
      isCalibrating: true,
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
      dataPoints: []
    };

    if (!checkBrowserSupport()) {
      setIsEnabled(false);
      return;
    }

    const initHeadTracking = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[Eye Tracking] Chargement de face-api.js...');

        const faceapiModule = await import('face-api.js');
        const faceapi = faceapiModule.default || faceapiModule;

        if (!faceapi.nets) {
          throw new Error('face-api.js nets not available');
        }

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);

        detectorRef.current = faceapi;
        console.log('[Eye Tracking] ✅ Détecteur chargé!');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await new Promise<void>((resolve) => {
            const onLoadedMetadata = () => {
              console.log('[Eye Tracking] ✅ Webcam activée!');
              console.log('[Eye Tracking] 📏 CALIBRATION EN COURS...');
              console.log('[Eye Tracking] Bougez votre tête lentement pendant 5 secondes');
              videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);

              setTimeout(() => {
                const cal = headCalibrationRef.current;
                if (cal.minX === Infinity || cal.dataPoints.length < 5) {
                  console.log('[Eye Tracking] ⚠️ Valeurs par défaut utilisées');
                  cal.minX = 200; cal.maxX = 440;
                  cal.minY = 150; cal.maxY = 350;
                }
                cal.isCalibrating = false;
                console.log('[Eye Tracking] ✅ Calibration terminée!');
              }, 10000);

              resolve();
            };
            videoRef.current?.addEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current?.play();
          });
        }

        setIsLoading(false);

        const detectHead = async () => {
          if (!videoRef.current || !detectorRef.current) return;

          try {
            const video = videoRef.current;

            if (video.videoWidth === 0 || video.videoHeight === 0) {
              detectionLoopRef.current = requestAnimationFrame(detectHead);
              return;
            }

            const detections = await detectorRef.current.detectAllFaces(video).withFaceLandmarks();

            if (detections && detections.length > 0) {
              const face = detections[0];
              
              let landmarks: number[][] = [];
              if (face.landmarks && face.landmarks._positions) {
                landmarks = face.landmarks._positions.map((pos: any) => [pos.x, pos.y]);
              } else if (face.landmarks && typeof face.landmarks.getPositions === 'function') {
                landmarks = face.landmarks.getPositions().map((pos: any) => [pos.x, pos.y]);
              }

              if (landmarks && landmarks.length > 0) {
                const leftEyePoints = landmarks.slice(36, 42);
                const rightEyePoints = landmarks.slice(42, 48);

                if (headCalibrationRef.current.isCalibrating) {
                  calibrateHeadTracking(landmarks);
                }

                const nose = landmarks[30] || landmarks[0] || [0, 0];
                const rawScreenCoords = mapHeadCoordinatesToScreen(nose[0], nose[1]);

                const smoothedScreenCoords = {
                  x: isFinite(previousCursorPosRef.current.x)
                    ? previousCursorPosRef.current.x * (1 - SMOOTHING_FACTOR) + rawScreenCoords.x * SMOOTHING_FACTOR
                    : rawScreenCoords.x,
                  y: isFinite(previousCursorPosRef.current.y)
                    ? previousCursorPosRef.current.y * (1 - SMOOTHING_FACTOR) + rawScreenCoords.y * SMOOTHING_FACTOR
                    : rawScreenCoords.y,
                };

                if (!isFinite(smoothedScreenCoords.x)) smoothedScreenCoords.x = previousCursorPosRef.current.x;
                if (!isFinite(smoothedScreenCoords.y)) smoothedScreenCoords.y = previousCursorPosRef.current.y;

                previousCursorPosRef.current = smoothedScreenCoords;
                setCursorPos(smoothedScreenCoords);

                // Auto-scroll
                const scrollThreshold = window.innerHeight * 0.85;
                if (smoothedScreenCoords.y > scrollThreshold) {
                  window.scrollBy(0, 5);
                } else if (smoothedScreenCoords.y < window.innerHeight * 0.15) {
                  window.scrollBy(0, -5);
                }

                if (cursorRef.current) {
                  cursorRef.current.style.left = smoothedScreenCoords.x + 'px';
                  cursorRef.current.style.top = smoothedScreenCoords.y + 'px';
                }

                // Détection de clic par immobilité
                const stability = cursorStabilityRef.current;
                const distanceFromLastPos = Math.sqrt(
                  Math.pow(smoothedScreenCoords.x - stability.lastPos.x, 2) +
                  Math.pow(smoothedScreenCoords.y - stability.lastPos.y, 2)
                );

                if (distanceFromLastPos < stability.threshold) {
                  if (!stability.isStable) {
                    stability.isStable = true;
                    stability.stableStartTime = Date.now();
                    cursorRef.current?.classList.add('eye-tracking-cursor-stable');
                    console.log('[Eye Tracking] 🎯 Curseur immobile - Attente de 3 secondes...');
                  } else {
                    const elapsedTime = Date.now() - (stability.stableStartTime || 0);
                    if (elapsedTime >= stability.stableDuration) {
                      simulateClick(smoothedScreenCoords.x, smoothedScreenCoords.y, stability.clickType);
                      stability.isStable = false;
                      stability.stableStartTime = null;
                    }
                  }
                } else {
                  if (stability.isStable) {
                    cursorRef.current?.classList.remove('eye-tracking-cursor-stable');
                  }
                  stability.isStable = false;
                  stability.stableStartTime = null;
                  stability.lastPos = { x: smoothedScreenCoords.x, y: smoothedScreenCoords.y };
                }

                // Détection yeux ouverts/fermés
                const isEyeOpen = (eyePoints: number[][]): boolean => {
                  if (!eyePoints || eyePoints.length < 5) return true;
                  const topPoint = eyePoints[1];
                  const bottomPoint = eyePoints[4];
                  if (!topPoint || !bottomPoint) return true;
                  const verticalDistance = Math.abs((topPoint[1] || 0) - (bottomPoint[1] || 0));
                  return verticalDistance > 6;
                };

                const leftOpen = isEyeOpen(leftEyePoints);
                const rightOpen = isEyeOpen(rightEyePoints);

                setEyeStatus({
                  left: leftOpen ? 'open' : 'closed',
                  right: rightOpen ? 'open' : 'closed',
                });

                if (!leftOpen && rightOpen) {
                  cursorStabilityRef.current.clickType = 'left';
                } else if (!rightOpen && leftOpen) {
                  cursorStabilityRef.current.clickType = 'right';
                } else {
                  cursorStabilityRef.current.clickType = 'left';
                }
              }
            }
          } catch (err) {
            console.error('[Eye Tracking] Erreur détection:', err);
          }

          detectionLoopRef.current = requestAnimationFrame(detectHead);
        };

        detectHead();
      } catch (err: any) {
        console.error('[Eye Tracking] Erreur initialisation:', err);
        setIsLoading(false);

        if (err.name === 'NotAllowedError') {
          setError('❌ Accès webcam refusé. Vérifiez les permissions.');
        } else if (err.name === 'NotFoundError') {
          setError('❌ Aucune webcam détectée.');
        } else if (err.name === 'SecurityError') {
          setError('❌ HTTPS est requis pour accéder à la webcam.');
        } else if (err.message?.includes('Failed to load model')) {
          setError('❌ Erreur chargement des modèles. Vérifiez /public/models.');
        } else {
          setError(`❌ Erreur: ${err.message}`);
        }

        setIsEnabled(false);
      }
    };

    initHeadTracking();

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    };
  }, [isEnabled]);

  const value: EyeTrackingContextType = {
    isEnabled,
    setIsEnabled,
    cursorPos,
    eyeStatus,
    isLoading,
    error,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    isEyeClosed: (eye: 'left' | 'right') => {
      return eyeStatus[eye] === 'closed';
    },
  };

  return (
    <EyeTrackingContext.Provider value={value}>
      {children}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
        muted
      />
    </EyeTrackingContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte de l'eye tracking
 */
export const useEyeTracking = (): EyeTrackingContextType => {
  const context = useContext(EyeTrackingContext);
  if (!context) {
    throw new Error('useEyeTracking doit être utilisé dans un EyeTrackingProvider');
  }
  return context;
};

export default EyeTrackingProvider;
