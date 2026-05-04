import React, { useEffect } from 'react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

/**
 * Global accessibility overlays:
 * 1. SVG color blind simulation filters
 * 2. Reading guide (horizontal bar following mouse)
 * 3. Skip-to-content link (WCAG 2.4.1)
 */
export function AccessibilityOverlays() {
    const readingGuide = useAccessibilityStore((s) => s.readingGuide);

    // Reading guide follows the mouse
    useEffect(() => {
        if (!readingGuide) return;

        const guide = document.createElement('div');
        guide.id = 'a11y-reading-guide';
        guide.style.cssText = `
            position: fixed;
            left: 0;
            right: 0;
            height: 40px;
            pointer-events: none;
            z-index: 99998;
            background: rgba(var(--accent-primary-rgb), 0.08);
            border-top: 2px solid rgba(var(--accent-primary-rgb), 0.3);
            border-bottom: 2px solid rgba(var(--accent-primary-rgb), 0.3);
            transition: top 0.05s ease;
            display: none;
        `;
        document.body.appendChild(guide);

        function handleMouseMove(e: MouseEvent) {
            guide.style.display = 'block';
            guide.style.top = `${e.clientY - 20}px`;
        }

        function handleMouseLeave() {
            guide.style.display = 'none';
        }

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            guide.remove();
        };
    }, [readingGuide]);

    return (
        <>
            {/* SVG Color Blind Filters — hidden, referenced via CSS filter: url('#...') */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                aria-hidden="true"
            >
                <defs>
                    {/* Protanopia (red-weak) */}
                    <filter id="protanopia-filter">
                        <feColorMatrix
                            type="matrix"
                            values="0.567, 0.433, 0,     0, 0
                                    0.558, 0.442, 0,     0, 0
                                    0,     0.242, 0.758, 0, 0
                                    0,     0,     0,     1, 0"
                        />
                    </filter>

                    {/* Deuteranopia (green-weak) */}
                    <filter id="deuteranopia-filter">
                        <feColorMatrix
                            type="matrix"
                            values="0.625, 0.375, 0,   0, 0
                                    0.7,   0.3,   0,   0, 0
                                    0,     0.3,   0.7, 0, 0
                                    0,     0,     0,   1, 0"
                        />
                    </filter>

                    {/* Tritanopia (blue-weak) */}
                    <filter id="tritanopia-filter">
                        <feColorMatrix
                            type="matrix"
                            values="0.95, 0.05,  0,     0, 0
                                    0,    0.433, 0.567, 0, 0
                                    0,    0.475, 0.525, 0, 0
                                    0,    0,     0,     1, 0"
                        />
                    </filter>
                </defs>
            </svg>
        </>
    );
}
