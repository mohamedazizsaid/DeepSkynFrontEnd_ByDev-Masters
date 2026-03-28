/**
 * Professional Sign Language Avatar Component
 * Renders a canvas-based avatar that performs sign language gestures
 * Supports both backend keypoints data and local LSF gesture database
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, Settings, Maximize2 } from 'lucide-react';
import { type AvatarFrame, type AvatarKeypoint } from './sign-avatar-renderer';
import { SignAvatar3D } from './sign-avatar-3d';
import {
  translateTextToGestures,
} from './lsf-gesture-database';
import type { Frame } from '../../lib/services/sign-translation.service';

interface ProSignAvatarProps {
  /** Text to translate to sign language */
  text: string;
  /** Backend frames (from API), takes priority over local gestures */
  frames?: Frame[];
  /** Backend metadata */
  metadata?: { gloss?: string; fps?: number; total_frames?: number };
  /** Whether to auto-play on mount */
  autoPlay?: boolean;
  /** Callback when all gestures are complete */
  onComplete?: () => void;
  /** Width of the avatar canvas */
  width?: number | string;
  /** Height of the avatar canvas */
  height?: number | string;
  /** Show controls */
  showControls?: boolean;
  /** Avatar style */
  style?: 'cartoon' | 'skeleton' | 'silhouette';
  /** Compact mode for inline display */
  compact?: boolean;
  /** Dark mode */
  isDark?: boolean;
}

/**
 * Convert backend Frame[] to AvatarFrame[]
 * Handles normalization of coordinates
 */
function convertBackendFrames(frames: Frame[]): AvatarFrame[] {
  return frames.map(frame => {
    const convertKps = (kps: Array<{id: string; x: number; y: number; z: number}>): AvatarKeypoint[] => {
      if (!kps || kps.length === 0) return [];
      return kps.map(kp => ({
        id: kp.id,
        // Normalize: if values are > 1, assume pixel coords in 0-512 or 0-1920 range
        x: kp.x > 2 ? kp.x / 512 : kp.x,
        y: kp.y > 2 ? kp.y / 512 : kp.y,
        z: kp.z,
      }));
    };

    return {
      hand_right_keypoints: convertKps(frame.hand_right_keypoints),
      hand_left_keypoints: convertKps(frame.hand_left_keypoints),
      pose_keypoints: convertKps(frame.pose_keypoints),
    };
  });
}

function pickMotionAnchor(frame: AvatarFrame): AvatarKeypoint | null {
  return (
    frame.hand_right_keypoints[8] ||
    frame.hand_right_keypoints[0] ||
    frame.hand_left_keypoints[8] ||
    frame.hand_left_keypoints[0] ||
    frame.pose_keypoints[16] ||
    frame.pose_keypoints[15] ||
    frame.pose_keypoints[0] ||
    null
  );
}

function hasMeaningfulBackendMotion(frames: AvatarFrame[]): boolean {
  if (frames.length < 2) return false;

  let nonEmptyFrames = 0;
  let prevAnchor: AvatarKeypoint | null = null;
  let motionSum = 0;
  let motionSamples = 0;

  for (const frame of frames) {
    const pointsCount =
      frame.hand_right_keypoints.length +
      frame.hand_left_keypoints.length +
      frame.pose_keypoints.length;
    if (pointsCount > 0) {
      nonEmptyFrames += 1;
    }

    const anchor = pickMotionAnchor(frame);
    if (anchor && prevAnchor) {
      motionSum +=
        Math.abs(anchor.x - prevAnchor.x) +
        Math.abs(anchor.y - prevAnchor.y) +
        Math.abs(anchor.z - prevAnchor.z);
      motionSamples += 1;
    }
    if (anchor) {
      prevAnchor = anchor;
    }
  }

  if (nonEmptyFrames < Math.max(2, Math.floor(frames.length * 0.5))) {
    return false;
  }
  if (motionSamples === 0) {
    return false;
  }

  const averageMotion = motionSum / motionSamples;
  return averageMotion > 0.0008;
}

function blendKeypoints(from: AvatarKeypoint[], to: AvatarKeypoint[], t: number): AvatarKeypoint[] {
  const len = Math.min(from.length, to.length);
  const result: AvatarKeypoint[] = [];
  for (let i = 0; i < len; i += 1) {
    result.push({
      id: to[i].id,
      x: from[i].x + (to[i].x - from[i].x) * t,
      y: from[i].y + (to[i].y - from[i].y) * t,
      z: from[i].z + (to[i].z - from[i].z) * t,
    });
  }
  for (let i = len; i < to.length; i += 1) {
    result.push({ ...to[i] });
  }
  return result;
}

function blendFrames(from: AvatarFrame, to: AvatarFrame, t: number): AvatarFrame {
  return {
    hand_right_keypoints: blendKeypoints(from.hand_right_keypoints, to.hand_right_keypoints, t),
    hand_left_keypoints: blendKeypoints(from.hand_left_keypoints, to.hand_left_keypoints, t),
    pose_keypoints: blendKeypoints(from.pose_keypoints, to.pose_keypoints, t),
  };
}

function withCoarticulation(sequence: { frames: AvatarFrame[]; duration: number; label: string }[]): { frames: AvatarFrame[]; duration: number; label: string }[] {
  if (sequence.length < 2) return sequence;

  return sequence.map((gesture, idx) => {
    if (idx === 0) return gesture;

    const prev = sequence[idx - 1];
    const prevLast = prev.frames[prev.frames.length - 1];
    const currFirst = gesture.frames[0];
    if (!prevLast || !currFirst) return gesture;

    const transitionFrames: AvatarFrame[] = [];
    const bridgeSteps = 4;
    for (let step = 1; step <= bridgeSteps; step += 1) {
      const t = step / (bridgeSteps + 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      transitionFrames.push(blendFrames(prevLast, currFirst, eased));
    }

    return {
      ...gesture,
      frames: [...transitionFrames, ...gesture.frames],
    };
  });
}

export function ProSignAvatar({
  text,
  frames,
  metadata,
  autoPlay = true,
  onComplete,
  width = '100%',
  height = '480px',
  showControls = true,
  style = 'cartoon',
  compact = false,
  isDark = true,
}: ProSignAvatarProps) {
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [currentFrameInGesture, setCurrentFrameInGesture] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState(style);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFrame, setActiveFrame] = useState<AvatarFrame | null>(null);

  // Determine gesture sequence
  const gestureSequence = useMemo<{ frames: AvatarFrame[]; duration: number; label: string }[]>(() => {
    // Priority 1: backend frames only if they contain real motion
    if (frames && frames.length > 0) {
      const converted = convertBackendFrames(frames);
      if (hasMeaningfulBackendMotion(converted)) {
        const fps = metadata?.fps || 30;
        const frameDuration = 1000 / fps;
        return [{
          frames: converted,
          duration: frameDuration,
          label: metadata?.gloss || 'Traduction',
        }];
      }

      console.warn('[ProSignAvatar] Backend frames look static. Falling back to local gesture synthesis.');
    }

    // Priority 2: Local LSF gesture database
    const lsfGestures = translateTextToGestures(text);
    const baseSequence = lsfGestures.map(g => ({
      frames: g.frames,
      duration: g.frameDuration,
      label: g.word,
    }));
    return withCoarticulation(baseSequence);
  }, [text, frames, metadata]);

  const totalGestures = gestureSequence.length;

  useEffect(() => {
    setCurrentGestureIndex(0);
    setCurrentFrameInGesture(0);
    setActiveFrame(gestureSequence[0]?.frames[0] ?? null);
  }, [gestureSequence]);

  // Play gesture animation
  const playGesture = useCallback((gestureIdx: number, frameIdx: number = 0) => {
    if (gestureIdx >= gestureSequence.length) {
      // All gestures complete
      setIsPlaying(false);
      setCurrentGestureIndex(0);
      setCurrentFrameInGesture(0);
      setActiveFrame(null);
      onComplete?.();
      return;
    }

    const gesture = gestureSequence[gestureIdx];
    if (frameIdx >= gesture.frames.length) {
      // Move to next gesture with a small pause
      setCurrentGestureIndex(gestureIdx + 1);
      setCurrentFrameInGesture(0);
      const hasNextGesture = gestureIdx + 1 < gestureSequence.length;
      animTimerRef.current = setTimeout(() => {
        playGesture(gestureIdx + 1, 0);
      }, (hasNextGesture ? 75 : 200) / speed);
      return;
    }

    setCurrentGestureIndex(gestureIdx);
    setCurrentFrameInGesture(frameIdx);
  setActiveFrame(gesture.frames[frameIdx]);

    // Schedule next frame
    animTimerRef.current = setTimeout(() => {
      playGesture(gestureIdx, frameIdx + 1);
    }, gesture.duration / speed);
  }, [gestureSequence, speed, onComplete]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && gestureSequence.length > 0) {
      const safeGestureIndex = Math.min(
        currentGestureIndex,
        Math.max(gestureSequence.length - 1, 0),
      );
      const safeFrameIndex = Math.min(
        currentFrameInGesture,
        Math.max((gestureSequence[safeGestureIndex]?.frames.length || 1) - 1, 0),
      );
      playGesture(safeGestureIndex, safeFrameIndex);
    }

    return () => {
      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current);
      }
    };
  }, [isPlaying, playGesture, gestureSequence.length]);

  // Controls
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    } else {
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setCurrentGestureIndex(0);
    setCurrentFrameInGesture(0);
    setActiveFrame(gestureSequence[0]?.frames[0] ?? null);
    setIsPlaying(true);
  };

  const handleSkipNext = () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    const nextIdx = Math.min(currentGestureIndex + 1, totalGestures - 1);
    setCurrentGestureIndex(nextIdx);
    setCurrentFrameInGesture(0);
    if (isPlaying) {
      playGesture(nextIdx, 0);
    } else if (gestureSequence[nextIdx]) {
      setActiveFrame(gestureSequence[nextIdx].frames[0]);
    }
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Progress percentage
  const progress = totalGestures > 0
    ? ((currentGestureIndex + (currentFrameInGesture / (gestureSequence[currentGestureIndex]?.frames.length || 1))) / totalGestures) * 100
    : 0;

  const currentLabel = gestureSequence[currentGestureIndex]?.label || '';

  return (
    <div
      className={`relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999] bg-black' : ''}`}
      style={isFullscreen ? {} : { width, height }}
    >
      {/* Full 3D Avatar */}
      <div className="relative w-full h-full">
        <div
          className="w-full h-full"
          style={{ borderRadius: isFullscreen ? 0 : '1rem', overflow: 'hidden' }}
        >
          <SignAvatar3D
            frame={activeFrame}
            styleMode={avatarStyle}
            isDark={isDark}
            utterance={currentLabel || text}
          />
        </div>

        {/* Current word overlay */}
        <AnimatePresence mode="wait">
          {currentLabel && isPlaying && (
            <motion.div
              key={currentLabel}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute top-4 left-1/2 -translate-x-1/2"
            >
              <div className="px-5 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
                <span className="text-white font-bold text-lg tracking-wide">
                  {currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gesture counter */}
        {totalGestures > 0 && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium">
            {Math.min(currentGestureIndex + 1, totalGestures)} / {totalGestures}
          </div>
        )}

        {/* Progress bar */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      {showControls && (
        <div className={`absolute bottom-2 left-2 right-2 flex items-center justify-between ${compact ? 'gap-1' : 'gap-2'}`}>
          <div className="flex items-center gap-1.5">
            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className={`${compact ? 'p-2' : 'p-2.5'} bg-white/15 backdrop-blur-md rounded-full text-white hover:bg-white/25 transition-all border border-white/10`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>

            {/* Restart */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRestart}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>

            {/* Skip */}
            {totalGestures > 1 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSkipNext}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </motion.button>
            )}

            {/* Speak */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSpeak}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Speed control */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <Settings className="w-3.5 h-3.5" />
            </motion.button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full right-0 mb-2 p-3 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl min-w-[180px]"
                >
                  {/* Speed */}
                  <div className="mb-3">
                    <p className="text-white/60 text-xs font-medium mb-1.5">Vitesse</p>
                    <div className="flex gap-1">
                      {[0.5, 1, 1.5, 2].map(s => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                            speed === s
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style */}
                  <div>
                    <p className="text-white/60 text-xs font-medium mb-1.5">Style</p>
                    <div className="flex gap-1">
                      {(['cartoon', 'skeleton', 'silhouette'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setAvatarStyle(s)}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                            avatarStyle === s
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {s === 'cartoon' ? '🧑' : s === 'skeleton' ? '🦴' : '👤'} {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalGestures === 0 && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center text-white/50">
            {!text || text.trim() === '' ? (
              <div className="animate-pulse">
                <span className="text-4xl block mb-2">⏳</span>
                <p className="text-sm font-medium">En attente de texte...</p>
                <p className="text-xs mt-1">L'avatar s'animera dès que le texte sera disponible</p>
              </div>
            ) : (
              <>
                <span className="text-4xl block mb-2">🤟</span>
                <p className="text-sm font-medium">Aucun geste disponible</p>
                <p className="text-xs mt-1">Le texte ne correspond à aucun geste LSF connu</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProSignAvatar;
