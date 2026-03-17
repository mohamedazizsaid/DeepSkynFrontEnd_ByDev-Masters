import React, { Suspense, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AlertTriangle, Download, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Face Zone Definitions ───
export interface FaceZoneData {
  id: string;
  label: string;
  position: [number, number, number];
  categories: string[];
  description: string;
}

export const FACE_ZONES: FaceZoneData[] = [
  {
    // Forehead — top center, tag left side
    id: 'forehead',
    label: 'Front',
    position: [-0.09, 1.86, 0.14],
    categories: ['sunscreen', 'moisturizer'],
    description: 'Zone principale pour la protection solaire et l\'hydratation.',
  },
  {
    // Eyes — right side of face
    id: 'eyes',
    label: 'Contour yeux',
    position: [0.11, 1.70, 0.14],
    categories: ['eye_cream'],
    description: 'Zone sensible nécessitant un soin doux et ciblé.',
  },
  {
    // Left cheek — left of nose
    id: 'cheeks-left',
    label: 'Joues',
    position: [-0.11, 1.57, 0.14],
    categories: ['serum', 'treatment'],
    description: 'Idéal pour l\'application de sérums et de soins traitants.',
  },
  {
    // Right cheek — right of nose
    id: 'cheeks-right',
    label: 'Joues',
    position: [0.11, 1.57, 0.14],
    categories: ['serum', 'treatment'],
    description: 'Idéal pour l\'application de sérums et de soins traitants.',
  },
  {
    // Nose — center bridge, tag right
    id: 'nose',
    label: 'Nez',
    position: [0.09, 1.64, 0.17],
    categories: ['exfoliant', 'deep_cleanser'],
    description: 'Zone ciblée pour l\'exfoliation et le nettoyage en profondeur.',
  },
  {
    // Lips — below nose, tag left
    id: 'lips',
    label: 'Lèvres',
    position: [-0.08, 1.48, 0.15],
    categories: ['treatment'],
    description: 'Application de baumes et soins pour les lèvres hydratées.',
  },
  {
    // Chin — bottom center, tag right
    id: 'chin',
    label: 'Menton',
    position: [0.08, 1.40, 0.14],
    categories: ['cleanser', 'toner', 'makeup_remover'],
    description: 'Zone d\'application pour nettoyants, toniques et démaquillants.',
  },
];

// ─── Fallback procedural face ───
function ProceduralFace() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 1.65, 0]}>
      <sphereGeometry args={[0.35, 64, 64]} />
      <meshPhysicalMaterial
        color="#fcd5ce"
        roughness={0.6}
        metalness={0.1}
        clearcoat={0.3}
        clearcoatRoughness={0.4}
      />
    </mesh>
  );
}

// ─── GLB Model Loader ───
function FaceGLBModel({ url, onError }: { url: string; onError: () => void }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) onError();
  }, [scene, onError]);

  if (!scene) return null;

  return <primitive object={scene} position={[0, 0, 0]} scale={1} />;
}

// ─── Face Tag Component (HTML overlay in 3D) ───
interface FaceTagProps {
  zone: FaceZoneData;
  matchedProducts: string[];
  isActive: boolean;
  onClick: () => void;
}

function FaceTag({ zone, matchedProducts, isActive, onClick }: FaceTagProps) {
  const hasProducts = matchedProducts.length > 0;
  if (!hasProducts) return null;

  return (
    <Html
      position={zone.position as [number, number, number]}
      distanceFactor={0.45}
      zIndexRange={[100, 0]}
      occlude={false}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          transform: 'translate(0%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        {/* Dot */}
        <div style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          flexShrink: 0,
          background: isActive ? '#0EA5E9' : 'rgba(14,165,233,0.85)',
          boxShadow: isActive ? '0 0 5px rgba(14,165,233,1)' : '0 0 3px rgba(14,165,233,0.6)',
          border: '1px solid rgba(255,255,255,1)',
          transition: 'all 0.2s ease',
        }} />
        {/* Connector line */}
        <div style={{
          width: "5px",
          height: '1px',
          background: isActive ? 'rgba(14,165,233,0.7)' : 'rgba(14,165,233,0.4)',
          flexShrink: 0,
        }} />
        {/* Label pill */}
        <div style={{
          background: isActive ? 'rgba(14,165,233,0.92)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1px solid ${isActive ? 'rgba(14,165,233,0.6)' : 'rgba(14,165,233,0.30)'}`,
          borderRadius: '8px',
          padding: '1px 5px',
          fontSize: '7px',
          fontWeight: 700,
          color: isActive ? '#fff' : '#0369a1',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          lineHeight: '13px',
          letterSpacing: '0.02em',
          transition: 'all 0.2s ease',
        }}>
          {matchedProducts[0]}
          {matchedProducts.length > 1 && (
            <span style={{
              marginLeft: '2px',
              background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(14,165,233,0.15)',
              borderRadius: '6px',
              padding: '0 3px',
              fontSize: '6.5px',
            }}>
              +{matchedProducts.length - 1}
            </span>
          )}
        </div>
      </div>
    </Html>
  );
}

// ─── Camera focused on face ───
function FocusedCamera() {
  const { camera } = useThree();
  useEffect(() => {
    // Position camera to look directly at face area
    camera.position.set(0, 1.65, 0.55);
    camera.lookAt(0, 1.65, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ─── Loading spinner ───
function LoadingFallback() {
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: '#0EA5E9',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(14,165,233,0.2)',
          borderTop: '3px solid #0EA5E9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
          Chargement du visage...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Html>
  );
}

// ─── Main 3D Face Viewer Component ───
interface Face3DViewerProps {
  steps: Array<{
    name: string;
    category?: string;
    order: number;
  }>;
  highlightedZone: string | null;
  onZoneClick: (zoneId: string, categories: string[]) => void;
  /**
   * Path to the .glb file. Defaults to '/models/face.glb'.
   * You can also pass a blob URL or any accessible URL.
   */
  glbUrl?: string;
}

export function Face3DViewer({ steps, highlightedZone, onZoneClick, glbUrl = '/models/face.glb' }: Face3DViewerProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [useGlbModel, setUseGlbModel] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleGlbError = useCallback(() => {
    setUseGlbModel(false);
  }, []);

  // Map routine steps to face zones
  const zoneProducts = useMemo(() => {
    const map: Record<string, string[]> = {};
    FACE_ZONES.forEach((zone) => {
      const matched = steps.filter((step) =>
        zone.categories.includes(step.category || '')
      );
      map[zone.id] = matched.map((s) => s.name);
    });
    return map;
  }, [steps]);

  // Preload GLB
  useEffect(() => {
    if (glbUrl) {
      try { useGLTF.preload(glbUrl); } catch { /* ignore */ }
    }
  }, [glbUrl]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-white group shadow-sm"
      style={{ height: '400px', maxHeight: '400px', minHeight: '400px' }}
      onClick={handleContainerClick}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe] to-[#f0f9ff] pointer-events-none" />

      {/* Info button */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInstructions(!showInstructions);
          }}
          className="bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-xl text-gray-600 hover:text-gray-900 flex items-center gap-2 text-xs transition-colors shadow-sm"
        >
          {showInstructions
            ? <AlertTriangle className="w-3.5 h-3.5 text-[#0EA5E9]" />
            : <Download className="w-3.5 h-3.5 text-[#0EA5E9]" />}
          {showInstructions ? 'Fermer info' : 'Modèle 3D (.glb)'}
        </button>
      </div>

      {showInstructions && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-white/95 backdrop-blur-xl border border-gray-200 p-4 rounded-xl text-xs text-gray-700 shadow-xl">
          <h4 className="font-bold text-[#0EA5E9] mb-2 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Importez votre avatar réaliste
          </h4>
          <p className="mb-2 text-gray-600">Placez votre fichier <code className="bg-gray-100 px-1 py-0.5 rounded">.glb</code> dans <code className="bg-gray-100 px-1 py-0.5 rounded">public/models/face.glb</code></p>
          <p className="text-gray-500">Sources: <a href="https://readyplayer.me/" target="_blank" rel="noreferrer" className="text-[#0EA5E9] hover:underline">ReadyPlayer.me</a> · <a href="https://sketchfab.com/tags/face-scan" target="_blank" rel="noreferrer" className="text-[#0EA5E9] hover:underline">Sketchfab</a></p>
        </div>
      )}

      {/* 3D Canvas */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 1.65, 0.55], fov: 22, near: 0.01, far: 100 }}
            style={{
              background: 'transparent',
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'none',
            }}
            resize={{ scroll: false, debounce: { scroll: 50, resize: 50 } }}
            gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
            onPointerMissed={(e) => e.stopPropagation()}
          >
            <FocusedCamera />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 3, 3]} intensity={1.0} castShadow />
            <directionalLight position={[-2, 2, 2]} intensity={0.4} color="#b3e5fc" />
            <pointLight position={[0, 2, 1.5]} intensity={0.6} color="#0EA5E9" />
            <pointLight position={[0, 1.5, -1]} intensity={0.2} color="#ffffff" />

            <Environment preset="studio" />

            {/* Face model */}
            <Suspense fallback={<LoadingFallback />}>
              {useGlbModel ? (
                <FaceGLBModel url={glbUrl} onError={handleGlbError} />
              ) : (
                <ProceduralFace />
              )}
            </Suspense>

            {/* Contact shadow below chin */}
            <ContactShadows
              position={[0, 1.2, 0]}
              opacity={0.1}
              scale={1}
              blur={1.5}
              far={0.5}
              color="#000000"
            />

            {/* Face zone tags — only shown when products match */}
            {FACE_ZONES.map((zone) => (
              <FaceTag
                key={zone.id}
                zone={zone}
                matchedProducts={zoneProducts[zone.id] || []}
                isActive={highlightedZone === zone.id}
                onClick={() => {
                  onZoneClick(zone.id, zone.categories);
                  const productsCount = (zoneProducts[zone.id] || []).length;
                  toast((t) => (
                    <div className="flex flex-col gap-1">
                      <strong className="text-sm font-semibold text-gray-800">{zone.label}</strong>
                      <span className="text-xs text-gray-500">
                        {zone.description}
                        {productsCount > 0 && ` (${productsCount} produit${productsCount > 1 ? 's' : ''} associé${productsCount > 1 ? 's' : ''})`}
                      </span>
                    </div>
                  ), { duration: 3000 });
                }}
              />
            ))}

            {/* Orbital controls — restricted to face area */}
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={0.3}
              maxDistance={0.8}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={(3 * Math.PI) / 4}
              target={[0, 1.65, 0]}
              autoRotate={!showInstructions}
              autoRotateSpeed={0.4}
              makeDefault
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 py-1.5 px-3 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 text-[10px] whitespace-nowrap shadow-sm pointer-events-none z-10">
        <span className="flex items-center gap-1">🖱️ Glisser = Tourner</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span className="flex items-center gap-1">🔍 Molette = Zoomer</span>
      </div>

      <div className="absolute inset-0 rounded-2xl pointer-events-none border border-black/5" />
    </div>
  );
}