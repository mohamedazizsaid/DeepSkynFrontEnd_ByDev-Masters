/**
 * Gesture to Animation Converter
 * Converts gesture data to hand animation frames
 */

import type { GestureData, HandGesture } from '../../lib/services/sign-language.service';
import type { HandAnimationData } from './animated-hand';

/**
 * Hand keypoint indices matching MediaPipe
 */
export const HAND_KEYPOINT_INDICES = {
  wrist: 0,
  thumb_cmc: 1,
  thumb_mcp: 2,
  thumb_ip: 3,
  thumb_tip: 4,
  index_mcp: 5,
  index_pip: 6,
  index_dip: 7,
  index_tip: 8,
  middle_mcp: 9,
  middle_pip: 10,
  middle_dip: 11,
  middle_tip: 12,
  ring_mcp: 13,
  ring_pip: 14,
  ring_dip: 15,
  ring_tip: 16,
  pinky_mcp: 17,
  pinky_pip: 18,
  pinky_dip: 19,
  pinky_tip: 20,
};

/**
 * Generate animation frames from gesture data
 * Creates smooth interpolation between gesture keyframes
 */
export function gestureToAnimationFrames(
  gesture: GestureData,
  frameCount: number = 30,
): HandAnimationData[] {
  const frames: HandAnimationData[] = [];
  const duration = gesture.movement.duration || 500;

  for (let f = 0; f < frameCount; f++) {
    const progress = f / frameCount; // 0 to 1

    // Generate keypoints for both hands
    const rightKeypoints = generateHandKeypoints(
      gesture.movement.hands,
      'right',
      progress,
    );
    const leftKeypoints = generateHandKeypoints(
      gesture.movement.hands,
      'left',
      progress,
    );

    frames.push({
      hand_right_keypoints: rightKeypoints,
      hand_left_keypoints: leftKeypoints,
      pose_keypoints: [],
      duration: Math.ceil(duration / frameCount),
    });
  }

  return frames;
}

/**
 * Generate hand keypoints from gesture data
 */
function generateHandKeypoints(
  hands: HandGesture[],
  whichHand: 'left' | 'right',
  progress: number,
): Array<{ id: string; x: number; y: number; z: number }> {
  const keypoints: Array<{ id: string; x: number; y: number; z: number }> = [];

  // Find the hand gesture for this side
  const handGesture = hands.find(h => h.hand === whichHand || h.hand === 'both');
  if (!handGesture) return [];

  // Generate 21 keypoints (MediaPipe hand format)
  for (let i = 0; i < 21; i++) {
    const isExtended = isFingerExtended(handGesture, i);
    
    // Create smoother animation with easing
    const easedProgress = easeInOutCubic(progress);

    // Base position with hand movement
    let x = handGesture.position.x * easedProgress;
    let y = handGesture.position.y * easedProgress;
    const z = handGesture.position.z * easedProgress;

    // Apply finger extension/curling based on gesture
    if (i > 0) {
      const fingerExtension = isExtended ? 1 : 0;
      const fingerCurl = 1 - fingerExtension;
      
      // Offset fingers based on their position
      const fingerBaseY = 0.1 + (i % 5) * 0.15;
      y = y + fingerBaseY - fingerCurl * 0.1;
      
      // Spread fingers
      const fingerX = (i % 5) * 0.08 - 0.16;
      x = x + fingerX * (1 - fingerCurl * 0.5);
    }

    keypoints.push({
      id: i.toString(),
      x: Math.max(0, Math.min(1, x + 0.5)), // Normalize to 0-1
      y: Math.max(0, Math.min(1, y + 0.5)),
      z: z,
    });
  }

  return keypoints;
}

/**
 * Check if finger is extended in gesture
 */
function isFingerExtended(hand: HandGesture, keypointIndex: number): boolean {
  if (keypointIndex === 0) return true; // Wrist always visible

  // Map keypoint index to finger
  const fingerMap: { [key: number]: string } = {
    1: 'thumb',
    2: 'thumb',
    3: 'thumb',
    4: 'thumb',
    5: 'index',
    6: 'index',
    7: 'index',
    8: 'index',
    9: 'middle',
    10: 'middle',
    11: 'middle',
    12: 'middle',
    13: 'ring',
    14: 'ring',
    15: 'ring',
    16: 'ring',
    17: 'pinky',
    18: 'pinky',
    19: 'pinky',
    20: 'pinky',
  };

  const fingerName = fingerMap[keypointIndex];
  const fingerData = hand.fingers.find(f => f.finger === fingerName as any);

  return fingerData ? fingerData.extended || fingerData.curled < 0.5 : true;
}

/**
 * Easing function for smoother animation
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Convert multiple gestures to animation sequence
 */
export function gesturesToAnimationSequence(
  gestures: GestureData[],
  framesPerGesture: number = 30,
): HandAnimationData[] {
  const allFrames: HandAnimationData[] = [];

  for (const gesture of gestures) {
    const frames = gestureToAnimationFrames(gesture, framesPerGesture);
    allFrames.push(...frames);
  }

  return allFrames;
}
