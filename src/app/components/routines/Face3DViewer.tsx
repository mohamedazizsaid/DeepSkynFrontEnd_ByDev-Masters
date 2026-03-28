import React, { Suspense, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AlertTriangle, Download, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../../stores/auth.store';
import { usersService } from '../../../lib/services/users.service';

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
    id: 'forehead',
    label: 'Front',
    position: [0, 1.82, 0.16],
    categories: ['sunscreen', 'moisturizer', 'cleanser'],
    description: 'Zone haute pour la protection et l\'hydratation.',
  },
  {
    id: 'eyes-right',
    label: 'Contour yeux',
    position: [0.08, 1.69, 0.13],
    categories: ['eye_cream'],
    description: 'Soin délicat du contour des yeux.',
  },
  {
    id: 'eyes-left',
    label: 'Contour yeux',
    position: [-0.08, 1.69, 0.13],
    categories: ['eye_cream'],
    description: 'Soin délicat du contour des yeux.',
  },
  {
    id: 'cheeks-left',
    label: 'Joue gauche',
    position: [-0.14, 1.58, 0.12],
    categories: ['serum', 'treatment', 'moisturizer'],
    description: 'Idéal pour l\'application des sérums.',
  },
  {
    id: 'cheeks-right',
    label: 'Joue droite',
    position: [0.14, 1.58, 0.12],
    categories: ['serum', 'treatment', 'moisturizer'],
    description: 'Idéal pour l\'application des sérums.',
  },
  {
    id: 'nose',
    label: 'Nez / Zone T',
    position: [0, 1.62, 0.22],
    categories: ['exfoliant', 'deep_cleanser', 'toner'],
    description: 'Zone centrale pour le nettoyage et l\'exfoliation.',
  },
  {
    id: 'chin',
    label: 'Menton / Cou',
    position: [0, 1.50, 0.18],
    categories: ['cleanser', 'makeup_remover', 'toner'],
    description: 'Application pour le bas du visage.',
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
  const modelRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (!scene) onError();
  }, [scene, onError]);

  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    }
  });

  if (!scene) return null;

  return <primitive ref={modelRef} object={scene} position={[0, 0, 0]} scale={1} />;
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

  const isRightSide = zone.position[0] >= 0;

  return (
    <Html
      position={zone.position as [number, number, number]}
      distanceFactor={0.5}
      zIndexRange={[100, 0]}
      occlude={false}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          transform: isRightSide ? 'translate(0%, -50%)' : 'translate(-100%, -50%)',
          display: 'flex',
          flexDirection: isRightSide ? 'row' : 'row-reverse',
          alignItems: 'center',
          gap: '4px',
          opacity: isActive ? 1 : 0.9,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Dot */}
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          flexShrink: 0,
          background: isActive ? '#0EA5E9' : '#fff',
          boxShadow: isActive ? '0 0 8px rgba(14,165,233,0.8)' : '0 1px 3px rgba(0,0,0,0.2)',
          border: `2px solid ${isActive ? '#fff' : '#0EA5E9'}`,
          transition: 'all 0.2s ease',
        }} />
        
        {/* Label pill */}
        <div style={{
          background: isActive ? 'rgba(14,165,233,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${isActive ? '#0EA5E9' : 'rgba(14,165,233,0.3)'}`,
          borderRadius: '10px',
          padding: '3px 8px',
          fontSize: '9px',
          fontWeight: 600,
          color: isActive ? '#fff' : '#0369a1',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {matchedProducts[0]}
          {matchedProducts.length > 1 && (
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(14,165,233,0.1)',
              borderRadius: '6px',
              padding: '0 4px',
              fontSize: '8px',
              fontWeight: 700,
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
  onZoneClick: (zoneId: string, zoneLabel: string, zoneDescription: string, categories: string[]) => void;
  /**
   * Path to the .glb file. Defaults to '/models/face.glb'.
   * You can also pass a blob URL or any accessible URL.
   */
  glbUrl?: string;
}

export function Face3DViewer({ steps, highlightedZone, onZoneClick, glbUrl = '/models/face.glb' }: Face3DViewerProps) {
  const { user, setUser } = useAuthStore();
  const [showInstructions, setShowInstructions] = useState(false);
  const [useGlbModel, setUseGlbModel] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usersService.getMe().then(setDbUser).catch(console.error);
  }, []);

  const profile = dbUser || user;
  const isFemale = profile?.gender?.toLowerCase() === 'female' || profile?.gender?.toLowerCase() === 'femme';
  const resolvedGlbUrl = profile?.avatar3D || (isFemale ? '/models/femme.glb' : '/models/homme.glb');
  const finalGlbUrl = glbUrl && glbUrl !== '/models/face.glb' ? glbUrl : resolvedGlbUrl;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast.error('Seuls les fichiers .glb sont acceptés');
      return;
    }

    setIsUploading(true);
    try {
      const updatedUser = await usersService.uploadAvatar3D(file);
      setDbUser(updatedUser);
      setUser({ ...user, avatar3D: updatedUser.avatar3D } as any);
      toast.success('Avatar 3D mis à jour !');
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'upload");
    } finally {
      setIsUploading(false);
      setShowInstructions(false);
    }
  };

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
    if (finalGlbUrl) {
      try { useGLTF.preload(finalGlbUrl); } catch { /* ignore */ }
    }
  }, [finalGlbUrl]);

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
          <p className="mb-3 text-gray-600 leading-relaxed">
            Va dans <a href="https://avaturn.me" target="_blank" rel="noreferrer" className="text-[#0EA5E9] font-bold hover:underline">Avaturn.me</a>, crée ton avatar, télécharge-le au format .glb puis uploade-le ici :
          </p>
          <div className="flex items-center gap-3">
            <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isUploading ? 'bg-gray-100 text-gray-400' : 'bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20'
              }`}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isUploading ? 'Upload en cours...' : 'Uploader fichier .glb'}
              <input 
                type="file"
                accept=".glb"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
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
                <FaceGLBModel url={finalGlbUrl} onError={handleGlbError} />
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
                  onZoneClick(zone.id, zone.label, zone.description, zone.categories);
                  const productsCount = (zoneProducts[zone.id] || []).length;
                  toast.dismiss('zone-context-toast');
                  toast.custom(
                    <div className="w-[300px] rounded-xl border border-sky-200 bg-white/95 backdrop-blur-sm shadow-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-[#0EA5E9]" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{zone.label}</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{zone.description}</p>
                          <p className="text-[11px] text-[#0369a1] mt-2 font-medium">
                            {productsCount > 0
                              ? `${productsCount} produit${productsCount > 1 ? 's' : ''} de votre routine ${productsCount > 1 ? 'sont' : 'est'} lié${productsCount > 1 ? 's' : ''} à cette zone`
                              : 'Aucun produit de la routine actuelle n\'est lié à cette zone'}
                          </p>
                        </div>
                      </div>
                    </div>,
                    {
                      id: 'zone-context-toast',
                      duration: 3600,
                      position: 'top-right',
                    }
                  );
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