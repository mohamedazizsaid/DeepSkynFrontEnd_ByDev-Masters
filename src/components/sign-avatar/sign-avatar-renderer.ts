/**
 * Professional Sign Language Avatar Renderer
 * Renders a realistic human avatar with articulated hands, arms, torso and head
 * Uses Canvas2D for maximum compatibility and performance
 */

// ── MediaPipe Hand Landmark indices (21 keypoints per hand) ──
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

// ── Default rest pose for the avatar (normalized 0-1 coordinates) ──
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

// ── Interpolation helper ──
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

// ── Easing functions ──
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Drawing helpers ──
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
  private breathPhase = 0;

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
  }

  /** Set target frame to animate towards */
  setTargetFrame(frame: AvatarFrame): void {
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
    this.animationProgress = 0;
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

    // Update animation progress
    if (this.animationProgress < 1) {
      // Keep interpolation short so high-FPS gesture streams don't look frozen.
      this.animationProgress = Math.min(1, this.animationProgress + deltaTime / 80);
      const t = easeInOutCubic(this.animationProgress);
      this.currentFrame = lerpFrame(this.currentFrame, this.targetFrame, t);
    }

    // Breathing animation
    this.breathPhase += deltaTime * 0.002;
    const breathOffset = Math.sin(this.breathPhase) * 0.003;

    // ── Clear & draw background ──
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, config.bgGradient[0]);
    bgGrad.addColorStop(0.5, config.bgGradient[1]);
    bgGrad.addColorStop(1, config.bgGradient[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid pattern overlay
    ctx.save();
    ctx.globalAlpha = 0.03;
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
    const glowGrad = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H * 0.4, W * 0.45);
    glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
    glowGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // Get the current pose frame with breathing applied
    const frame = this.currentFrame;
    const pose = frame.pose_keypoints;

    // Apply breathing offset to shoulders
    if (pose.length > 12) {
      pose[11] = { ...pose[11], y: pose[11].y + breathOffset };
      pose[12] = { ...pose[12], y: pose[12].y + breathOffset };
    }

    if (config.style === 'cartoon') {
      this.drawCartoonAvatar(frame);
    } else if (config.style === 'skeleton') {
      this.drawSkeletonAvatar(frame);
    } else {
      this.drawSilhouetteAvatar(frame);
    }

    // Platform/floor
    ctx.save();
    const floorGrad = ctx.createLinearGradient(W * 0.15, H * 0.88, W * 0.85, H * 0.92);
    floorGrad.addColorStop(0, 'rgba(99,102,241,0)');
    floorGrad.addColorStop(0.3, 'rgba(99,102,241,0.3)');
    floorGrad.addColorStop(0.7, 'rgba(139,92,246,0.3)');
    floorGrad.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(W * 0.15, H * 0.88, W * 0.7, 3);
    ctx.restore();
  }

  // ── Cartoon style avatar ──
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

    const neckX = (lShoulder.x + rShoulder.x) / 2;
    const neckY = (lShoulder.y + rShoulder.y) / 2 - H * 0.02;

    // ── Torso ──
    ctx.save();
    const torsoGrad = ctx.createLinearGradient(lShoulder.x, neckY, rShoulder.x, lHip.y);
    torsoGrad.addColorStop(0, config.clothColor);
    torsoGrad.addColorStop(1, this.darkenColor(config.clothColor, 30));
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.moveTo(lShoulder.x - 8, lShoulder.y);
    ctx.quadraticCurveTo(neckX, neckY - 5, rShoulder.x + 8, rShoulder.y);
    ctx.lineTo(rHip.x + 5, rHip.y);
    ctx.quadraticCurveTo((lHip.x + rHip.x) / 2, rHip.y + 15, lHip.x - 5, lHip.y);
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
    const lowerGrad = ctx.createLinearGradient(lHip.x, lHip.y, rHip.x, H * 0.9);
    lowerGrad.addColorStop(0, this.darkenColor(config.clothColor, 10));
    lowerGrad.addColorStop(1, this.darkenColor(config.clothColor, 60));
    ctx.fillStyle = lowerGrad;
    ctx.fillRect(lHip.x - 10, lHip.y, rHip.x - lHip.x + 20, H * 0.88 - lHip.y);
    ctx.restore();

    // ── Arms ──
    this.drawLimb(ctx, lShoulder, lElbow, 18, 14, config.clothColor);
    this.drawLimb(ctx, lElbow, lWrist, 14, 10, config.skinColor);
    this.drawLimb(ctx, rShoulder, rElbow, 18, 14, config.clothColor);
    this.drawLimb(ctx, rElbow, rWrist, 14, 10, config.skinColor);

    // ── Neck ──
    ctx.save();
    ctx.fillStyle = config.skinColor;
    ctx.beginPath();
    ctx.moveTo(neckX - 12, neckY);
    ctx.lineTo(neckX + 12, neckY);
    ctx.lineTo(neckX + 10, nose.y + 35);
    ctx.lineTo(neckX - 10, nose.y + 35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Head ──
    this.drawHead(ctx, nose, neckX, neckY, W, H);

    // ── Hands ──
    this.drawHand(ctx, frame.hand_right_keypoints, W, H, true);
    this.drawHand(ctx, frame.hand_left_keypoints, W, H, false);
  }

  // ── Skeleton style ──
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

  // ── Silhouette style ── 
  private drawSilhouetteAvatar(frame: AvatarFrame): void {
    // Use skeleton as base but with thicker lines and glow
    const { ctx, config } = this;
    ctx.save();
    ctx.shadowColor = '#6366F1';
    ctx.shadowBlur = 20;
    this.drawSkeletonAvatar(frame);
    ctx.restore();
  }

  // ── Draw head ──
  private drawHead(
    ctx: CanvasRenderingContext2D,
    nose: Vec2,
    neckX: number,
    _neckY: number,
    _W: number,
    _H: number,
  ): void {
    const config = this.config;
    const headCenterX = neckX;
    const headCenterY = nose.y;
    const headRadiusX = 38;
    const headRadiusY = 45;

    // Head shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(headCenterX + 2, headCenterY + 3, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.save();
    const headGrad = ctx.createRadialGradient(
      headCenterX - 10, headCenterY - 10, 5,
      headCenterX, headCenterY, headRadiusX + 5,
    );
    headGrad.addColorStop(0, this.lightenColor(config.skinColor, 15));
    headGrad.addColorStop(1, config.skinColor);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hair
    ctx.save();
    ctx.fillStyle = config.hairColor;
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
    const eyeSpacing = 15;
    const eyeY = headCenterY - 4;

    // Eye whites
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(headCenterX - eyeSpacing, eyeY, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCenterX + eyeSpacing, eyeY, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#3B2F2F';
    ctx.beginPath();
    ctx.arc(headCenterX - eyeSpacing, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCenterX + eyeSpacing, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pupil highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(headCenterX - eyeSpacing - 1, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCenterX + eyeSpacing - 1, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyebrows
    ctx.save();
    ctx.strokeStyle = config.hairColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headCenterX - eyeSpacing - 8, eyeY - 11);
    ctx.quadraticCurveTo(headCenterX - eyeSpacing, eyeY - 14, headCenterX - eyeSpacing + 8, eyeY - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headCenterX + eyeSpacing - 8, eyeY - 10);
    ctx.quadraticCurveTo(headCenterX + eyeSpacing, eyeY - 14, headCenterX + eyeSpacing + 8, eyeY - 11);
    ctx.stroke();
    ctx.restore();

    // Nose (subtle)
    ctx.save();
    ctx.strokeStyle = this.darkenColor(config.skinColor, 25);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headCenterX, eyeY + 4);
    ctx.quadraticCurveTo(headCenterX + 4, eyeY + 14, headCenterX, eyeY + 16);
    ctx.stroke();
    ctx.restore();

    // Mouth (gentle smile)
    ctx.save();
    ctx.strokeStyle = '#C4636C';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headCenterX - 10, headCenterY + 18);
    ctx.quadraticCurveTo(headCenterX, headCenterY + 24, headCenterX + 10, headCenterY + 18);
    ctx.stroke();
    ctx.restore();

    // Ears
    ctx.save();
    ctx.fillStyle = config.skinColor;
    ctx.beginPath();
    ctx.ellipse(headCenterX - headRadiusX - 1, headCenterY, 6, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCenterX + headRadiusX + 1, headCenterY, 6, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Draw detailed hand ──
  private drawHand(
    ctx: CanvasRenderingContext2D,
    keypoints: AvatarKeypoint[],
    W: number, H: number,
    isRight: boolean,
  ): void {
    if (keypoints.length < 5) return;

    const config = this.config;
    const handScale = 1.28;
    const directionSign = isRight ? -1 : 1;
    const wristKp = keypoints[0] ?? { x: 0.5, y: 0.5, z: 0, id: 'wrist' };
    const toPixel = (kp: AvatarKeypoint): Vec2 => ({
      x: (wristKp.x + (kp.x - wristKp.x) * handScale * directionSign) * W,
      y: (wristKp.y + (kp.y - wristKp.y) * handScale) * H,
    });

    const wrist = toPixel(keypoints[0]);

    // Palm - draw a filled shape connecting wrist and MCP joints
    ctx.save();
    const palmGrad = ctx.createRadialGradient(
      wrist.x, wrist.y, 2,
      wrist.x, wrist.y, 40,
    );
    palmGrad.addColorStop(0, this.lightenColor(config.skinColor, 10));
    palmGrad.addColorStop(1, config.skinColor);
    ctx.fillStyle = palmGrad;

    if (keypoints.length >= 21) {
      const mcp5 = toPixel(keypoints[5]);
      const mcp9 = toPixel(keypoints[9]);
      const mcp13 = toPixel(keypoints[13]);
      const mcp17 = toPixel(keypoints[17]);

      ctx.beginPath();
      ctx.moveTo(wrist.x - (isRight ? 3 : -3), wrist.y);
      ctx.lineTo(mcp17.x, mcp17.y);
      ctx.lineTo(mcp13.x, mcp13.y);
      ctx.lineTo(mcp9.x, mcp9.y);
      ctx.lineTo(mcp5.x, mcp5.y);
      ctx.lineTo(wrist.x + (isRight ? 3 : -3), wrist.y);
      ctx.closePath();
      ctx.fill();
    }

    // Draw finger segments
    ctx.strokeStyle = config.skinColor;
    ctx.lineCap = 'round';

    const fingerChains = [
      [0, 1, 2, 3, 4],       // thumb
      [0, 5, 6, 7, 8],       // index
      [0, 9, 10, 11, 12],    // middle
      [0, 13, 14, 15, 16],   // ring
      [0, 17, 18, 19, 20],   // pinky
    ];

    for (const chain of fingerChains) {
      for (let i = 0; i < chain.length - 1; i++) {
        if (chain[i] >= keypoints.length || chain[i + 1] >= keypoints.length) break;
        const a = toPixel(keypoints[chain[i]]);
        const b = toPixel(keypoints[chain[i + 1]]);

        // Thicker at base, thinner at tip
        const baseWidth = i === 0 ? 8 : 6 - i;
        ctx.lineWidth = Math.max(2, baseWidth);

        // Gradient along finger
        const segGrad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        segGrad.addColorStop(0, config.skinColor);
        segGrad.addColorStop(1, this.lightenColor(config.skinColor, 5));
        ctx.strokeStyle = segGrad;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Fingertip circles
    ctx.fillStyle = this.lightenColor(config.skinColor, 10);
    const tipIndices = [4, 8, 12, 16, 20];
    for (const idx of tipIndices) {
      if (idx < keypoints.length) {
        const p = toPixel(keypoints[idx]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
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

    // Fingernails
    ctx.fillStyle = this.lightenColor(config.skinColor, 25);
    for (const idx of tipIndices) {
      if (idx < keypoints.length && idx - 1 >= 0) {
        const tip = toPixel(keypoints[idx]);
        const prev = toPixel(keypoints[idx - 1]);
        const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);
        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(2, 0, 2.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ── Draw limb (arm segment) with rounded ends ──
  private drawLimb(
    ctx: CanvasRenderingContext2D,
    from: Vec2, to: Vec2,
    widthStart: number, widthEnd: number,
    color: string,
  ): void {
    ctx.save();
    const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, this.darkenColor(color, 10));
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';

    // Draw multiple passes for smooth tapered effect
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      const w = widthStart + (widthEnd - widthStart) * t;

      ctx.lineWidth = w;
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevT = (i - 1) / steps;
        const px = from.x + (to.x - from.x) * prevT;
        const py = from.y + (to.y - from.y) * prevT;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── Color helpers ──
  private darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r},${g},${b})`;
  }

  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    const b = Math.min(255, (num & 0xFF) + amount);
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
