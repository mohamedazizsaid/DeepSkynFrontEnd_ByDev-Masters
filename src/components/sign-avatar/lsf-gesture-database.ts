/**
 * Base de données de gestes LSF (Langue des Signes Française)
 * Chaque geste est défini comme une séquence de frames de keypoints
 * suivant la convention MediaPipe (21 keypoints par main)
 *
 * Les coordonnées sont normalisées entre 0 et 1
 * x: gauche→droite, y: haut→bas, z: profondeur
 */

import type { AvatarFrame, AvatarKeypoint } from './sign-avatar-renderer';

export interface LSFGesture {
  id: string;
  word: string;
  /** Mots FR/EN qui correspondent */
  aliases: string[];
  description: string;
  /** Frames d'animation ordonnées */
  frames: AvatarFrame[];
  /** Durée de chaque frame en ms */
  frameDuration: number;
  /** Expression faciale associée */
  facialExpression?: 'neutral' | 'smile' | 'sad' | 'surprise' | 'questioning';
}

// Helpers pour construire des mains prédéfinies
function makeHand(
  wristX: number, wristY: number,
  fingerConfig: {
    thumb: { angle: number; length: number; spread: number };
    index: { curl: number; spread: number };
    middle: { curl: number; spread: number };
    ring: { curl: number; spread: number };
    pinky: { curl: number; spread: number };
  },
  isRight: boolean,
): AvatarKeypoint[] {
  const sign = isRight ? 1 : -1;
  const kps: AvatarKeypoint[] = [];

  // Wrist (landmark 0)
  kps.push({ id: 'wrist', x: wristX, y: wristY, z: 0 });

  // Helper: finger from MCP
  const makeFinger = (
    mcpX: number, mcpY: number,
    curl: number, // 0 = fully extended, 1 = fully curled
    spread: number, // lateral spread
    segLen: number,
  ): AvatarKeypoint[] => {
    const ext = 1 - curl;
    const dirX = spread * sign * 0.5;
    const dirY = -ext; // negative = up when extended
    const curlY = curl * 0.3; // curl goes slightly down

    return [
      { id: 'mcp', x: mcpX, y: mcpY, z: 0 },
      { id: 'pip', x: mcpX + dirX * segLen, y: mcpY + dirY * segLen + curlY * segLen, z: 0 },
      { id: 'dip', x: mcpX + dirX * segLen * 1.8, y: mcpY + dirY * segLen * 1.8 + curlY * segLen * 1.5, z: 0 },
      { id: 'tip', x: mcpX + dirX * segLen * 2.5, y: mcpY + dirY * segLen * 2.5 + curlY * segLen * 2, z: 0 },
    ];
  };

  // Thumb (landmarks 1-4) - special handling
  const thumbAngle = fingerConfig.thumb.angle;
  const thumbLen = fingerConfig.thumb.length * 0.025;
  const thumbSpread = fingerConfig.thumb.spread;
  kps.push({ id: 'thumb_cmc', x: wristX + sign * 0.02, y: wristY - 0.01, z: 0 });
  kps.push({
    id: 'thumb_mcp',
    x: wristX + sign * (0.03 + thumbSpread * 0.02),
    y: wristY - 0.02 - thumbAngle * 0.02,
    z: 0,
  });
  kps.push({
    id: 'thumb_ip',
    x: wristX + sign * (0.04 + thumbSpread * 0.025),
    y: wristY - 0.035 - thumbAngle * 0.03,
    z: 0,
  });
  kps.push({
    id: 'thumb_tip',
    x: wristX + sign * (0.045 + thumbSpread * 0.03),
    y: wristY - 0.045 - thumbAngle * thumbLen,
    z: 0,
  });

  // Index (landmarks 5-8)
  const indexMcpX = wristX + sign * 0.012;
  const indexMcpY = wristY - 0.03;
  const indexFinger = makeFinger(
    indexMcpX, indexMcpY,
    fingerConfig.index.curl,
    fingerConfig.index.spread,
    0.025,
  );
  kps.push(...indexFinger);

  // Middle (landmarks 9-12)
  const middleMcpX = wristX + sign * 0.002;
  const middleMcpY = wristY - 0.035;
  const middleFinger = makeFinger(
    middleMcpX, middleMcpY,
    fingerConfig.middle.curl,
    fingerConfig.middle.spread,
    0.027,
  );
  kps.push(...middleFinger);

  // Ring (landmarks 13-16)
  const ringMcpX = wristX - sign * 0.008;
  const ringMcpY = wristY - 0.03;
  const ringFinger = makeFinger(
    ringMcpX, ringMcpY,
    fingerConfig.ring.curl,
    fingerConfig.ring.spread,
    0.024,
  );
  kps.push(...ringFinger);

  // Pinky (landmarks 17-20)
  const pinkyMcpX = wristX - sign * 0.018;
  const pinkyMcpY = wristY - 0.025;
  const pinkyFinger = makeFinger(
    pinkyMcpX, pinkyMcpY,
    fingerConfig.pinky.curl,
    fingerConfig.pinky.spread,
    0.02,
  );
  kps.push(...pinkyFinger);

  return kps;
}

function makePose(
  overrides: Partial<{
    noseY: number;
    lShoulderX: number; lShoulderY: number;
    rShoulderX: number; rShoulderY: number;
    lElbowX: number; lElbowY: number;
    rElbowX: number; rElbowY: number;
    lWristX: number; lWristY: number;
    rWristX: number; rWristY: number;
  }> = {},
): AvatarKeypoint[] {
  const def = {
    noseY: 0.15,
    lShoulderX: 0.38, lShoulderY: 0.30,
    rShoulderX: 0.62, rShoulderY: 0.30,
    lElbowX: 0.30, lElbowY: 0.48,
    rElbowX: 0.70, rElbowY: 0.48,
    lWristX: 0.32, lWristY: 0.62,
    rWristX: 0.68, rWristY: 0.62,
    ...overrides,
  };

  const pose: AvatarKeypoint[] = [];
  for (let i = 0; i < 25; i++) {
    pose.push({ id: `pose-${i}`, x: 0.5, y: 0.5, z: 0 });
  }

  pose[0]  = { id: 'nose',            x: 0.50, y: def.noseY, z: 0 };
  pose[11] = { id: 'left_shoulder',   x: def.lShoulderX, y: def.lShoulderY, z: 0 };
  pose[12] = { id: 'right_shoulder',  x: def.rShoulderX, y: def.rShoulderY, z: 0 };
  pose[13] = { id: 'left_elbow',      x: def.lElbowX, y: def.lElbowY, z: 0 };
  pose[14] = { id: 'right_elbow',     x: def.rElbowX, y: def.rElbowY, z: 0 };
  pose[15] = { id: 'left_wrist',      x: def.lWristX, y: def.lWristY, z: 0 };
  pose[16] = { id: 'right_wrist',     x: def.rWristX, y: def.rWristY, z: 0 };
  pose[23] = { id: 'left_hip',        x: 0.42, y: 0.72, z: 0 };
  pose[24] = { id: 'right_hip',       x: 0.58, y: 0.72, z: 0 };

  return pose;
}

// Configurations de doigts prédéfinies
const FINGERS_OPEN = {
  thumb:  { angle: 1, length: 1, spread: 0.8 },
  index:  { curl: 0, spread: 0.3 },
  middle: { curl: 0, spread: 0 },
  ring:   { curl: 0, spread: -0.2 },
  pinky:  { curl: 0, spread: -0.4 },
};

const FINGERS_FIST = {
  thumb:  { angle: 0.2, length: 0.5, spread: 0.2 },
  index:  { curl: 1, spread: 0 },
  middle: { curl: 1, spread: 0 },
  ring:   { curl: 1, spread: 0 },
  pinky:  { curl: 1, spread: 0 },
};

const FINGERS_POINT = {
  thumb:  { angle: 0.3, length: 0.6, spread: 0.3 },
  index:  { curl: 0, spread: 0.1 },
  middle: { curl: 1, spread: 0 },
  ring:   { curl: 1, spread: 0 },
  pinky:  { curl: 1, spread: 0 },
};

const FINGERS_ILY = { // "I Love You" sign
  thumb:  { angle: 1, length: 1, spread: 1 },
  index:  { curl: 0, spread: 0.5 },
  middle: { curl: 1, spread: 0 },
  ring:   { curl: 1, spread: 0 },
  pinky:  { curl: 0, spread: -0.5 },
};

const FINGERS_PEACE = {
  thumb:  { angle: 0.3, length: 0.5, spread: 0.2 },
  index:  { curl: 0, spread: 0.4 },
  middle: { curl: 0, spread: -0.1 },
  ring:   { curl: 1, spread: 0 },
  pinky:  { curl: 1, spread: 0 },
};

const FINGERS_THUMBSUP = {
  thumb:  { angle: 1.2, length: 1.2, spread: 0.5 },
  index:  { curl: 1, spread: 0 },
  middle: { curl: 1, spread: 0 },
  ring:   { curl: 1, spread: 0 },
  pinky:  { curl: 1, spread: 0 },
};

const FINGERS_FLAT = {
  thumb:  { angle: 0.5, length: 0.8, spread: 0.3 },
  index:  { curl: 0, spread: 0.1 },
  middle: { curl: 0, spread: 0 },
  ring:   { curl: 0, spread: -0.1 },
  pinky:  { curl: 0, spread: -0.2 },
};

const FINGERS_C_SHAPE = {
  thumb:  { angle: 0.6, length: 0.9, spread: 0.8 },
  index:  { curl: 0.4, spread: 0.3 },
  middle: { curl: 0.5, spread: 0.1 },
  ring:   { curl: 0.6, spread: -0.1 },
  pinky:  { curl: 0.7, spread: -0.3 },
};

// ──────────────────────────────────────────────
// Base de données de gestes LSF
// ──────────────────────────────────────────────

export const LSF_GESTURE_DATABASE: LSFGesture[] = [
  // ── BONJOUR ──
  {
    id: 'bonjour',
    word: 'bonjour',
    aliases: ['bonjour', 'hello', 'hi', 'salut', 'hey', 'coucou'],
    description: 'Main plate part du menton vers l\'avant',
    frameDuration: 200,
    facialExpression: 'smile',
    frames: [
      // Frame 1: Main au menton
      {
        hand_right_keypoints: makeHand(0.55, 0.22, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.30,
          rWristX: 0.55, rWristY: 0.22,
        }),
      },
      // Frame 2: Main s'éloigne du menton vers l'avant
      {
        hand_right_keypoints: makeHand(0.62, 0.28, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.32,
          rWristX: 0.62, rWristY: 0.28,
        }),
      },
      // Frame 3: Main avancée
      {
        hand_right_keypoints: makeHand(0.70, 0.32, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.68, rElbowY: 0.36,
          rWristX: 0.70, rWristY: 0.32,
        }),
      },
    ],
  },

  // ── MERCI ──
  {
    id: 'merci',
    word: 'merci',
    aliases: ['merci', 'thank', 'thanks', 'thankyou', 'remercie'],
    description: 'Main plate du menton vers l\'avant et vers le bas',
    frameDuration: 220,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.55, 0.20, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.28,
          rWristX: 0.55, rWristY: 0.20,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.60, 0.30, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.63, rElbowY: 0.34,
          rWristX: 0.60, rWristY: 0.30,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.65, 0.40, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.40,
          rWristX: 0.65, rWristY: 0.40,
        }),
      },
    ],
  },

  // ── OUI ──
  {
    id: 'oui',
    word: 'oui',
    aliases: ['oui', 'yes', 'ouais', 'ok', 'accord', "d'accord"],
    description: 'Poing fermé qui fait un mouvement de hochement',
    frameDuration: 180,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.35, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.38,
          rWristX: 0.60, rWristY: 0.35,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.60, 0.40, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.42,
          rWristX: 0.60, rWristY: 0.40,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.60, 0.33, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.36,
          rWristX: 0.60, rWristY: 0.33,
        }),
      },
    ],
  },

  // ── NON ──
  {
    id: 'non',
    word: 'non',
    aliases: ['non', 'no', 'nope', 'pas', 'ne'],
    description: 'Index tendu avec rotation latérale',
    frameDuration: 150,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.32, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.36,
          rWristX: 0.60, rWristY: 0.32,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.65, 0.32, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.67, rElbowY: 0.36,
          rWristX: 0.65, rWristY: 0.32,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.55, 0.32, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.36,
          rWristX: 0.55, rWristY: 0.32,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.63, 0.32, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.36,
          rWristX: 0.63, rWristY: 0.32,
        }),
      },
    ],
  },

  // ── AIMER / AMOUR ──
  {
    id: 'aimer',
    word: 'aimer',
    aliases: ['aimer', 'amour', 'love', 'adore', 'coeur', 'heart', 'j\'aime', 'je t\'aime'],
    description: 'Signe ILY (I Love You) - main ouverte avec pouce, index et auriculaire étendus',
    frameDuration: 300,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.40, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.40,
          rWristX: 0.60, rWristY: 0.40,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.62, 0.32, FINGERS_ILY, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.36,
          rWristX: 0.62, rWristY: 0.32,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.64, 0.28, FINGERS_ILY, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.68, rElbowY: 0.32,
          rWristX: 0.64, rWristY: 0.28,
        }),
      },
    ],
  },

  // ── S'IL VOUS PLAÎT ──
  {
    id: 'sil-vous-plait',
    word: 'svp',
    aliases: ['svp', 's\'il vous plaît', 'please', 'stp', 's\'il te plaît', 'plaît'],
    description: 'Main plate qui tourne sur le poitrine',
    frameDuration: 200,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.52, 0.38, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.38,
          rWristX: 0.52, rWristY: 0.38,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.50, 0.40, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.58, rElbowY: 0.40,
          rWristX: 0.50, rWristY: 0.40,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.54, 0.36, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.38,
          rWristX: 0.54, rWristY: 0.36,
        }),
      },
    ],
  },

  // ── PARDON / DÉSOLÉ ──
  {
    id: 'pardon',
    word: 'pardon',
    aliases: ['pardon', 'désolé', 'sorry', 'excuse', 'excusez'],
    description: 'Poing fermé qui tourne sur la poitrine',
    frameDuration: 220,
    facialExpression: 'sad',
    frames: [
      {
        hand_right_keypoints: makeHand(0.52, 0.38, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.58, rElbowY: 0.38,
          rWristX: 0.52, rWristY: 0.38,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.50, 0.42, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.56, rElbowY: 0.42,
          rWristX: 0.50, rWristY: 0.42,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.54, 0.36, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.38,
          rWristX: 0.54, rWristY: 0.36,
        }),
      },
    ],
  },

  // ── AIDE ──
  {
    id: 'aide',
    word: 'aide',
    aliases: ['aide', 'help', 'aider', 'aidez'],
    description: 'Pouce levé sur paume plate de l\'autre main',
    frameDuration: 250,
    facialExpression: 'questioning',
    frames: [
      {
        hand_right_keypoints: makeHand(0.52, 0.42, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.45, 0.45, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.42,
          rWristX: 0.52, rWristY: 0.42,
          lElbowX: 0.38, lElbowY: 0.42,
          lWristX: 0.45, lWristY: 0.45,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.52, 0.38, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.45, 0.45, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.40,
          rWristX: 0.52, rWristY: 0.38,
          lElbowX: 0.38, lElbowY: 0.42,
          lWristX: 0.45, lWristY: 0.45,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.52, 0.44, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.45, 0.45, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.44,
          rWristX: 0.52, rWristY: 0.44,
          lElbowX: 0.38, lElbowY: 0.42,
          lWristX: 0.45, lWristY: 0.45,
        }),
      },
    ],
  },

  // ── MANGER ──
  {
    id: 'manger',
    word: 'manger',
    aliases: ['manger', 'eat', 'nourriture', 'food', 'faim', 'hungry', 'repas'],
    description: 'Main en C vers la bouche',
    frameDuration: 200,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.58, 0.30, FINGERS_C_SHAPE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.36,
          rWristX: 0.58, rWristY: 0.30,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.55, 0.22, FINGERS_C_SHAPE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.30,
          rWristX: 0.55, rWristY: 0.22,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.58, 0.30, FINGERS_C_SHAPE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.36,
          rWristX: 0.58, rWristY: 0.30,
        }),
      },
    ],
  },

  // ── BOIRE ──
  {
    id: 'boire',
    word: 'boire',
    aliases: ['boire', 'drink', 'eau', 'water', 'soif', 'thirsty'],
    description: 'Main en C vers la bouche comme un verre',
    frameDuration: 220,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.35, FINGERS_C_SHAPE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.38,
          rWristX: 0.60, rWristY: 0.35,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.56, 0.24, FINGERS_C_SHAPE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.30,
          rWristX: 0.56, rWristY: 0.24,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.56, 0.20, FINGERS_C_SHAPE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.26,
          rWristX: 0.56, rWristY: 0.20,
        }),
      },
    ],
  },

  // ── BIEN ──
  {
    id: 'bien',
    word: 'bien',
    aliases: ['bien', 'good', 'bon', 'super', 'great', 'cool', 'nice', 'génial', 'excellent'],
    description: 'Pouce levé',
    frameDuration: 250,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.40, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.42,
          rWristX: 0.60, rWristY: 0.40,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.62, 0.34, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.38,
          rWristX: 0.62, rWristY: 0.34,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.64, 0.30, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.68, rElbowY: 0.34,
          rWristX: 0.64, rWristY: 0.30,
        }),
      },
    ],
  },

  // ── MAL / MAUVAIS ──
  {
    id: 'mal',
    word: 'mal',
    aliases: ['mal', 'bad', 'mauvais', 'pas bien', 'nul'],
    description: 'Pouce baissé',
    frameDuration: 250,
    facialExpression: 'sad',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.35, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.38,
          rWristX: 0.60, rWristY: 0.35,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.60, 0.42, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.42,
          rWristX: 0.60, rWristY: 0.42,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.60, 0.50, FINGERS_THUMBSUP, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.48,
          rWristX: 0.60, rWristY: 0.50,
        }),
      },
    ],
  },

  // ── COMPRENDRE ──
  {
    id: 'comprendre',
    word: 'comprendre',
    aliases: ['comprendre', 'understand', 'compris', 'comprends', 'understand'],
    description: 'Index sur la tempe puis mouvement vers l\'avant',
    frameDuration: 200,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.18, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.68, rElbowY: 0.28,
          rWristX: 0.60, rWristY: 0.18,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.65, 0.22, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.70, rElbowY: 0.30,
          rWristX: 0.65, rWristY: 0.22,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.72, 0.28, FINGERS_OPEN, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.73, rElbowY: 0.34,
          rWristX: 0.72, rWristY: 0.28,
        }),
      },
    ],
  },

  // ── MOI / JE ──
  {
    id: 'moi',
    word: 'moi',
    aliases: ['moi', 'je', 'me', 'i', 'j\''],
    description: 'Index pointé vers soi',
    frameDuration: 300,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.55, 0.38, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.40,
          rWristX: 0.55, rWristY: 0.38,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.52, 0.36, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.58, rElbowY: 0.38,
          rWristX: 0.52, rWristY: 0.36,
        }),
      },
    ],
  },

  // ── TOI / TU ──
  {
    id: 'toi',
    word: 'toi',
    aliases: ['toi', 'tu', 'you', 'te', 'vous'],
    description: 'Index pointé vers l\'avant (interlocuteur)',
    frameDuration: 300,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.62, 0.35, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.40,
          rWristX: 0.62, rWristY: 0.35,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.68, 0.32, FINGERS_POINT, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.70, rElbowY: 0.38,
          rWristX: 0.68, rWristY: 0.32,
        }),
      },
    ],
  },

  // ── TRAVAILLER ──
  {
    id: 'travailler',
    word: 'travailler',
    aliases: ['travailler', 'work', 'travail', 'job', 'boulot'],
    description: 'Deux poings qui tapent alternativement',
    frameDuration: 180,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.58, 0.40, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.42, 0.44, FINGERS_FIST, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.42,
          rWristX: 0.58, rWristY: 0.40,
          lElbowX: 0.36, lElbowY: 0.42,
          lWristX: 0.42, lWristY: 0.44,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.58, 0.44, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.42, 0.40, FINGERS_FIST, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.44,
          rWristX: 0.58, rWristY: 0.44,
          lElbowX: 0.36, lElbowY: 0.40,
          lWristX: 0.42, lWristY: 0.40,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.58, 0.40, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.42, 0.44, FINGERS_FIST, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.42,
          rWristX: 0.58, rWristY: 0.40,
          lElbowX: 0.36, lElbowY: 0.42,
          lWristX: 0.42, lWristY: 0.44,
        }),
      },
    ],
  },

  // ── PAIX / PEACE ──
  {
    id: 'paix',
    word: 'paix',
    aliases: ['paix', 'peace', 'victoire', 'victory'],
    description: 'Signe V (peace)',
    frameDuration: 300,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.60, 0.38, FINGERS_FIST, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.40,
          rWristX: 0.60, rWristY: 0.38,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.62, 0.30, FINGERS_PEACE, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.68, rElbowY: 0.35,
          rWristX: 0.62, rWristY: 0.30,
        }),
      },
    ],
  },

  // ── MAISON ──
  {
    id: 'maison',
    word: 'maison',
    aliases: ['maison', 'house', 'home', 'chez'],
    description: 'Deux mains formant un toit triangulaire',
    frameDuration: 250,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.55, 0.35, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.45, 0.35, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.40,
          rWristX: 0.55, rWristY: 0.35,
          lElbowX: 0.38, lElbowY: 0.40,
          lWristX: 0.45, lWristY: 0.35,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.54, 0.24, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.46, 0.24, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.32,
          rWristX: 0.54, rWristY: 0.24,
          lElbowX: 0.40, lElbowY: 0.32,
          lWristX: 0.46, lWristY: 0.24,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.58, 0.35, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.42, 0.35, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.40,
          rWristX: 0.58, rWristY: 0.35,
          lElbowX: 0.36, lElbowY: 0.40,
          lWristX: 0.42, lWristY: 0.35,
        }),
      },
    ],
  },

  // ── ÉCOLE ──
  {
    id: 'ecole',
    word: 'école',
    aliases: ['école', 'school', 'ecole', 'étude', 'étudier', 'study'],
    description: 'Main plate tapant sur la paume',
    frameDuration: 200,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(0.55, 0.38, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.48, 0.42, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.40,
          rWristX: 0.55, rWristY: 0.38,
          lElbowX: 0.38, lElbowY: 0.42,
          lWristX: 0.48, lWristY: 0.42,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.53, 0.42, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.48, 0.42, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.60, rElbowY: 0.42,
          rWristX: 0.53, rWristY: 0.42,
          lElbowX: 0.38, lElbowY: 0.42,
          lWristX: 0.48, lWristY: 0.42,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.55, 0.38, FINGERS_FLAT, true),
        hand_left_keypoints: makeHand(0.48, 0.42, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.62, rElbowY: 0.40,
          rWristX: 0.55, rWristY: 0.38,
          lElbowX: 0.38, lElbowY: 0.42,
          lWristX: 0.48, lWristY: 0.42,
        }),
      },
    ],
  },

  // ── FAMILLE ──
  {
    id: 'famille',
    word: 'famille',
    aliases: ['famille', 'family'],
    description: 'Deux mains en cercle devant le corps',
    frameDuration: 250,
    facialExpression: 'smile',
    frames: [
      {
        hand_right_keypoints: makeHand(0.56, 0.38, FINGERS_OPEN, true),
        hand_left_keypoints: makeHand(0.44, 0.38, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.64, rElbowY: 0.40,
          rWristX: 0.56, rWristY: 0.38,
          lElbowX: 0.36, lElbowY: 0.40,
          lWristX: 0.44, lWristY: 0.38,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.60, 0.36, FINGERS_OPEN, true),
        hand_left_keypoints: makeHand(0.40, 0.36, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.38,
          rWristX: 0.60, rWristY: 0.36,
          lElbowX: 0.34, lElbowY: 0.38,
          lWristX: 0.40, lWristY: 0.36,
        }),
      },
      {
        hand_right_keypoints: makeHand(0.58, 0.34, FINGERS_OPEN, true),
        hand_left_keypoints: makeHand(0.42, 0.34, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.65, rElbowY: 0.36,
          rWristX: 0.58, rWristY: 0.34,
          lElbowX: 0.35, lElbowY: 0.36,
          lWristX: 0.42, lWristY: 0.34,
        }),
      },
    ],
  },
];

// ── Lookup / search ──

const aliasMap = new Map<string, LSFGesture>();
for (const gesture of LSF_GESTURE_DATABASE) {
  for (const alias of gesture.aliases) {
    aliasMap.set(alias.toLowerCase(), gesture);
  }
}

/**
 * Cherche un geste LSF par mot. Supporte la recherche approximative.
 */
export function findGesture(word: string): LSFGesture | null {
  const normalized = word.toLowerCase().trim();
  // Exact match
  if (aliasMap.has(normalized)) return aliasMap.get(normalized)!;
  // Partial match
  for (const [key, gesture] of aliasMap.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return gesture;
    }
  }
  return null;
}

/**
 * Traduit un texte en une séquence de gestes LSF
 * Préserve l'ordre des mots.
 * Les mots inconnus sont épelés lettre par lettre (dactylologie),
 * au lieu d'afficher un geste générique non pertinent.
 */
export function translateTextToGestures(text: string): LSFGesture[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, '')
    .split(/[\s]+/)
    .filter(Boolean);

  const result: LSFGesture[] = [];
  const MAX_WORDS = 20;
  const MAX_LETTERS_PER_WORD = 10;

  for (const word of words.slice(0, MAX_WORDS)) {
    const gesture = findGesture(word);
    if (gesture) {
      result.push(gesture);
      continue;
    }

    const letters = Array.from(word)
      .filter((ch) => /\p{L}|\p{N}/u.test(ch))
      .slice(0, MAX_LETTERS_PER_WORD);

    for (const letter of letters) {
      result.push(createSpellGesture(letter));
    }
  }

  // Dernier recours pour éviter un écran vide si texte non vide
  if (result.length === 0 && text.trim()) {
    const fallback = findGesture('pardon') || findGesture('bonjour');
    if (fallback) {
      result.push(fallback);
    }
  }

  return result;
}

/**
 * Génère un "geste par défaut" pour un mot inconnu
 * Basé sur la lettre initiale avec une configuration de main correspondante
 */
export function createSpellGesture(letter: string): LSFGesture {
  const normalizedLetter = letter
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const baseLetter = normalizedLetter[0] || 'a';
  const code = baseLetter.charCodeAt(0);

  const fingerConfigs = [
    FINGERS_POINT,
    FINGERS_OPEN,
    FINGERS_PEACE,
    FINGERS_FLAT,
    FINGERS_C_SHAPE,
    FINGERS_THUMBSUP,
    FINGERS_ILY,
    FINGERS_FIST,
  ] as const;
  const selectedConfig = fingerConfigs[code % fingerConfigs.length];

  const wristX = 0.62 + ((code % 5) - 2) * 0.012;
  const wristY = 0.35 + ((Math.floor(code / 5) % 5) - 2) * 0.008;
  const wristX2 = wristX + 0.015;
  const wristY2 = wristY - 0.012;

  return {
    id: `letter-${baseLetter}`,
    word: baseLetter,
    aliases: [baseLetter],
    description: `Epellation dactylologique: ${baseLetter.toUpperCase()}`,
    frameDuration: 180,
    facialExpression: 'neutral',
    frames: [
      {
        hand_right_keypoints: makeHand(wristX, wristY, selectedConfig, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.38,
          rWristX: wristX, rWristY: wristY,
        }),
      },
      {
        hand_right_keypoints: makeHand(wristX2, wristY2, selectedConfig, true),
        hand_left_keypoints: makeHand(0.33, 0.61, FINGERS_FLAT, false),
        pose_keypoints: makePose({
          rElbowX: 0.67, rElbowY: 0.36,
          rWristX: wristX2, rWristY: wristY2,
          lElbowX: 0.31, lElbowY: 0.48,
          lWristX: 0.33, lWristY: 0.61,
        }),
      },
      {
        hand_right_keypoints: makeHand(wristX, wristY, selectedConfig, true),
        hand_left_keypoints: makeHand(0.32, 0.62, FINGERS_OPEN, false),
        pose_keypoints: makePose({
          rElbowX: 0.66, rElbowY: 0.38,
          rWristX: wristX, rWristY: wristY,
        }),
      },
    ],
  };
}

export { makeHand, makePose, FINGERS_OPEN, FINGERS_FIST, FINGERS_POINT, FINGERS_FLAT, FINGERS_ILY, FINGERS_PEACE, FINGERS_THUMBSUP, FINGERS_C_SHAPE };
