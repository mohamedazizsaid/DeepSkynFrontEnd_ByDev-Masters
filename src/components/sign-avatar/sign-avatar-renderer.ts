/**
 * Professional Sign Language Avatar Renderer
 * Renders a realistic human avatar with articulated hands, arms, torso and head
 * Uses Canvas2D for maximum compatibility and performance
 */

// -- MediaPipe Hand Landmark indices (21 keypoints per hand) --
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const;

// Connections for drawing hand skeleton
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle
  [0, 13], [13, 14], [14, 15], [15, 16],// ring
  [0, 17], [17, 18], [18, 19], [19, 20],// pinky
  [5, 9], [9, 13], [13, 17],            // palm cross
];

// Upper body pose landmark indices (MediaPipe Pose)
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
};

const POSE_CONNECTIONS = [
  [11, 12],  // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24],           // hips
];

export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

export interface AvatarKeypoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface AvatarFrame {
  hand_right_keypoints: AvatarKeypoint[];
  hand_left_keypoints: AvatarKeypoint[];
  pose_keypoints: AvatarKeypoint[];
}

export interface AvatarConfig {
  width: number;
  height: number;
  /** Background gradient colors */
  bgGradient?: [string, string, string];
  /** Skin color */
  skinColor?: string;
  /** Clothing color */
  clothColor?: string;
  /** Hair color */
  hairColor?: string;
  /** Show keypoint dots for debug */
  showKeypoints?: boolean;
  /** Avatar style: 'silhouette' | 'cartoon' | 'skeleton' */
  style?: 'silhouette' | 'cartoon' | 'skeleton';
}

// -- Default rest pose for the avatar (normalized 0-1 coordinates) --
function createDefaultPose(): AvatarFrame {
  // Neutral standing rest pose - upper body
  const pose_keypoints: AvatarKeypoint[] = [];
  // We only need upper-body landmarks
  for (let i = 0; i < 25; i++) {
    pose_keypoints.push({ id: `pose-${i}`, x: 0.5, y: 0.5, z: 0 });
  }
  // Position key landmarks
  pose_keypoints[0]  = { id: 'nose',            x: 0.50, y: 0.15, z: 0 };
  pose_keypoints[11] = { id: 'left_shoulder',   x: 0.38, y: 0.30, z: 0 };
  pose_keypoints[12] = { id: 'right_shoulder',  x: 0.62, y: 0.30, z: 0 };
  pose_keypoints[13] = { id: 'left_elbow',      x: 0.30, y: 0.48, z: 0 };
  pose_keypoints[14] = { id: 'right_elbow',     x: 0.70, y: 0.48, z: 0 };
  pose_keypoints[15] = { id: 'left_wrist',      x: 0.32, y: 0.62, z: 0 };
  pose_keypoints[16] = { id: 'right_wrist',     x: 0.68, y: 0.62, z: 0 };
  pose_keypoints[23] = { id: 'left_hip',        x: 0.42, y: 0.72, z: 0 };
  pose_keypoints[24] = { id: 'right_hip',       x: 0.58, y: 0.72, z: 0 };

  // Hands at rest (relaxed, slightly open)
  const createRestHand = (centerX: number, centerY: number, isRight: boolean): AvatarKeypoint[] => {
    const sign = isRight ? 1 : -1;
    const kps: AvatarKeypoint[] = [];
    // Wrist
    kps.push({ id: 'wrist', x: centerX, y: centerY, z: 0 });
    // Thumb
    kps.push({ id: 'thumb_cmc', x: centerX + sign * 0.02, y: centerY - 0.01, z: 0 });
    kps.push({ id: 'thumb_mcp', x: centerX + sign * 0.035, y: centerY - 0.025, z: 0 });
    kps.push({ id: 'thumb_ip',  x: centerX + sign * 0.045, y: centerY - 0.04, z: 0 });
    kps.push({ id: 'thumb_tip', x: centerX + sign * 0.05, y: centerY - 0.05, z: 0 });
    // Index
    kps.push({ id: 'index_mcp', x: centerX + sign * 0.01, y: centerY - 0.03, z: 0 });
    kps.push({ id: 'index_pip', x: centerX + sign * 0.015, y: centerY - 0.055, z: 0 });
    kps.push({ id: 'index_dip', x: centerX + sign * 0.018, y: centerY - 0.075, z: 0 });
    kps.push({ id: 'index_tip', x: centerX + sign * 0.02, y: centerY - 0.09, z: 0 });
    // Middle
    kps.push({ id: 'middle_mcp', x: centerX, y: centerY - 0.035, z: 0 });
    kps.push({ id: 'middle_pip', x: centerX, y: centerY - 0.06, z: 0 });
    kps.push({ id: 'middle_dip', x: centerX, y: centerY - 0.08, z: 0 });
    kps.push({ id: 'middle_tip', x: centerX, y: centerY - 0.095, z: 0 });
    // Ring
    kps.push({ id: 'ring_mcp', x: centerX - sign * 0.01, y: centerY - 0.03, z: 0 });
    kps.push({ id: 'ring_pip', x: centerX - sign * 0.012, y: centerY - 0.055, z: 0 });
    kps.push({ id: 'ring_dip', x: centerX - sign * 0.013, y: centerY - 0.07, z: 0 });
    kps.push({ id: 'ring_tip', x: centerX - sign * 0.015, y: centerY - 0.085, z: 0 });
    // Pinky
    kps.push({ id: 'pinky_mcp', x: centerX - sign * 0.02, y: centerY - 0.025, z: 0 });
    kps.push({ id: 'pinky_pip', x: centerX - sign * 0.025, y: centerY - 0.045, z: 0 });
    kps.push({ id: 'pinky_dip', x: centerX - sign * 0.028, y: centerY - 0.06, z: 0 });
    kps.push({ id: 'pinky_tip', x: centerX - sign * 0.03, y: centerY - 0.07, z: 0 });
    return kps;
  };

  return {
    hand_right_keypoints: createRestHand(0.68, 0.62, true),
    hand_left_keypoints: createRestHand(0.32, 0.62, false),
    pose_keypoints,
  };
}

// -- Interpolation helper --
function lerpKeypoints(
  from: AvatarKeypoint[],
  to: AvatarKeypoint[],
  t: number,
): AvatarKeypoint[] {
  const len = Math.min(from.length, to.length);
  const result: AvatarKeypoint[] = [];
  for (let i = 0; i < len; i++) {
    result.push({
      id: to[i].id,
      x: from[i].x + (to[i].x - from[i].x) * t,
      y: from[i].y + (to[i].y - from[i].y) * t,
      z: from[i].z + (to[i].z - from[i].z) * t,
    });
  }
  // If target has more keypoints, append them directly
  for (let i = len; i < to.length; i++) {
    result.push({ ...to[i] });
  }
  return result;
}

function lerpFrame(from: AvatarFrame, to: AvatarFrame, t: number): AvatarFrame {
  return {
    hand_right_keypoints: lerpKeypoints(from.hand_right_keypoints, to.hand_right_keypoints, t),
    hand_left_keypoints: lerpKeypoints(from.hand_left_keypoints, to.hand_left_keypoints, t),
    pose_keypoints: lerpKeypoints(from.pose_keypoints, to.pose_keypoints, t),
  };
}

// -- Easing functions --
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function smoothTo(current: number, target: number, deltaTime: number, smoothMs: number): number {
  const alpha = 1 - Math.exp(-deltaTime / Math.max(1, smoothMs));
  return current + (target - current) * alpha;
}

// -- Drawing helpers --
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Main Avatar Renderer class
 */
export class SignAvatarRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<AvatarConfig>;
  private defaultPose: AvatarFrame;
  private currentFrame: AvatarFrame;
  private targetFrame: AvatarFrame;
  private animationProgress = 1; // 1 = at rest
  private _animationId: number | null = null;
  private elapsedMs = 0;
  private breathPhase = 0;
  private bodyWeightShift = 0;
  private shoulderLiftLeft = 0;
  private shoulderLiftRight = 0;
  private gestureEnergy = 0;
  private lastMotionAnchor: AvatarKeypoint | null = null;
  private blinkAmount = 0;
  private blinkState: 'idle' | 'closing' | 'hold' | 'opening' = 'idle';
  private blinkTimerMs = 0;
  private blinkHoldMs = 0;
  private nextBlinkMs = randomBetween(3000, 6000);
  private eyeTarget = { x: 0, y: 0 };
  private eyeOffset = { x: 0, y: 0 };
  private nextSaccadeMs = randomBetween(220, 900);
  private browLiftLeft = 0.25;
  private browLiftRight = 0.22;
  private mouthOpen = 0.12;
  private mouthWidth = 1;
  private mouthCurve = 0.08;
  private cheekFlush = 0.35;
  private utterance = '';
  private utteranceSeed = Math.random() * Math.PI * 2;
  private utteranceVowelRatio = 0.42;
  private skinTexturePattern: CanvasPattern | null = null;
  private facialAsymmetry = {
    eyeScaleOffset: randomBetween(-0.06, 0.06),
    browTilt: randomBetween(-0.8, 0.8),
    jawShift: randomBetween(-1.4, 1.4),
    lipTilt: randomBetween(-0.7, 0.7),
  };

  // Callback
  public onFrameRendered?: (frameIndex: number) => void;

  constructor(canvas: HTMLCanvasElement, config: Partial<AvatarConfig> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.config = {
      width: config.width ?? 600,
      height: config.height ?? 600,
      bgGradient: config.bgGradient ?? ['#0f0c29', '#302b63', '#24243e'],
      skinColor: config.skinColor ?? '#E8B89D',
      clothColor: config.clothColor ?? '#3B82F6',
      hairColor: config.hairColor ?? '#2D1B14',
      showKeypoints: config.showKeypoints ?? false,
      style: config.style ?? 'cartoon',
    };

    canvas.width = this.config.width;
    canvas.height = this.config.height;

    this.defaultPose = createDefaultPose();
    this.currentFrame = createDefaultPose();
    this.targetFrame = createDefaultPose();
    this.skinTexturePattern = this.createSkinTexturePattern();
  }

  /** Set target frame to animate towards */
  setTargetFrame(frame: AvatarFrame): void {
    const previousAnchor = this.pickMotionAnchor(this.targetFrame);
    // Ensure keypoints arrays aren't empty by merging with default
    this.targetFrame = {
      hand_right_keypoints: frame.hand_right_keypoints.length > 0
        ? frame.hand_right_keypoints
        : this.defaultPose.hand_right_keypoints,
      hand_left_keypoints: frame.hand_left_keypoints.length > 0
        ? frame.hand_left_keypoints
        : this.defaultPose.hand_left_keypoints,
      pose_keypoints: frame.pose_keypoints.length > 0
        ? frame.pose_keypoints
        : this.defaultPose.pose_keypoints,
    };

    const nextAnchor = this.pickMotionAnchor(this.targetFrame);
    if (previousAnchor && nextAnchor) {
      const motion = Math.hypot(
        nextAnchor.x - previousAnchor.x,
        nextAnchor.y - previousAnchor.y,
        nextAnchor.z - previousAnchor.z,
      );
      this.gestureEnergy = clamp(this.gestureEnergy * 0.78 + motion * 16, 0, 1);
    }

    this.animationProgress = 0;
  }

  /** Provide current spoken/signed label to drive subtle lip sync */
  setUtterance(text: string): void {
    const normalized = text.trim().toLowerCase();
    if (normalized === this.utterance) return;

    this.utterance = normalized;
    this.utteranceSeed = Math.random() * Math.PI * 2;

    const letters = normalized.replace(/[^a-zA-Z\u00C0-\u017F]/g, '');
    if (!letters) {
      this.utteranceVowelRatio = 0.42;
      return;
    }
    const vowels = (letters.match(/[aeiouy\u00E0\u00E2\u00E4\u00E9\u00E8\u00EA\u00EB\u00EE\u00EF\u00F4\u00F6\u00F9\u00FB\u00FC\u00FF]/gi) || []).length;
    this.utteranceVowelRatio = clamp(vowels / letters.length, 0.2, 0.85);
  }

  /** Reset to default rest pose */
  resetPose(): void {
    this.targetFrame = createDefaultPose();
    this.animationProgress = 0;
  }

  /** Render a single frame (called in animation loop) */
  render(deltaTime: number = 16): void {
    const { ctx, config } = this;
    const W = config.width;
    const H = config.height;

    this.elapsedMs += deltaTime;

    // Update animation progress
    if (this.animationProgress < 1) {
      // Slightly slower interpolation improves fluidity between sign frames.
      this.animationProgress = Math.min(1, this.animationProgress + deltaTime / 95);
      const t = easeInOutCubic(this.animationProgress);
      this.currentFrame = lerpFrame(this.currentFrame, this.targetFrame, t);
    }

    // Work on a cloned frame to avoid mutating keypoint streams.
    const frame = this.cloneFrame(this.currentFrame);
    this.applyProceduralBodyDynamics(frame, deltaTime);
    this.updateFacialDynamics(frame, deltaTime);

    // -- Clear & draw background --
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, config.bgGradient[0]);
    bgGrad.addColorStop(0.52, config.bgGradient[1]);
    bgGrad.addColorStop(1, config.bgGradient[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid pattern overlay
    ctx.save();
    ctx.globalAlpha = 0.032;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // Ambient glow behind avatar
    const glowGrad = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, W * 0.48);
    glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.17)');
    glowGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.07)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    if (config.style === 'cartoon') {
      this.drawCartoonAvatar(frame);
    } else if (config.style === 'skeleton') {
      this.drawSkeletonAvatar(frame);
    } else {
      this.drawSilhouetteAvatar(frame);
    }

    this.drawThreePointLightingOverlay();

    // Platform/floor
    ctx.save();
    const floorGrad = ctx.createLinearGradient(W * 0.15, H * 0.88, W * 0.85, H * 0.92);
    floorGrad.addColorStop(0, 'rgba(99,102,241,0)');
    floorGrad.addColorStop(0.3, 'rgba(99,102,241,0.32)');
    floorGrad.addColorStop(0.7, 'rgba(139,92,246,0.32)');
    floorGrad.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(W * 0.15, H * 0.88, W * 0.7, 4);
    ctx.restore();
  }

  private cloneFrame(frame: AvatarFrame): AvatarFrame {
    return {
      hand_right_keypoints: frame.hand_right_keypoints.map((kp) => ({ ...kp })),
      hand_left_keypoints: frame.hand_left_keypoints.map((kp) => ({ ...kp })),
      pose_keypoints: frame.pose_keypoints.map((kp) => ({ ...kp })),
    };
  }

  private pickMotionAnchor(frame: AvatarFrame): AvatarKeypoint | null {
    return (
      frame.hand_right_keypoints[8]
      || frame.hand_right_keypoints[0]
      || frame.hand_left_keypoints[8]
      || frame.hand_left_keypoints[0]
      || frame.pose_keypoints[16]
      || frame.pose_keypoints[15]
      || frame.pose_keypoints[0]
      || null
    );
  }

  private applyProceduralBodyDynamics(frame: AvatarFrame, deltaTime: number): void {
    const pose = frame.pose_keypoints;
    if (pose.length <= POSE_LANDMARKS.RIGHT_HIP) return;

    this.breathPhase += deltaTime * ((Math.PI * 2) / 3750); // ~16 breaths/min
    const breathOffset = Math.sin(this.breathPhase) * 0.0034;
    const swayX = Math.sin(this.elapsedMs * 0.0011 + 0.5) * 0.002 + Math.sin(this.elapsedMs * 0.0024) * 0.0012;
    const swayY = Math.cos(this.elapsedMs * 0.0018 + 1.1) * 0.0011;

    const lWrist = pose[POSE_LANDMARKS.LEFT_WRIST] ?? { id: 'lw', x: 0.32, y: 0.62, z: 0 };
    const rWrist = pose[POSE_LANDMARKS.RIGHT_WRIST] ?? { id: 'rw', x: 0.68, y: 0.62, z: 0 };
    const lShoulder = pose[POSE_LANDMARKS.LEFT_SHOULDER] ?? { id: 'ls', x: 0.38, y: 0.30, z: 0 };
    const rShoulder = pose[POSE_LANDMARKS.RIGHT_SHOULDER] ?? { id: 'rs', x: 0.62, y: 0.30, z: 0 };

    const shoulderCenterX = (lShoulder.x + rShoulder.x) / 2;
    const wristsCenterX = (lWrist.x + rWrist.x) / 2;
    const weightTarget = clamp((wristsCenterX - shoulderCenterX) * 0.16, -0.018, 0.018);
    this.bodyWeightShift = smoothTo(this.bodyWeightShift, weightTarget, deltaTime, 220);

    const leftLiftTarget = breathOffset + clamp((lShoulder.y - lWrist.y) * 2.5, -0.35, 0.65) * 0.0038;
    const rightLiftTarget = breathOffset + clamp((rShoulder.y - rWrist.y) * 2.5, -0.35, 0.65) * 0.0038;
    this.shoulderLiftLeft = smoothTo(this.shoulderLiftLeft, leftLiftTarget, deltaTime, 145);
    this.shoulderLiftRight = smoothTo(this.shoulderLiftRight, rightLiftTarget, deltaTime, 145);

    const baseOffsetX = this.bodyWeightShift + swayX;
    const baseOffsetY = breathOffset + swayY;

    const torsoIndices = [0, 11, 12, 13, 14, 15, 16, 23, 24];
    for (const idx of torsoIndices) {
      if (!pose[idx]) continue;
      pose[idx] = {
        ...pose[idx],
        x: clamp01(pose[idx].x + baseOffsetX),
        y: clamp01(pose[idx].y + baseOffsetY),
      };
    }

    if (pose[11]) pose[11] = { ...pose[11], y: clamp01(pose[11].y + this.shoulderLiftLeft) };
    if (pose[12]) pose[12] = { ...pose[12], y: clamp01(pose[12].y + this.shoulderLiftRight) };
    if (pose[13]) pose[13] = { ...pose[13], y: clamp01(pose[13].y + this.shoulderLiftLeft * 0.62) };
    if (pose[14]) pose[14] = { ...pose[14], y: clamp01(pose[14].y + this.shoulderLiftRight * 0.62) };

    const applyHandOffset = (kps: AvatarKeypoint[], mirrorInfluence: number) => {
      for (let i = 0; i < kps.length; i += 1) {
        kps[i] = {
          ...kps[i],
          x: clamp01(kps[i].x + baseOffsetX * 0.9 + this.bodyWeightShift * mirrorInfluence),
          y: clamp01(kps[i].y + baseOffsetY * 0.92),
        };
      }
    };

    applyHandOffset(frame.hand_right_keypoints, 0.2);
    applyHandOffset(frame.hand_left_keypoints, -0.2);
  }

  private updateFacialDynamics(frame: AvatarFrame, deltaTime: number): void {
    const anchor = this.pickMotionAnchor(frame);
    if (anchor && this.lastMotionAnchor) {
      const speed = Math.hypot(
        anchor.x - this.lastMotionAnchor.x,
        anchor.y - this.lastMotionAnchor.y,
        anchor.z - this.lastMotionAnchor.z,
      ) * 95;
      this.gestureEnergy = smoothTo(this.gestureEnergy, clamp(speed * 0.9, 0, 1), deltaTime, 170);
    } else {
      this.gestureEnergy = smoothTo(this.gestureEnergy, 0, deltaTime, 260);
    }
    if (anchor) this.lastMotionAnchor = { ...anchor };

    // Blink every 3-6 seconds.
    if (this.blinkState === 'idle') {
      this.blinkTimerMs += deltaTime;
      if (this.blinkTimerMs >= this.nextBlinkMs) {
        this.blinkState = 'closing';
        this.blinkTimerMs = 0;
      }
    } else if (this.blinkState === 'closing') {
      this.blinkAmount = clamp01(this.blinkAmount + deltaTime / 85);
      if (this.blinkAmount >= 1) {
        this.blinkState = 'hold';
        this.blinkHoldMs = randomBetween(35, 85);
      }
    } else if (this.blinkState === 'hold') {
      this.blinkHoldMs -= deltaTime;
      if (this.blinkHoldMs <= 0) this.blinkState = 'opening';
    } else if (this.blinkState === 'opening') {
      this.blinkAmount = clamp01(this.blinkAmount - deltaTime / 120);
      if (this.blinkAmount <= 0.02) {
        this.blinkAmount = 0;
        this.blinkState = 'idle';
        this.nextBlinkMs = randomBetween(3000, 6000);
      }
    }

    // Ocular micro-saccades + breathing gaze.
    this.nextSaccadeMs -= deltaTime;
    if (this.nextSaccadeMs <= 0) {
      this.eyeTarget.x = randomBetween(-0.9, 0.9);
      this.eyeTarget.y = randomBetween(-0.5, 0.55);
      this.nextSaccadeMs = randomBetween(220, 900);
    }
    this.eyeOffset.x = smoothTo(this.eyeOffset.x, this.eyeTarget.x, deltaTime, 70);
    this.eyeOffset.y = smoothTo(this.eyeOffset.y, this.eyeTarget.y, deltaTime, 90);
    this.eyeOffset.x = clamp(this.eyeOffset.x + Math.sin(this.elapsedMs * 0.0014) * 0.005, -1, 1);
    this.eyeOffset.y = clamp(this.eyeOffset.y + Math.cos(this.elapsedMs * 0.0012) * 0.004, -0.8, 0.8);

    const pose = frame.pose_keypoints;
    const nose = pose[0] ?? { id: 'nose', x: 0.5, y: 0.15, z: 0 };
    const rightTip = frame.hand_right_keypoints[8] ?? frame.hand_right_keypoints[0] ?? { id: 'rt', x: 0.68, y: 0.62, z: 0 };
    const leftTip = frame.hand_left_keypoints[8] ?? frame.hand_left_keypoints[0] ?? { id: 'lt', x: 0.32, y: 0.62, z: 0 };
    const nearFace = clamp(
      (0.23 - Math.min(
        Math.hypot(rightTip.x - nose.x, rightTip.y - nose.y),
        Math.hypot(leftTip.x - nose.x, leftTip.y - nose.y),
      )) / 0.23,
      0,
      1,
    );
    const browTarget = clamp(0.14 + nearFace * 0.54 + this.gestureEnergy * 0.24, 0.08, 1);
    this.browLiftLeft = smoothTo(this.browLiftLeft, browTarget * (1 + this.facialAsymmetry.eyeScaleOffset * 0.35), deltaTime, 100);
    this.browLiftRight = smoothTo(this.browLiftRight, browTarget * (1 - this.facialAsymmetry.eyeScaleOffset * 0.35), deltaTime, 110);

    // Labial motion synchronized with gesture intensity and utterance.
    const speakingDrive = this.utterance ? 0.95 : 0.35;
    const syllableWave = 0.5 + 0.5 * Math.sin(this.elapsedMs * (0.006 + this.utteranceVowelRatio * 0.004) + this.utteranceSeed);
    const mouthOpenTarget = clamp(
      0.06 + (this.gestureEnergy * 0.55 + speakingDrive * 0.45) * (0.08 + syllableWave * 0.24),
      0.04,
      0.45,
    );
    const mouthWidthTarget = clamp(0.84 + this.utteranceVowelRatio * 0.23 + (1 - syllableWave) * 0.12, 0.8, 1.2);
    const mouthCurveTarget = clamp(0.04 + this.gestureEnergy * 0.12 - nearFace * 0.05, -0.08, 0.2);
    this.mouthOpen = smoothTo(this.mouthOpen, mouthOpenTarget, deltaTime, 75);
    this.mouthWidth = smoothTo(this.mouthWidth, mouthWidthTarget, deltaTime, 90);
    this.mouthCurve = smoothTo(this.mouthCurve, mouthCurveTarget, deltaTime, 120);
    this.cheekFlush = smoothTo(this.cheekFlush, clamp(0.22 + this.gestureEnergy * 0.38 + nearFace * 0.2, 0.2, 0.75), deltaTime, 260);
  }

  // -- Cartoon style avatar --
  private drawCartoonAvatar(frame: AvatarFrame): void {
    const { ctx, config } = this;
    const W = config.width;
    const H = config.height;
    const pose = frame.pose_keypoints;

    const toPixel = (kp: AvatarKeypoint): Vec2 => ({
      x: kp.x * W,
      y: kp.y * H,
    });

    // Get key positions
    const nose = pose[0] ? toPixel(pose[0]) : { x: W * 0.5, y: H * 0.15 };
    const lShoulder = pose[11] ? toPixel(pose[11]) : { x: W * 0.38, y: H * 0.3 };
    const rShoulder = pose[12] ? toPixel(pose[12]) : { x: W * 0.62, y: H * 0.3 };
    const lElbow = pose[13] ? toPixel(pose[13]) : { x: W * 0.3, y: H * 0.48 };
    const rElbow = pose[14] ? toPixel(pose[14]) : { x: W * 0.7, y: H * 0.48 };
    const lWrist = pose[15] ? toPixel(pose[15]) : { x: W * 0.32, y: H * 0.62 };
    const rWrist = pose[16] ? toPixel(pose[16]) : { x: W * 0.68, y: H * 0.62 };
    const lHip = pose[23] ? toPixel(pose[23]) : { x: W * 0.42, y: H * 0.72 };
    const rHip = pose[24] ? toPixel(pose[24]) : { x: W * 0.58, y: H * 0.72 };

    const neckX = (lShoulder.x + rShoulder.x) / 2 + this.bodyWeightShift * W * 0.9;
    const neckY = (lShoulder.y + rShoulder.y) / 2 - H * 0.02;
    const torsoShiftX = this.bodyWeightShift * W * 0.95;

    // -- Torso --
    ctx.save();
    const torsoGrad = ctx.createLinearGradient(lShoulder.x, neckY - 8, rShoulder.x, lHip.y + 20);
    torsoGrad.addColorStop(0, this.lightenColor(config.clothColor, 8));
    torsoGrad.addColorStop(0.52, config.clothColor);
    torsoGrad.addColorStop(1, this.darkenColor(config.clothColor, 34));
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.moveTo(lShoulder.x - 10 + torsoShiftX * 0.2, lShoulder.y);
    ctx.quadraticCurveTo(neckX, neckY - 8, rShoulder.x + 10 + torsoShiftX * 0.2, rShoulder.y);
    ctx.lineTo(rHip.x + 6 + torsoShiftX, rHip.y);
    ctx.quadraticCurveTo((lHip.x + rHip.x) / 2 + torsoShiftX, rHip.y + 18, lHip.x - 6 + torsoShiftX, lHip.y);
    ctx.closePath();
    ctx.fill();

    // Collar / neckline
    ctx.strokeStyle = this.darkenColor(config.clothColor, 50);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(neckX, neckY + 5, 18, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Lower body fade
    ctx.save();
    const lowerGrad = ctx.createLinearGradient(lHip.x, lHip.y, rHip.x + torsoShiftX, H * 0.9);
    lowerGrad.addColorStop(0, this.darkenColor(config.clothColor, 8));
    lowerGrad.addColorStop(1, this.darkenColor(config.clothColor, 65));
    ctx.fillStyle = lowerGrad;
    ctx.fillRect(lHip.x - 12 + torsoShiftX, lHip.y, rHip.x - lHip.x + 24, H * 0.88 - lHip.y);
    ctx.restore();

    // -- Arms --
    this.drawLimb(ctx, lShoulder, lElbow, 18, 14, config.clothColor, false);
    this.drawLimb(ctx, lElbow, lWrist, 14, 10, config.skinColor, true);
    this.drawLimb(ctx, rShoulder, rElbow, 18, 14, config.clothColor, false);
    this.drawLimb(ctx, rElbow, rWrist, 14, 10, config.skinColor, true);

    // -- Neck --
    ctx.save();
    const neckGrad = ctx.createLinearGradient(neckX, neckY, neckX, nose.y + 38);
    neckGrad.addColorStop(0, this.lightenColor(config.skinColor, 8));
    neckGrad.addColorStop(1, this.darkenColor(config.skinColor, 16));
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(neckX - 12, neckY);
    ctx.lineTo(neckX + 12, neckY);
    ctx.lineTo(neckX + 10, nose.y + 35);
    ctx.lineTo(neckX - 10, nose.y + 35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(70, 35, 25, 0.16)';
    ctx.beginPath();
    ctx.ellipse(neckX, nose.y + 34, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Head --
    this.drawHead(ctx, nose, neckX, neckY, W, H);

    // -- Hands --
    this.drawHand(ctx, frame.hand_right_keypoints, W, H, true);
    this.drawHand(ctx, frame.hand_left_keypoints, W, H, false);
  }

  // -- Skeleton style --
  private drawSkeletonAvatar(frame: AvatarFrame): void {
    const { ctx, config } = this;
    const W = config.width;
    const H = config.height;

    const toPixel = (kp: AvatarKeypoint): Vec2 => ({
      x: kp.x * W,
      y: kp.y * H,
    });

    // Draw pose skeleton
    ctx.save();
    ctx.strokeStyle = 'rgba(99,211,255,0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (const [i, j] of POSE_CONNECTIONS) {
      if (i < frame.pose_keypoints.length && j < frame.pose_keypoints.length) {
        const a = toPixel(frame.pose_keypoints[i]);
        const b = toPixel(frame.pose_keypoints[j]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Draw pose joints
    ctx.fillStyle = '#A78BFA';
    for (const kp of frame.pose_keypoints) {
      const p = toPixel(kp);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw hands
    this.drawHandSkeleton(ctx, frame.hand_right_keypoints, W, H, '#FF6B6B');
    this.drawHandSkeleton(ctx, frame.hand_left_keypoints, W, H, '#4ECDC4');
  }

  private drawHandSkeleton(
    ctx: CanvasRenderingContext2D,
    keypoints: AvatarKeypoint[],
    W: number, H: number,
    color: string,
  ): void {
    if (keypoints.length < 21) return;

    const toPixel = (kp: AvatarKeypoint): Vec2 => ({
      x: kp.x * W,
      y: kp.y * H,
    });

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (const [i, j] of HAND_CONNECTIONS) {
      if (i < keypoints.length && j < keypoints.length) {
        const a = toPixel(keypoints[i]);
        const b = toPixel(keypoints[j]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Joints
    ctx.fillStyle = '#FFFFFF';
    for (const kp of keypoints) {
      const p = toPixel(kp);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fingertips glow
    const tipIndices = [4, 8, 12, 16, 20];
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    for (const idx of tipIndices) {
      if (idx < keypoints.length) {
        const p = toPixel(keypoints[idx]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // -- Silhouette style -- 
  private drawSilhouetteAvatar(frame: AvatarFrame): void {
    // Use skeleton as base but with thicker lines and glow
    const { ctx, config } = this;
    ctx.save();
    ctx.shadowColor = '#6366F1';
    ctx.shadowBlur = 20;
    this.drawSkeletonAvatar(frame);
    ctx.restore();
  }

  // -- Draw head --
  private drawHead(
    ctx: CanvasRenderingContext2D,
    nose: Vec2,
    neckX: number,
    _neckY: number,
    _W: number,
    _H: number,
  ): void {
    const config = this.config;
    const headCenterX = neckX + this.facialAsymmetry.jawShift * 0.35 + this.bodyWeightShift * 18;
    const headCenterY = nose.y + Math.sin(this.elapsedMs * 0.0016) * 0.6;
    const headRadiusX = 38;
    const headRadiusY = 45;

    const eyeSpacing = 15 + this.facialAsymmetry.eyeScaleOffset * 5;
    const eyeY = headCenterY - 4 + this.eyeOffset.y * 0.35;
    const blinkOpenFactor = clamp(1 - this.blinkAmount * 0.95, 0.08, 1);

    // Ears with subtle subsurface-scattering tint.
    ctx.save();
    ctx.fillStyle = config.skinColor;
    ctx.beginPath();
    ctx.ellipse(headCenterX - headRadiusX - 1.2, headCenterY + 0.2, 6.2, 10.3, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCenterX + headRadiusX + 1.2, headCenterY - 0.1, 6.2, 10.1, 0.15, 0, Math.PI * 2);
    ctx.fill();

    const earGlow = ctx.createRadialGradient(headCenterX - headRadiusX - 1, headCenterY + 1, 1, headCenterX - headRadiusX - 1, headCenterY + 1, 12);
    earGlow.addColorStop(0, 'rgba(255, 120, 92, 0.24)');
    earGlow.addColorStop(1, 'rgba(255, 120, 92, 0)');
    ctx.fillStyle = earGlow;
    ctx.beginPath();
    ctx.ellipse(headCenterX - headRadiusX - 1.2, headCenterY + 0.2, 6.2, 10.3, -0.15, 0, Math.PI * 2);
    ctx.fill();

    const earGlow2 = ctx.createRadialGradient(headCenterX + headRadiusX + 1, headCenterY + 1, 1, headCenterX + headRadiusX + 1, headCenterY + 1, 12);
    earGlow2.addColorStop(0, 'rgba(255, 118, 90, 0.2)');
    earGlow2.addColorStop(1, 'rgba(255, 118, 90, 0)');
    ctx.fillStyle = earGlow2;
    ctx.beginPath();
    ctx.ellipse(headCenterX + headRadiusX + 1.2, headCenterY - 0.1, 6.2, 10.1, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(headCenterX + 2.4, headCenterY + 3.2, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head base with skin shading
    ctx.save();
    const headGrad = ctx.createRadialGradient(
      headCenterX - 10, headCenterY - 11, 5,
      headCenterX, headCenterY, headRadiusX + 8,
    );
    headGrad.addColorStop(0, this.lightenColor(config.skinColor, 17));
    headGrad.addColorStop(0.45, config.skinColor);
    headGrad.addColorStop(1, this.darkenColor(config.skinColor, 10));
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Skin texture + tone variations
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.clip();

    if (this.skinTexturePattern) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = this.skinTexturePattern;
      ctx.fillRect(headCenterX - headRadiusX - 8, headCenterY - headRadiusY - 8, headRadiusX * 2 + 16, headRadiusY * 2 + 16);
      ctx.globalAlpha = 1;
    }

    const eyeToneGrad = ctx.createRadialGradient(headCenterX, eyeY - 2, 2, headCenterX, eyeY - 2, 32);
    eyeToneGrad.addColorStop(0, 'rgba(255, 245, 240, 0.22)');
    eyeToneGrad.addColorStop(1, 'rgba(255, 245, 240, 0)');
    ctx.fillStyle = eyeToneGrad;
    ctx.fillRect(headCenterX - 42, eyeY - 18, 84, 36);

    const leftCheek = ctx.createRadialGradient(headCenterX - 17, headCenterY + 14, 2, headCenterX - 17, headCenterY + 14, 16);
    leftCheek.addColorStop(0, `rgba(235, 132, 121, ${0.16 + this.cheekFlush * 0.15})`);
    leftCheek.addColorStop(1, 'rgba(235,132,121,0)');
    ctx.fillStyle = leftCheek;
    ctx.fillRect(headCenterX - 35, headCenterY - 4, 36, 34);

    const rightCheek = ctx.createRadialGradient(headCenterX + 17, headCenterY + 14, 2, headCenterX + 17, headCenterY + 14, 16);
    rightCheek.addColorStop(0, `rgba(235, 132, 121, ${0.14 + this.cheekFlush * 0.13})`);
    rightCheek.addColorStop(1, 'rgba(235,132,121,0)');
    ctx.fillStyle = rightCheek;
    ctx.fillRect(headCenterX - 1, headCenterY - 4, 36, 34);

    ctx.restore();
    ctx.restore();

    // Hair
    ctx.save();
    const hairGrad = ctx.createLinearGradient(headCenterX, headCenterY - 55, headCenterX, headCenterY);
    hairGrad.addColorStop(0, this.lightenColor(config.hairColor, 8));
    hairGrad.addColorStop(1, this.darkenColor(config.hairColor, 8));
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY - 20, headRadiusX + 4, 32, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Side hair
    ctx.beginPath();
    ctx.ellipse(headCenterX - headRadiusX, headCenterY - 5, 8, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCenterX + headRadiusX, headCenterY - 5, 8, 20, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyes
    const leftEyeX = headCenterX - eyeSpacing;
    const rightEyeX = headCenterX + eyeSpacing;
    const leftEyeH = 6 * blinkOpenFactor * (1 + this.facialAsymmetry.eyeScaleOffset * 0.15);
    const rightEyeH = 6 * blinkOpenFactor * (1 - this.facialAsymmetry.eyeScaleOffset * 0.15);
    const gazeX = this.eyeOffset.x * 2.2;
    const gazeY = this.eyeOffset.y * 1.5;

    // Eye whites
    ctx.save();
    ctx.fillStyle = 'rgba(70, 38, 26, 0.12)';
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeY + 2.6, 8.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeY + 2.6, 8.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeY, 8.2, leftEyeH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeY, 8.2, rightEyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#3E302F';
    ctx.beginPath();
    ctx.arc(leftEyeX + gazeX, eyeY + gazeY, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + gazeX, eyeY + gazeY, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1F1616';
    ctx.beginPath();
    ctx.arc(leftEyeX + gazeX, eyeY + gazeY, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + gazeX, eyeY + gazeY, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Catch lights
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(leftEyeX + gazeX - 1.2, eyeY + gazeY - 1.4, 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + gazeX - 1.2, eyeY + gazeY - 1.4, 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(leftEyeX + gazeX + 1.1, eyeY + gazeY + 0.7, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + gazeX + 1.1, eyeY + gazeY + 0.7, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyebrows (important for LSF grammar)
    ctx.save();
    ctx.strokeStyle = this.darkenColor(config.hairColor, 5);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    const leftBrowY = eyeY - 11 - this.browLiftLeft * 6 + this.facialAsymmetry.browTilt * 0.15;
    const rightBrowY = eyeY - 11 - this.browLiftRight * 6 - this.facialAsymmetry.browTilt * 0.15;
    ctx.beginPath();
    ctx.moveTo(leftEyeX - 8.4, leftBrowY + 0.7);
    ctx.quadraticCurveTo(leftEyeX, leftBrowY - 3.2, leftEyeX + 8.6, leftBrowY + 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightEyeX - 8.6, rightBrowY + 0.8);
    ctx.quadraticCurveTo(rightEyeX, rightBrowY - 3.4, rightEyeX + 8.4, rightBrowY + 0.7);
    ctx.stroke();
    ctx.restore();

    // Nose + subtle shadow
    ctx.save();
    const noseShadow = ctx.createLinearGradient(headCenterX, eyeY + 4, headCenterX + 8, eyeY + 22);
    noseShadow.addColorStop(0, 'rgba(95, 52, 40, 0.2)');
    noseShadow.addColorStop(1, 'rgba(95, 52, 40, 0)');
    ctx.strokeStyle = noseShadow;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(headCenterX + 0.4, eyeY + 4);
    ctx.quadraticCurveTo(headCenterX + 4.4, eyeY + 13.5, headCenterX + 0.8, eyeY + 17.2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(96, 55, 43, 0.2)';
    ctx.beginPath();
    ctx.ellipse(headCenterX - 1.8, eyeY + 17.6, 1.1, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCenterX + 1.6, eyeY + 17.6, 1.1, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Mouth with procedural labial movement
    const mouthCenterX = headCenterX + this.facialAsymmetry.jawShift * 0.5;
    const mouthCenterY = headCenterY + 19 + this.facialAsymmetry.lipTilt * 0.35;
    const mouthWidthPx = 10.4 * this.mouthWidth;
    const mouthOpenPx = 1.2 + this.mouthOpen * 8.5;
    const lipCurvePx = this.mouthCurve * 5.2;
    ctx.save();
    if (mouthOpenPx > 2.2) {
      ctx.fillStyle = 'rgba(84, 35, 35, 0.62)';
      ctx.beginPath();
      ctx.ellipse(mouthCenterX, mouthCenterY + 1.1, mouthWidthPx * 0.52, mouthOpenPx * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(190, 84, 92, 0.24)';
      ctx.beginPath();
      ctx.ellipse(mouthCenterX, mouthCenterY + mouthOpenPx * 0.2, mouthWidthPx * 0.36, mouthOpenPx * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#B85E68';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mouthCenterX - mouthWidthPx, mouthCenterY);
    ctx.quadraticCurveTo(mouthCenterX, mouthCenterY - 2.2 + lipCurvePx, mouthCenterX + mouthWidthPx, mouthCenterY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(182, 96, 106, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mouthCenterX - mouthWidthPx * 0.9, mouthCenterY + mouthOpenPx * 0.32);
    ctx.quadraticCurveTo(mouthCenterX, mouthCenterY + mouthOpenPx * 0.5 + lipCurvePx * 0.2, mouthCenterX + mouthWidthPx * 0.9, mouthCenterY + mouthOpenPx * 0.32);
    ctx.stroke();
    ctx.restore();

    // Natural shadows under chin and eyes
    ctx.save();
    ctx.fillStyle = 'rgba(55, 28, 20, 0.08)';
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY + headRadiusY - 4, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(55, 28, 20, 0.06)';
    ctx.ellipse(leftEyeX, eyeY + 7, 6, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeY + 7, 6, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // -- Draw detailed hand --
  private drawHand(
    ctx: CanvasRenderingContext2D,
    keypoints: AvatarKeypoint[],
    W: number, H: number,
    isRight: boolean,
  ): void {
    if (keypoints.length < 5) return;

    const config = this.config;
    // Hand focus boost: larger and more readable for LSF.
    const handScaleX = 1.72;
    const handScaleY = 1.85;
    // Do not mirror here: keypoint sources already carry left/right orientation.
    const directionSign = 1;
    const visibilityBoost = 1.32;
    const wristKp = keypoints[0] ?? { x: 0.5, y: 0.5, z: 0, id: 'wrist' };
    const toPixel = (kp: AvatarKeypoint): Vec2 => ({
      x: (wristKp.x + (kp.x - wristKp.x) * handScaleX * directionSign) * W,
      y: (wristKp.y + (kp.y - wristKp.y) * handScaleY) * H,
    });

    const wrist = toPixel(keypoints[0]);
    const side = isRight ? -1 : 1;

    // Hand cast shadow + spotlight to improve visibility.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(wrist.x + 2.2, wrist.y + 4.1, 23 * visibilityBoost, 14 * visibilityBoost, 0, 0, Math.PI * 2);
    ctx.fill();
    const handLight = ctx.createRadialGradient(wrist.x, wrist.y - 2, 2, wrist.x, wrist.y, 36 * visibilityBoost);
    handLight.addColorStop(0, 'rgba(255, 214, 180, 0.21)');
    handLight.addColorStop(1, 'rgba(255, 214, 180, 0)');
    ctx.fillStyle = handLight;
    ctx.beginPath();
    ctx.arc(wrist.x, wrist.y, 38 * visibilityBoost, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (keypoints.length >= 21) {
      const mcp5 = toPixel(keypoints[5]);
      const mcp9 = toPixel(keypoints[9]);
      const mcp13 = toPixel(keypoints[13]);
      const mcp17 = toPixel(keypoints[17]);
      const thumbBase = toPixel(keypoints[1]);

      const palmGrad = ctx.createRadialGradient(wrist.x, wrist.y - 4, 2, wrist.x, wrist.y - 2, 46 * visibilityBoost);
      palmGrad.addColorStop(0, this.lightenColor(config.skinColor, 11));
      palmGrad.addColorStop(0.65, config.skinColor);
      palmGrad.addColorStop(1, this.darkenColor(config.skinColor, 15));
      ctx.fillStyle = palmGrad;

      // Rounded palm shape (less blocky than straight polygon).
      ctx.beginPath();
      ctx.moveTo(wrist.x + side * 8, wrist.y + 1.8);
      ctx.quadraticCurveTo((wrist.x + mcp17.x) / 2, wrist.y + 9, mcp17.x, mcp17.y);
      ctx.quadraticCurveTo((mcp17.x + mcp13.x) / 2, (mcp17.y + mcp13.y) / 2 + 2.5, mcp13.x, mcp13.y);
      ctx.quadraticCurveTo((mcp13.x + mcp9.x) / 2, (mcp13.y + mcp9.y) / 2 + 1.6, mcp9.x, mcp9.y);
      ctx.quadraticCurveTo((mcp9.x + mcp5.x) / 2, (mcp9.y + mcp5.y) / 2 + 1.4, mcp5.x, mcp5.y);
      ctx.quadraticCurveTo((mcp5.x + thumbBase.x) / 2, (mcp5.y + thumbBase.y) / 2 + 2.2, thumbBase.x, thumbBase.y);
      ctx.quadraticCurveTo((thumbBase.x + wrist.x) / 2, wrist.y + 7, wrist.x - side * 8, wrist.y + 1.8);
      ctx.closePath();
      ctx.fill();

      // Palm contour for stronger separation from background.
      ctx.strokeStyle = 'rgba(116, 70, 58, 0.4)';
      ctx.lineWidth = 1.25 * visibilityBoost;
      ctx.stroke();

      // Palm texture and subsurface tint
      ctx.save();
      ctx.clip();
      if (this.skinTexturePattern) {
        // Keep texture subtle to avoid "carreau" artifacts on the palm.
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = this.skinTexturePattern;
        ctx.fillRect(wrist.x - 48, wrist.y - 48, 96, 96);
      }
      ctx.globalAlpha = 1;
      const sss = ctx.createRadialGradient((mcp5.x + mcp17.x) / 2, (mcp5.y + mcp17.y) / 2 - 2, 2, (mcp5.x + mcp17.x) / 2, (mcp5.y + mcp17.y) / 2 - 2, 32);
      sss.addColorStop(0, 'rgba(255, 122, 93, 0.2)');
      sss.addColorStop(1, 'rgba(255, 122, 93, 0)');
      ctx.fillStyle = sss;
      ctx.fillRect(wrist.x - 34, wrist.y - 40, 68, 68);
      ctx.restore();

      // Finger webbing between MCPs for a more natural hand base.
      const webPairs = [
        [mcp5, mcp9],
        [mcp9, mcp13],
        [mcp13, mcp17],
      ] as const;
      ctx.save();
      ctx.fillStyle = 'rgba(227, 173, 145, 0.45)';
      for (const [a, b] of webPairs) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + 1.2);
        ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 2.5, b.x, b.y + 1.2);
        ctx.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + 6.5, a.x, a.y + 1.2);
        ctx.closePath();
        ctx.fill();
      }

      // Thenar/hypothenar soft masses for a more organic palm volume.
      const thenar = ctx.createRadialGradient(thumbBase.x + side * 4, thumbBase.y + 6, 1, thumbBase.x + side * 4, thumbBase.y + 6, 15);
      thenar.addColorStop(0, 'rgba(245, 198, 173, 0.45)');
      thenar.addColorStop(1, 'rgba(245, 198, 173, 0)');
      ctx.fillStyle = thenar;
      ctx.beginPath();
      ctx.ellipse(thumbBase.x + side * 4, thumbBase.y + 6, 12, 10, side * 0.4, 0, Math.PI * 2);
      ctx.fill();

      const hypo = ctx.createRadialGradient(mcp17.x - side * 3, mcp17.y + 5, 1, mcp17.x - side * 3, mcp17.y + 5, 14);
      hypo.addColorStop(0, 'rgba(236, 182, 155, 0.28)');
      hypo.addColorStop(1, 'rgba(236, 182, 155, 0)');
      ctx.fillStyle = hypo;
      ctx.beginPath();
      ctx.ellipse(mcp17.x - side * 3, mcp17.y + 5, 10, 8, -side * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Dorsal veins
      ctx.save();
      ctx.strokeStyle = 'rgba(72, 109, 140, 0.24)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wrist.x + (isRight ? -1 : 1), wrist.y - 2);
      ctx.quadraticCurveTo((wrist.x + mcp9.x) / 2, wrist.y - 8, mcp9.x - (isRight ? 1.2 : -1.2), mcp9.y + 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wrist.x + (isRight ? 2 : -2), wrist.y - 4);
      ctx.quadraticCurveTo((wrist.x + mcp13.x) / 2, wrist.y - 10, mcp13.x + (isRight ? 1.2 : -1.2), mcp13.y + 1.4);
      ctx.stroke();
      ctx.restore();
    }

    // Finger volumes (thicker, rounded, realistic).
    const fingerDefs = [
      { chain: [0, 1, 2, 3, 4], baseW: 13.2, tipW: 7.8 },
      { chain: [5, 6, 7, 8], baseW: 15.4, tipW: 8.8 },
      { chain: [9, 10, 11, 12], baseW: 16.0, tipW: 9.2 },
      { chain: [13, 14, 15, 16], baseW: 14.6, tipW: 8.4 },
      { chain: [17, 18, 19, 20], baseW: 12.8, tipW: 7.7 },
    ];

    for (const finger of fingerDefs) {
      const points = finger.chain
        .filter((idx) => idx < keypoints.length)
        .map((idx) => toPixel(keypoints[idx]));
      if (points.length >= 2) {
        this.drawFingerVolume(
          ctx,
          points,
          finger.baseW * visibilityBoost,
          finger.tipW * visibilityBoost,
          config.skinColor,
        );
      }
    }

    // Palm creases (few and subtle to avoid dotted artifacts).
    if (keypoints.length >= 18) {
      const p5 = toPixel(keypoints[5]);
      const p9 = toPixel(keypoints[9]);
      const p13 = toPixel(keypoints[13]);
      const p17 = toPixel(keypoints[17]);
      ctx.save();
      ctx.strokeStyle = 'rgba(124, 76, 63, 0.2)';
      ctx.lineWidth = 1.05;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p5.x - side * 2, p5.y + 5);
      ctx.quadraticCurveTo((p9.x + p13.x) / 2, (p9.y + p13.y) / 2 + 8, p17.x + side * 2, p17.y + 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p5.x - side * 1.5, p5.y + 10);
      ctx.quadraticCurveTo((p9.x + p13.x) / 2, (p9.y + p13.y) / 2 + 14, p17.x + side * 1.5, p17.y + 14);
      ctx.stroke();
      ctx.restore();
    }

    // Fingertip circles
    const tipIndices = [4, 8, 12, 16, 20];
    for (const idx of tipIndices) {
      if (idx < keypoints.length) {
        const p = toPixel(keypoints[idx]);
        const padGrad = ctx.createRadialGradient(p.x, p.y, 0.6, p.x, p.y, 4.6);
        padGrad.addColorStop(0, this.lightenColor(config.skinColor, 14));
        padGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = padGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6 * visibilityBoost, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Joint dots
    if (config.showKeypoints) {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
      for (const kp of keypoints) {
        const p = toPixel(kp);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fingernails + lunula
    for (const idx of tipIndices) {
      if (idx < keypoints.length && idx - 1 >= 0) {
        const tip = toPixel(keypoints[idx]);
        const prev = toPixel(keypoints[idx - 1]);
        const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);
        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(248, 232, 225, 0.72)';
        ctx.beginPath();
        ctx.ellipse(1.95 * visibilityBoost, 0, 2.7 * visibilityBoost, 1.85 * visibilityBoost, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 252, 248, 0.52)';
        ctx.beginPath();
        ctx.ellipse(1.0 * visibilityBoost, 0, 0.92 * visibilityBoost, 0.6 * visibilityBoost, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  private drawFingerVolume(
    ctx: CanvasRenderingContext2D,
    points: Vec2[],
    widthStart: number,
    widthEnd: number,
    skinColor: string,
  ): void {
    if (points.length < 2) return;

    const getNormal = (prev: Vec2, curr: Vec2, next: Vec2): Vec2 => {
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      return { x: -ty / len, y: tx / len };
    };

    const left: Vec2[] = [];
    const right: Vec2[] = [];

    for (let i = 0; i < points.length; i += 1) {
      const prev = points[Math.max(0, i - 1)];
      const curr = points[i];
      const next = points[Math.min(points.length - 1, i + 1)];
      const normal = getNormal(prev, curr, next);
      const t = i / Math.max(1, points.length - 1);
      const width = widthStart + (widthEnd - widthStart) * t;
      const half = width * 0.5;
      left.push({ x: curr.x + normal.x * half, y: curr.y + normal.y * half });
      right.push({ x: curr.x - normal.x * half, y: curr.y - normal.y * half });
    }

    const outline = [...left, ...right.reverse()];
    if (outline.length < 4) return;

    ctx.save();
    ctx.lineJoin = 'round';

    // Silhouette shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(outline[0].x + 0.8, outline[0].y + 1.1);
    for (let i = 1; i < outline.length; i += 1) {
      const p = outline[i];
      ctx.lineTo(p.x + 0.8, p.y + 1.1);
    }
    ctx.closePath();
    ctx.fill();

    // Main finger body
    const base = points[0];
    const tip = points[points.length - 1];
    const grad = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);
    grad.addColorStop(0, this.darkenColor(skinColor, 7));
    grad.addColorStop(0.45, skinColor);
    grad.addColorStop(1, this.lightenColor(skinColor, 8));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < outline.length; i += 1) {
      const p = outline[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();

    // Soft contour for depth
    ctx.strokeStyle = 'rgba(116, 70, 58, 0.18)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Center highlight (subtle)
    ctx.strokeStyle = 'rgba(255, 221, 203, 0.24)';
    ctx.lineWidth = Math.max(0.9, widthEnd * 0.18);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    for (let i = 1; i < points.length; i += 1) {
      const p = points[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    ctx.restore();
  }

  // -- Draw limb (arm segment) with rounded ends --
  private drawLimb(
    ctx: CanvasRenderingContext2D,
    from: Vec2, to: Vec2,
    widthStart: number, widthEnd: number,
    color: string,
    isSkin: boolean = false,
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();

    // Cast shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = ((widthStart + widthEnd) * 0.5) + 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x + 1.4, from.y + 2.3);
    ctx.lineTo(to.x + 1.8, to.y + 2.8);
    ctx.stroke();

    const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    grad.addColorStop(0, this.lightenColor(color, isSkin ? 8 : 3));
    grad.addColorStop(0.45, color);
    grad.addColorStop(1, this.darkenColor(color, isSkin ? 14 : 8));
    ctx.strokeStyle = grad;
    ctx.lineWidth = (widthStart + widthEnd) * 0.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Highlight strip
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    const highlightOffset = isSkin ? 1.1 : 0.9;
    ctx.strokeStyle = isSkin ? 'rgba(255, 214, 194, 0.34)' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = Math.max(1.2, (widthStart + widthEnd) * 0.16);
    ctx.beginPath();
    ctx.moveTo(from.x + nx * highlightOffset, from.y + ny * highlightOffset);
    ctx.lineTo(to.x + nx * highlightOffset, to.y + ny * highlightOffset);
    ctx.stroke();

    if (isSkin) {
      ctx.strokeStyle = 'rgba(255, 124, 94, 0.12)';
      ctx.lineWidth = Math.max(1, (widthStart + widthEnd) * 0.12);
      ctx.beginPath();
      ctx.moveTo(from.x - nx * 1.2, from.y - ny * 1.2);
      ctx.lineTo(to.x - nx * 1.2, to.y - ny * 1.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawThreePointLightingOverlay(): void {
    const { ctx, config } = this;
    const W = config.width;
    const H = config.height;

    ctx.save();

    // Key light (front-left, warm)
    const key = ctx.createRadialGradient(W * 0.3, H * 0.12, 8, W * 0.3, H * 0.12, W * 0.55);
    key.addColorStop(0, 'rgba(255, 242, 225, 0.2)');
    key.addColorStop(0.5, 'rgba(255, 242, 225, 0.09)');
    key.addColorStop(1, 'rgba(255, 242, 225, 0)');
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, W, H);

    // Fill light (front-right, cool)
    const fill = ctx.createRadialGradient(W * 0.78, H * 0.23, 6, W * 0.78, H * 0.23, W * 0.5);
    fill.addColorStop(0, 'rgba(175, 204, 255, 0.12)');
    fill.addColorStop(1, 'rgba(175, 204, 255, 0)');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, W, H);

    // Rim/back light
    const rim = ctx.createLinearGradient(W, 0, W * 0.55, 0);
    rim.addColorStop(0, 'rgba(193, 170, 255, 0.18)');
    rim.addColorStop(0.35, 'rgba(193, 170, 255, 0.06)');
    rim.addColorStop(1, 'rgba(193, 170, 255, 0)');
    ctx.fillStyle = rim;
    ctx.fillRect(W * 0.5, 0, W * 0.5, H);

    // Gentle vignette to avoid flat mannequin look
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.22, W * 0.5, H * 0.5, H * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  private createSkinTexturePattern(): CanvasPattern | null {
    if (typeof document === 'undefined') return null;

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 96;
    textureCanvas.height = 96;
    const tctx = textureCanvas.getContext('2d');
    if (!tctx) return null;

    tctx.clearRect(0, 0, 96, 96);

    // Tiny pores/noise points.
    for (let i = 0; i < 1100; i += 1) {
      const x = Math.random() * 96;
      const y = Math.random() * 96;
      const r = Math.random() * 0.75 + 0.14;
      const alpha = randomBetween(0.025, 0.07);
      const tone = Math.random() > 0.5 ? 32 : -24;
      const c = tone > 0 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 0.8})`;
      tctx.fillStyle = c;
      tctx.beginPath();
      tctx.arc(x, y, r, 0, Math.PI * 2);
      tctx.fill();
    }

    // Soft chroma patches for skin variation.
    for (let i = 0; i < 16; i += 1) {
      const x = Math.random() * 96;
      const y = Math.random() * 96;
      const size = randomBetween(6, 18);
      const grad = tctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, `rgba(255, 206, 190, ${randomBetween(0.04, 0.1)})`);
      grad.addColorStop(1, 'rgba(255, 206, 190, 0)');
      tctx.fillStyle = grad;
      tctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    return this.ctx.createPattern(textureCanvas, 'repeat');
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      }
      if (hex.length === 6) {
        const num = parseInt(hex, 16);
        return {
          r: (num >> 16) & 0xff,
          g: (num >> 8) & 0xff,
          b: num & 0xff,
        };
      }
    }

    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      return {
        r: clamp(parseInt(rgbMatch[1], 10), 0, 255),
        g: clamp(parseInt(rgbMatch[2], 10), 0, 255),
        b: clamp(parseInt(rgbMatch[3], 10), 0, 255),
      };
    }

    return null;
  }

  // -- Color helpers --
  private darkenColor(color: string, amount: number): string {
    const parsed = this.parseColor(color);
    if (!parsed) return color;
    const r = clamp(parsed.r - amount, 0, 255);
    const g = clamp(parsed.g - amount, 0, 255);
    const b = clamp(parsed.b - amount, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  private lightenColor(color: string, amount: number): string {
    const parsed = this.parseColor(color);
    if (!parsed) return color;
    const r = clamp(parsed.r + amount, 0, 255);
    const g = clamp(parsed.g + amount, 0, 255);
    const b = clamp(parsed.b + amount, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  /** Start the render loop */
  startLoop(): void {
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      this.render(delta);
      this._animationId = requestAnimationFrame(loop);
    };
    this._animationId = requestAnimationFrame(loop);
  }

  /** Stop the render loop */
  stopLoop(): void {
    if (this._animationId !== null) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  /** Check if animation to target is complete */
  get isAnimationComplete(): boolean {
    return this.animationProgress >= 1;
  }

  /** Dispose resources */
  dispose(): void {
    this.stopLoop();
  }
}
