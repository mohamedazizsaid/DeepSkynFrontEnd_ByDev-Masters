/**
 * Hand-Based Sign Language Avatar Component
 * Displays animated hands only (no full body avatar)
 * Each post gets different hand gestures
 */

import React from 'react';
import { AnimatedHand } from './animated-hand';
import type { Frame } from '../../lib/services/sign-translation.service';

interface HandSignAvatarProps {
  postId: string;
  apiBaseUrl?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  onComplete?: () => void;
}

/**
 * Simplified avatar showing only animated hands
 * No full body, just hand and body skeleton keypoints
 */
export function HandSignAvatar({
  postId,
  apiBaseUrl = "",
  width = 200,
  height = 260,
  autoPlay = true,
  onComplete,
}: HandSignAvatarProps) {
  return (
    <AnimatedHand
      postId={postId}
      apiBaseUrl={apiBaseUrl}
      width={width}
      height={height}
      autoPlay={autoPlay}
      onComplete={onComplete}
    />
  );
}

export default HandSignAvatar;
