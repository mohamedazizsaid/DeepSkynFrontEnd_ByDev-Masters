import React from 'react';
import { motion } from 'motion/react';
import { useAccessibilityStore } from '../../stores/accessibility.store';

/**
 * Global animated background component — Light premium theme.
 * Renders visible gradient blobs, floating particles, and a subtle grid overlay.
 * Fixed behind all content for a premium, alive feel.
 */
export function AnimatedBackground() {
  const accentTheme = useAccessibilityStore((s) => s.accentTheme);
  const accentPrimary = accentTheme === 'pink' ? '#EC4899' : '#0EA5E9';
  const accentSecondary = accentTheme === 'pink' ? '#F472B6' : '#06B6D4';
  const accentGlowStrong = accentTheme === 'pink' ? 'rgba(236,72,153,0.18)' : 'rgba(14,165,233,0.18)';
  const accentGlowSoft = accentTheme === 'pink' ? 'rgba(236,72,153,0.12)' : 'rgba(14,165,233,0.12)';

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Base: clean light gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            accentTheme === 'pink'
              ? 'linear-gradient(to bottom right, #fdf2f8, #f8fafc, #fdf4ff)'
              : 'linear-gradient(to bottom right, #eef2ff, #f8fafc, #ecfdf5)',
        }}
      />

      {/* Large animated gradient blobs — visible pastel tones */}
      {[
        { color: accentGlowStrong, x: '10%', y: '15%', size: 350, dur: 10 },
        { color: 'rgba(139,92,246,0.14)', x: '70%', y: '10%', size: 400, dur: 12 },
        { color: accentTheme === 'pink' ? 'rgba(244,114,182,0.16)' : 'rgba(6,182,212,0.16)', x: '50%', y: '60%', size: 380, dur: 11 },
        { color: 'rgba(236,72,153,0.10)', x: '85%', y: '70%', size: 320, dur: 13 },
        { color: 'rgba(16,185,129,0.14)', x: '20%', y: '75%', size: 360, dur: 14 },
        { color: accentGlowSoft, x: '40%', y: '30%', size: 300, dur: 9 },
      ].map((blob, i) => (
        <motion.div
          key={`blob-${i}`}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            background: `radial-gradient(circle, ${blob.color}, transparent 70%)`,
            left: blob.x,
            top: blob.y,
            filter: 'blur(50px)',
          }}
          animate={{
            y: [0, -35 - i * 6, 0],
            x: [0, 20 + i * 4, 0],
            scale: [1, 1.25, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: blob.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}

      {/* Floating particles — gently rising colored dots */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3 + (i % 4) * 2,
            height: 3 + (i % 4) * 2,
              background:
                i % 4 === 0
                ? accentPrimary
                : i % 4 === 1
                ? '#8B5CF6'
                : i % 4 === 2
                ? '#10B981'
                : accentSecondary,
            opacity: 0.35,
            left: `${(i * 6 + 2) % 98}%`,
            top: `${(i * 8 + 10) % 95}%`,
          }}
          animate={{
            y: [0, -45 - i * 3, 0],
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: 4 + (i % 5),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Subtle dot-grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
