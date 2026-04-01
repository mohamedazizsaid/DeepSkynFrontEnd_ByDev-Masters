import React, { useEffect, useRef } from 'react';
import { useEyeTracking } from './EyeTrackingContext';

/**
 * Composant Global Cursor
 * Affiche le curseur et le trail du suivi oculaire sur TOUTES les pages
 * À ajouter une seule fois dans App.tsx (ou layout principal)
 */
export const GlobalEyeCursor: React.FC = () => {
  const { isEnabled, cursorPos, eyeStatus } = useEyeTracking();
  const cursorTrailRef = useRef<Array<{ x: number; y: number; id: number }>>([]);

  // Mettre à jour le trail du curseur
  useEffect(() => {
    if (isEnabled) {
      cursorTrailRef.current.push({ ...cursorPos, id: Date.now() });
      // Garder seulement les 20 derniers points du trail
      if (cursorTrailRef.current.length > 20) {
        cursorTrailRef.current.shift();
      }
    }
  }, [cursorPos, isEnabled]);

  if (!isEnabled) return null;

  return (
    <>
      <style>{`
        /* Curseur personnalisé */
        .global-eye-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          border: 3px solid #00ff88;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.6),
                      inset 0 0 10px rgba(0, 255, 136, 0.3);
          transition: border-color 0.2s;
        }

        .global-eye-cursor.right-click-mode {
          border-color: #ff0055;
          box-shadow: 0 0 20px rgba(255, 0, 85, 0.6),
                      inset 0 0 10px rgba(255, 0, 85, 0.3);
        }

        /* Trail du curseur */
        .eye-cursor-trail {
          position: fixed;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99998;
          transform: translate(-50%, -50%);
          background: rgba(0, 255, 136, 0.6);
        }
      `}</style>

      {/* Trail du curseur */}
      {cursorTrailRef.current.map((point) => (
        <div
          key={point.id}
          className="eye-cursor-trail"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
          }}
        />
      ))}

      {/* Curseur principal */}
      <div
        className={`global-eye-cursor ${
          eyeStatus.right === 'closed' ? 'right-click-mode' : ''
        }`}
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
      />
    </>
  );
};

export default GlobalEyeCursor;
