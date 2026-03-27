import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types (correspondant au retour de l'API) ────────────────────────────
interface Keypoint {
  id: string;
  x: number; // normalisé 0..1
  y: number; // normalisé 0..1
  z: number;
}

interface Frame {
  frame_index?: number;
  frame_id?: number;
  timestamp_ms?: number;
  timestamp?: number;
  hand_right_keypoints: Keypoint[];
  hand_left_keypoints: Keypoint[] | null;
  pose_keypoints: Keypoint[];
}

interface SignResponse {
  frames: Frame[];
  metadata: {
    gloss: string;
    sign_language?: string;
    fps: number;
    total_frames: number;
  };
}

export interface HandAnimationData {
  hand_right_keypoints: Keypoint[];
  hand_left_keypoints: Keypoint[] | null;
  pose_keypoints: Keypoint[];
}

interface AnimatedHandProps {
  postId?: string;
  frames?: Frame[];
  metadata?: SignResponse['metadata'];
  apiBaseUrl?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  onComplete?: () => void;
}

// ─── Connexions squelette main (MediaPipe 21 points) ──────────────────────
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],  [1, 2],  [2, 3],  [3, 4],   // pouce
  [0, 5],  [5, 6],  [6, 7],  [7, 8],   // index
  [0, 9],  [9, 10], [10, 11],[11, 12],  // majeur
  [0, 13], [13, 14],[14, 15],[15, 16],  // annulaire
  [0, 17], [17, 18],[18, 19],[19, 20],  // auriculaire
  [5, 9],  [9, 13], [13, 17],           // paume
];

// ─── Connexions squelette corps (8 points : épaules, coudes, poignets) ───
const BODY_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2],   // cou → épaules
  [1, 3], [2, 4],   // épaules → coudes
  [3, 5], [4, 6],   // coudes → poignets
];

const BODY_IDS = [
  "NOSE",
  "RIGHT_SHOULDER", "LEFT_SHOULDER",
  "RIGHT_ELBOW",    "LEFT_ELBOW",
  "RIGHT_WRIST",    "LEFT_WRIST",
];

// ─── Utilitaires dessin ───────────────────────────────────────────────────
function toCanvas(pt: Keypoint, W: number, H: number) {
  return { x: pt.x * W, y: pt.y * H };
}

function getBodyPts(pose: Keypoint[]): (Keypoint | null)[] {
  return BODY_IDS.map(id => pose.find(p => p.id === id) ?? null);
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pts: Keypoint[],
  connections: [number, number][],
  W: number,
  H: number,
  colorA: string,
  colorB: string,
  lineWidth: number
) {
  connections.forEach(([a, b]) => {
    const pa = pts[a], pb = pts[b];
    if (!pa || !pb) return;
    const sa = toCanvas(pa, W, H);
    const sb = toCanvas(pb, W, H);
    const grad = ctx.createLinearGradient(sa.x, sa.y, sb.x, sb.y);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  });
}

function drawJoints(
  ctx: CanvasRenderingContext2D,
  pts: Keypoint[],
  W: number,
  H: number,
  tipColor: string,
  jointColor: string
) {
  const TIPS = new Set([4, 8, 12, 16, 20]);
  pts.forEach((pt, i) => {
    if (!pt) return;
    const p = toCanvas(pt, W, H);
    const isTip = TIPS.has(i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, isTip ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? tipColor : jointColor;
    ctx.shadowColor = isTip ? tipColor : jointColor;
    ctx.shadowBlur = isTip ? 10 : 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawBodySkeleton(
  ctx: CanvasRenderingContext2D,
  pose: Keypoint[],
  W: number,
  H: number
) {
  const bodyPts = getBodyPts(pose);
  const validPts = bodyPts.filter(Boolean) as Keypoint[];

  BODY_CONNECTIONS.forEach(([a, b]) => {
    const pa = bodyPts[a], pb = bodyPts[b];
    if (!pa || !pb) return;
    const sa = toCanvas(pa, W, H);
    const sb = toCanvas(pb, W, H);
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.strokeStyle = "rgba(120, 220, 180, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.stroke();
  });

  validPts.forEach(pt => {
    const p = toCanvas(pt, W, H);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(120, 220, 180, 0.85)";
    ctx.fill();
  });
}

function drawGlow(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const grd = ctx.createRadialGradient(W / 2, H * 0.75, 5, W / 2, H * 0.75, W * 0.6);
  grd.addColorStop(0, "rgba(80, 110, 255, 0.1)");
  grd.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

// ─── Composant principal ──────────────────────────────────────────────────
export function AnimatedHand({
  postId,
  frames: propsFrames,
  metadata: propsMetadata,
  apiBaseUrl = "",
  width = 200,
  height = 260,
  autoPlay = true,
  onComplete,
}: AnimatedHandProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameIndexRef = useRef(0);

  const [data, setData] = useState<SignResponse | null>(null);
  const [loading, setLoading] = useState(!!postId);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [currentGloss, setCurrentGloss] = useState("");

  // ── Fetch des frames depuis l'API (si postId fourni) ──────────────────
  useEffect(() => {
    if (!postId) {
      if (propsFrames && propsMetadata) {
        setData({ frames: propsFrames, metadata: propsMetadata });
        setCurrentGloss(propsMetadata.gloss);
      }
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`${apiBaseUrl}/sign-translation/videopost/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<SignResponse>;
      })
      .then(json => {
        setData(json);
        setCurrentGloss(json.metadata.gloss);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [postId, apiBaseUrl, propsFrames, propsMetadata]);

  // ── Boucle d'animation ─────────────────────────────────────────────────
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const { frames, metadata } = data;
    const totalFrames = frames.length;

    ctx.clearRect(0, 0, W, H);
    drawGlow(ctx, W, H);

    const frame = frames[Math.floor(frameIndexRef.current) % totalFrames];

    // Corps
    if (frame.pose_keypoints?.length) {
      drawBodySkeleton(ctx, frame.pose_keypoints, W, H);
    }

    // Main droite
    if (frame.hand_right_keypoints?.length === 21) {
      drawSkeleton(
        ctx,
        frame.hand_right_keypoints,
        HAND_CONNECTIONS,
        W, H,
        "rgba(99, 180, 255, 0.9)",
        "rgba(180, 130, 255, 0.9)",
        2.5
      );
      drawJoints(
        ctx,
        frame.hand_right_keypoints,
        W, H,
        "rgba(200, 150, 255, 1)",
        "rgba(99, 180, 255, 0.95)"
      );
    }

    // Main gauche (si présente)
    if (frame.hand_left_keypoints?.length === 21) {
      drawSkeleton(
        ctx,
        frame.hand_left_keypoints,
        HAND_CONNECTIONS,
        W, H,
        "rgba(99, 230, 180, 0.9)",
        "rgba(60, 190, 255, 0.9)",
        2.5
      );
      drawJoints(
        ctx,
        frame.hand_left_keypoints,
        W, H,
        "rgba(100, 240, 200, 1)",
        "rgba(60, 190, 255, 0.95)"
      );
    }

    // Avance le frame selon la vitesse et le FPS
    frameIndexRef.current += speed;
    if (frameIndexRef.current >= totalFrames) {
      frameIndexRef.current = 0;
      onComplete?.();
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [data, speed, onComplete]);

  // ── Démarre / arrête la boucle ─────────────────────────────────────────
  useEffect(() => {
    if (playing && data) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, data, animate]);

  const handleReplay = () => {
    frameIndexRef.current = 0;
    setPlaying(true);
  };

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "relative",
        width,
        borderRadius: 10,
        background: "rgba(0,0,0,0.75)",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: "block", width: "100%", height }}
      />

      {/* Badge gloss */}
      {currentGloss && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(99,180,255,0.9)",
            background: "rgba(99,180,255,0.12)",
            borderRadius: 99,
            padding: "2px 8px",
            whiteSpace: "nowrap",
            letterSpacing: ".04em",
            pointerEvents: "none",
          }}
        >
          {currentGloss}
        </div>
      )}

      {/* Label langue */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 6,
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          pointerEvents: "none",
        }}
      >
        {data?.metadata.sign_language ?? "LSF"}
      </div>

      {/* État loading */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Chargement...
        </div>
      )}

      {/* État erreur */}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            fontSize: 11,
            color: "rgba(255,100,100,0.9)",
            textAlign: "center",
            padding: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* Contrôles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 6px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 6,
            border: "0.5px solid rgba(255,255,255,0.15)",
            background: playing ? "rgba(99,180,255,0.12)" : "transparent",
            color: playing ? "rgba(99,180,255,0.9)" : "rgba(255,255,255,0.5)",
            cursor: "pointer",
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>

        <button
          onClick={handleReplay}
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 6,
            border: "0.5px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
          }}
        >
          ↺
        </button>

        <select
          value={speed}
          onChange={e => setSpeed(parseFloat(e.target.value))}
          style={{
            marginLeft: "auto",
            fontSize: 10,
            background: "transparent",
            border: "0.5px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.5)",
            borderRadius: 4,
            padding: "1px 4px",
          }}
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>
      </div>
    </div>
  );
}

export default AnimatedHand;
