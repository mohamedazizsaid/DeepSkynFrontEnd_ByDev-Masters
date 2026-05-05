import type { CSSProperties, FC, HTMLAttributes, ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useEyeTracking } from '../components/EyeTrackingContext';

interface UseEyeClickOptions {
  clickDelay?: number;
  hoverFeedback?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
}

/**
 * Hook pour détecter les clics oculaires sur un élément spécifique
 * 
 * Usage:
 * const ref = useEyeClick(handleClick, handleRightClick);
 * <button ref={ref}>Click me with your eyes</button>
 */
export const useEyeClick = <T extends HTMLElement>(
  onLeftClick?: () => void,
  onRightClick?: () => void,
  options: UseEyeClickOptions = {}
): RefObject<T> => {
  const elementRef = useRef<T>(null);
  const { isEnabled, cursorPos, eyeStatus } = useEyeTracking();
  const lastClickTimeRef = useRef<{ left?: number; right?: number }>({});
  const hoverStateRef = useRef(false);

  const {
    clickDelay = 300,
    hoverFeedback = true,
    onHoverChange = null,
  } = options;

  useEffect(() => {
    if (!isEnabled || !elementRef.current) return;

    const checkAndClick = setInterval(() => {
      if (!elementRef.current) return;
      
      const rect = elementRef.current.getBoundingClientRect();

      // Vérifier si le curseur oculaire est sur l'élément
      const isHovered =
        cursorPos.x >= rect.left &&
        cursorPos.x <= rect.right &&
        cursorPos.y >= rect.top &&
        cursorPos.y <= rect.bottom;

      // Notifier du changement de hover
      if (isHovered !== hoverStateRef.current) {
        hoverStateRef.current = isHovered;
        if (onHoverChange) {
          onHoverChange(isHovered);
        }
        if (hoverFeedback && elementRef.current) {
          if (isHovered) {
            elementRef.current.style.filter = 'brightness(0.95)';
          } else {
            elementRef.current.style.filter = 'brightness(1)';
          }
        }
      }

      if (isHovered) {
        const now = Date.now();

        // Clic oeil droit fermé = Clic normal
        if (eyeStatus.right === 'closed') {
          const lastRightClick = lastClickTimeRef.current.right || 0;
          if (now - lastRightClick > clickDelay) {
            lastClickTimeRef.current.right = now;
            if (onLeftClick) {
              onLeftClick();
            }
            // Feedback visuel
            if (elementRef.current) {
              elementRef.current.style.transform = 'scale(0.98)';
              setTimeout(() => {
                if (elementRef.current) {
                  elementRef.current.style.transform = 'scale(1)';
                }
              }, 100);
            }
          }
        }

        // Clic oeil gauche fermé = Clic droit
        if (eyeStatus.left === 'closed') {
          const lastLeftClick = lastClickTimeRef.current.left || 0;
          if (now - lastLeftClick > clickDelay) {
            lastClickTimeRef.current.left = now;
            if (onRightClick) {
              onRightClick();
            }
            // Feedback visuel
            if (elementRef.current) {
              elementRef.current.style.transform = 'scale(0.95)';
              setTimeout(() => {
                if (elementRef.current) {
                  elementRef.current.style.transform = 'scale(1)';
                }
              }, 100);
            }
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(checkAndClick);
      // Cleanup
      if (elementRef.current) {
        elementRef.current.style.filter = 'brightness(1)';
        elementRef.current.style.transform = 'scale(1)';
      }
    };
  }, [isEnabled, cursorPos, eyeStatus, onLeftClick, onRightClick, clickDelay, hoverFeedback, onHoverChange]);

  return elementRef;
};

interface EyeClickableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'children'> {
  children: ReactNode;
  onClick?: () => void;
  onRightClick?: () => void;
  className?: string;
  style?: CSSProperties;
  clickDelay?: number;
}

/**
 * Composant wrapper pour ajouter l'eye click facilement
 */
export const EyeClickable: FC<EyeClickableProps> = ({
  children,
  onClick,
  onRightClick,
  className = '',
  style = {},
  clickDelay = 300,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const ref = useEyeClick<HTMLDivElement>(onClick, onRightClick, { clickDelay });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`eye-clickable ${isHovered ? 'eye-hovered' : ''} ${className}`}
      style={{
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
      onMouseEnter={(event) => {
        setIsHovered(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setIsHovered(false);
        onMouseLeave?.(event);
      }}
    >
      {children}
    </div>
  );
};

export default useEyeClick;
