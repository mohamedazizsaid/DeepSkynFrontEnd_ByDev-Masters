import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Layers, Eye, Sparkles, AlertTriangle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import type { GeminiAnalysisResult } from '../../../lib/types';

interface Props {
  imageSrc: string;
  results: GeminiAnalysisResult;
  isDark?: boolean;
  isHcHigh?: boolean;
}

type MetricKey = keyof GeminiAnalysisResult['detailedAnalysis'];

const LABELS: Record<MetricKey, string> = {
  hydration: 'Hydratation', texture: 'Texture', pores: 'Pores',
  pigmentation: 'Pigmentation', wrinkles: 'Rides', acne: 'Acné',
  redness: 'Rougeurs', elasticity: 'Élasticité',
};

// ── face-api.js 68-point layout ──────────────────────────────
// jaw: 0-16 | lBrow: 17-21 | rBrow: 22-26 | noseBridge: 27-30
// noseBase: 31-35 | lEye: 36-41 | rEye: 42-47
// outerMouth: 48-59 | innerMouth: 60-67

// Triangles referencing landmark indices + assigned skin metric
const TRIANGLES: { i: [number, number, number]; m: MetricKey }[] = [
  // FOREHEAD / top (synthetic centre-forehead points derived from brow midpoints)
  // Left eyebrow → texture / wrinkles
  { i: [17, 18, 36], m: 'wrinkles' }, { i: [18, 19, 36], m: 'wrinkles' },
  { i: [19, 20, 37], m: 'texture' }, { i: [20, 21, 39], m: 'texture' },
  // Right eyebrow
  { i: [22, 23, 42], m: 'wrinkles' }, { i: [23, 24, 43], m: 'wrinkles' },
  { i: [24, 25, 44], m: 'texture' }, { i: [25, 26, 45], m: 'texture' },
  // Between brows → pigmentation
  { i: [21, 22, 27], m: 'pigmentation' }, { i: [19, 24, 27], m: 'pigmentation' },
  { i: [20, 25, 27], m: 'pigmentation' },
  // Nose bridge → pores
  { i: [27, 28, 31], m: 'pores' }, { i: [28, 29, 32], m: 'pores' },
  { i: [29, 30, 33], m: 'pores' }, { i: [30, 35, 34], m: 'pores' },
  { i: [31, 32, 33], m: 'pores' }, { i: [33, 34, 35], m: 'pores' },
  // Left eye area → redness
  { i: [36, 37, 41], m: 'redness' }, { i: [37, 38, 40], m: 'redness' },
  { i: [38, 39, 40], m: 'redness' }, { i: [36, 41, 40], m: 'redness' },
  // Right eye area → redness
  { i: [42, 43, 47], m: 'redness' }, { i: [43, 44, 46], m: 'redness' },
  { i: [44, 45, 46], m: 'redness' }, { i: [42, 47, 46], m: 'redness' },
  // Left cheek → hydration
  { i: [1, 2, 31], m: 'hydration' }, { i: [2, 3, 31], m: 'hydration' },
  { i: [3, 4, 48], m: 'hydration' }, { i: [1, 36, 41], m: 'hydration' },
  { i: [36, 41, 31], m: 'hydration' }, { i: [31, 41, 48], m: 'hydration' },
  // Right cheek → hydration
  { i: [14, 15, 35], m: 'hydration' }, { i: [13, 14, 35], m: 'hydration' },
  { i: [12, 13, 54], m: 'hydration' }, { i: [15, 45, 47], m: 'hydration' },
  { i: [45, 47, 35], m: 'hydration' }, { i: [35, 47, 54], m: 'hydration' },
  // Nose base / nostrils → pores
  { i: [31, 32, 48], m: 'pores' }, { i: [34, 35, 54], m: 'pores' },
  { i: [32, 33, 51], m: 'pores' }, { i: [33, 34, 53], m: 'pores' },
  // Mouth / lips → elasticity
  { i: [48, 49, 60], m: 'elasticity' }, { i: [49, 50, 61], m: 'elasticity' },
  { i: [50, 51, 62], m: 'elasticity' }, { i: [51, 52, 63], m: 'elasticity' },
  { i: [52, 53, 64], m: 'elasticity' }, { i: [53, 54, 65], m: 'elasticity' },
  { i: [54, 55, 66], m: 'elasticity' }, { i: [55, 56, 67], m: 'elasticity' },
  { i: [56, 57, 67], m: 'elasticity' }, { i: [57, 58, 60], m: 'elasticity' },
  // Chin → acne
  { i: [6, 7, 57], m: 'acne' }, { i: [7, 8, 58], m: 'acne' },
  { i: [8, 9, 58], m: 'acne' }, { i: [9, 10, 57], m: 'acne' },
  { i: [5, 6, 48], m: 'acne' }, { i: [10, 11, 54], m: 'acne' },
  // Jaw sides → elasticity
  { i: [0, 1, 36], m: 'elasticity' }, { i: [15, 16, 45], m: 'elasticity' },
  { i: [0, 17, 36], m: 'elasticity' }, { i: [16, 26, 45], m: 'elasticity' },
];

// Score → vibrant RGBA (matches reference image palette)
function fill(score: number, a = 0.42): string {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 85) return `rgba(0,230,180,${a})`;         // cyan-green
  if (s >= 70) return `rgba(80,140,255,${a})`;         // blue
  if (s >= 55) return `rgba(160,80,255,${a})`;         // purple
  if (s >= 40) return `rgba(255,140,30,${a})`;          // orange
  return `rgba(230,50,80,${a})`;                  // red
}
function edge(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 85) return 'rgba(0,240,190,0.90)';
  if (s >= 70) return 'rgba(80,160,255,0.88)';
  if (s >= 55) return 'rgba(180,80,255,0.88)';
  if (s >= 40) return 'rgba(255,160,30,0.88)';
  return 'rgba(235,60,80,0.88)';
}

const MODEL_URL = '/models';
let modelsLoaded = false;

async function ensureModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export function FaceZoneVisualization({ imageSrc, results, isDark, isHcHigh }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const ptsRef = useRef<{ x: number; y: number }[] | null>(null);

  const [status, setStatus] = useState<'loading' | 'detecting' | 'ready' | 'noface'>('loading');
  const [showOverlay, setShowOverlay] = useState(true);
  const [hovered, setHovered] = useState<MetricKey | null>(null);

  // ── Draw on canvas ────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const pts = ptsRef.current;
    if (!canvas || !img) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (!W || !H) return;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Cover-fit the photo
    const iA = img.naturalWidth / img.naturalHeight;
    const cA = W / H;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (iA > cA) { sw = sh * cA; sx = (img.naturalWidth - sw) / 2; }
    else { sh = sw / cA; sy = (img.naturalHeight - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

    if (!showOverlay || !pts) return;

    // Scale landmark coords (from natural image space) to canvas display space
    const scaleX = W / (img.naturalWidth - 2 * sx);
    const scaleY = H / (img.naturalHeight - 2 * sy);
    const mapped = pts.map(p => ({
      x: (p.x - sx) * scaleX,
      y: (p.y - sy) * scaleY,
    }));

    // Draw triangle fills
    for (const tri of TRIANGLES) {
      const [i0, i1, i2] = tri.i;
      const p0 = mapped[i0], p1 = mapped[i1], p2 = mapped[i2];
      if (!p0 || !p1 || !p2) continue;
      const score = results.detailedAnalysis[tri.m]?.score ?? 70;
      const isHl = hovered === tri.m;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = fill(score, isHl ? 0.68 : 0.40);
      ctx.fill();
    }

    // Draw edges
    for (const tri of TRIANGLES) {
      const [i0, i1, i2] = tri.i;
      const p0 = mapped[i0], p1 = mapped[i1], p2 = mapped[i2];
      if (!p0 || !p1 || !p2) continue;
      const score = results.detailedAnalysis[tri.m]?.score ?? 70;
      const isHl = hovered === tri.m;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.strokeStyle = edge(score).replace(/[\d.]+\)$/, isHl ? '1.0)' : '0.85)');
      ctx.lineWidth = isHl ? 2.0 : 1.0;
      ctx.stroke();
    }

    // Landmark dots
    for (const p of mapped) {
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.5, 'rgba(180,240,255,0.50)');
      grd.addColorStop(1, 'rgba(100,200,255,0)');
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
    }

    // HUD overlays
    ctx.save();
    ctx.font = 'bold 12px Inter,monospace';
    ctx.fillStyle = 'rgba(0,220,255,0.82)';
    ctx.textAlign = 'center'; ctx.fillText('DEEPSYN', W / 2, 22);
    ctx.font = '9px Inter,monospace';
    ctx.fillStyle = 'rgba(0,220,255,0.60)';
    ctx.fillText('AI SKIN ANALYSIS', W / 2, H - 12);
    ctx.textAlign = 'right'; ctx.fillText('v1.0', W - 8, H - 12);
    ctx.restore();

    // Cyan frame + corner brackets
    ctx.strokeStyle = 'rgba(0,200,255,0.55)'; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    const bL = 18;
    ctx.strokeStyle = 'rgba(0,220,255,0.90)'; ctx.lineWidth = 2.5;
    for (const [cx, cy, dx, dy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]] as [number, number, number, number][]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * bL, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * bL);
      ctx.stroke();
    }
  }, [results, showOverlay, hovered]);

  // ── Load image + detect face ──────────────────────────────
  useEffect(() => {
    setStatus('loading');
    ptsRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      imgRef.current = img;
      setStatus('detecting');

      try {
        await ensureModels();
        const det = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
          .withFaceLandmarks();

        if (!det) {
          setStatus('noface');
          // Still draw the image without overlay
          draw();
          return;
        }

        // Store raw landmark points in natural image coordinates
        ptsRef.current = det.landmarks.positions.map(p => ({ x: p.x, y: p.y }));
        setStatus('ready');
      } catch {
        setStatus('noface');
      }
    };
    img.src = imageSrc;
    return () => { img.onload = null; };
  }, [imageSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { draw(); }, [draw, status]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const metrics = Object.entries(results.detailedAnalysis) as [MetricKey, { score: number; description: string }][];

  // ── Styles ────────────────────────────────────────────────
  const card = isHcHigh
    ? 'rounded-2xl border-2 border-yellow-400 bg-black overflow-hidden'
    : isDark
      ? 'rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl overflow-hidden'
      : 'rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-500/8 overflow-hidden';

  const tc = isHcHigh ? 'text-yellow-300' : isDark ? 'text-white' : 'text-slate-900';
  const sc = isHcHigh ? 'text-yellow-400' : isDark ? 'text-slate-400' : 'text-slate-500';
  const lb = isHcHigh ? 'bg-yellow-400/5 border border-yellow-400/20'
    : isDark ? 'bg-slate-800/60 border border-slate-700'
      : 'bg-slate-50 border border-slate-100';
  const mb = isHcHigh ? 'border-yellow-400/10 hover:bg-yellow-400/5'
    : isDark ? 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
      : 'bg-white/60 border-slate-100 hover:border-blue-200';
  const sep = isDark ? 'border-slate-700/60' : 'border-slate-100';

  return (
    <div className={card}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${sep}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-lg ${isHcHigh ? 'bg-yellow-400/20' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}`}>
            <Layers className={`w-5 h-5 ${isHcHigh ? 'text-yellow-300' : 'text-white'}`} />
          </div>
          <div>
            <h3 className={`text-base font-bold ${tc}`}>Cartographie des Zones</h3>
            <p className={`text-xs ${sc}`}>
              <Sparkles className="inline w-3 h-3 mr-1 text-cyan-500" />
              Détection faciale IA · Données réelles
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowOverlay(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border
            ${isHcHigh ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30'
              : isDark ? 'bg-slate-700 text-slate-200 border-slate-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 shadow-sm'}`}
        >
          <Eye className="w-3.5 h-3.5" />
          {showOverlay ? 'Masquer' : 'Afficher'}
        </button>
      </div>

      {/* Body */}
      <div className="p-6 grid md:grid-cols-[1fr_260px] gap-6 items-start">

        {/* Canvas */}
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '4/5', maxHeight: '600px', background: '#050b18' }}>
          <canvas ref={canvasRef} className="w-full h-full block" style={{ width: '100%', height: '100%' }} />

          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-cyan-400 text-xs">Chargement image…</span>
            </div>
          )}
          {status === 'detecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-purple-300 text-xs">Détection du visage…</span>
            </div>
          )}
          {status === 'noface' && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full text-yellow-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Visage non détecté — zones estimées
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={`rounded-xl p-4 flex flex-col gap-2 ${lb}`}>
          <p className={`text-xs font-semibold mb-1 ${sc}`}>Scores par zone</p>

          {metrics.map(([key, val]) => {
            const score = val?.score ?? 0;
            const isActive = hovered === key;
            const edgeCol = edge(score);

            return (
              <motion.button
                key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                whileHover={{ x: 3 }}
                className={`w-full text-left rounded-xl p-3 transition-all border ${isActive
                    ? isDark ? 'bg-slate-700 border-cyan-500/50 shadow-md'
                      : 'bg-white border-blue-300 shadow-md'
                    : mb
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: edgeCol }} />
                    <span className={`text-xs font-semibold ${isHcHigh ? 'text-yellow-200' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {LABELS[key]}
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: edgeCol }}>
                    {score}<span className={`text-[10px] font-normal ml-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/100</span>
                  </span>
                </div>

                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: edgeCol }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                {isActive && val?.description && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`text-[10px] mt-1.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {val.description}
                  </motion.p>
                )}
              </motion.button>
            );
          })}

          {/* Colour scale */}
          <div className={`mt-2 rounded-xl p-3 ${isDark ? 'bg-slate-900/60' : 'bg-white/80 border border-slate-100'}`}>
            <p className={`text-[10px] font-semibold mb-2 ${sc}`}>Échelle de score</p>
            <div className="h-2.5 rounded-full" style={{
              background: 'linear-gradient(to right,rgba(230,50,80,.9),rgba(255,140,30,.9),rgba(160,80,255,.9),rgba(80,140,255,.9),rgba(0,230,180,.9))'
            }} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-red-400">À traiter</span>
              <span className="text-[9px] text-emerald-400">Excellent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
