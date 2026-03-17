import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FaceTag } from './FaceTag';
import { AlertTriangle, Download, Sparkles } from 'lucide-react';

// ─── Face Zone Definitions ───
export interface FaceZoneData {
  id: string;
  label: string;
  position: [number, number, number];
  categories: string[];
}

export const FACE_ZONES: FaceZoneData[] = [
  {
    id: 'forehead',
    label: 'Front',
    position: [0, 1.6, 0.8],
    categories: ['sunscreen', 'moisturizer'],
  },
  {
    id: 'eyes',
    label: 'Contour des yeux',
    position: [0.45, 1.15, 0.85],
    categories: ['eye_cream'],
  },
  {
    id: 'cheeks-left',
    label: 'Joues',
    position: [-0.7, 0.8, 0.6],
    categories: ['serum', 'treatment'],
  },
  {
    id: 'cheeks-right',
    label: 'Joues',
    position: [0.7, 0.8, 0.6],
    categories: ['serum', 'treatment'],
  },
  {
    id: 'nose',
    label: 'Nez',
    position: [0, 0.9, 1.0],
    categories: ['exfoliant', 'deep_cleanser'],
  },
  {
    id: 'lips',
    label: 'Lèvres',
    position: [0, 0.4, 0.9],
    categories: ['treatment'], // lip balm
  },
  {
    id: 'chin',
    label: 'Menton',
    position: [0, 0.05, 0.75],
    categories: ['cleanser', 'toner', 'makeup_remover'],
  },
];

// ─── Stylized Procedural Face Mesh (Fallback) ───
// This is used if the user hasn't downloaded a custom GLB file yet.
function ProceduralFace() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.8, 0]}>
      {/* @ts-ignore - R3F intrinsic elements typing issue */}
      <sphereGeometry args={[1, 64, 64]} />
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

// ─── Custom GLB Model (Not automatically loaded to avoid crashes) ───
/* 
// Instructions pour utiliser votre propre modèle :
// 1. Allez sur https://readyplayer.me/ ou Sketchfab pour télécharger un modèle de tête (.glb)
// 2. Placez le fichier dans le dossier public/models/ de votre app sous le nom "face.glb"
// 3. Décommentez et utilisez ce composant `CustomFaceGLB` au lieu de `ProceduralFace`
*/
function CustomFaceGLB() {
  const { scene } = useGLTF('/models/face.glb');
  return <primitive object={scene} position={[0, 0, 0]} scale={1.5} />;
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
}

export function Face3DViewer({ steps, highlightedZone, onZoneClick }: Face3DViewerProps) {
  const [showInstructions, setShowInstructions] = useState(false);

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

  // Handle cleanup of loaded GLTF resources if we were to dynamically load them
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-gray-200 bg-white group shadow-sm">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe] to-[#f0f9ff] pointer-events-none" />

      {/* Suggestion Info Banner - appears on hover */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-xl text-gray-600 hover:text-gray-900 flex items-center gap-2 text-xs transition-colors shadow-sm"
        >
          {showInstructions ? <AlertTriangle className="w-3.5 h-3.5 text-[#0EA5E9]" /> : <Download className="w-3.5 h-3.5 text-[#0EA5E9]" />}
          {showInstructions ? 'Fermer info' : 'Modèle 3D Personnel (.glb)'}
        </button>
      </div>

      {showInstructions && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-white/95 backdrop-blur-xl border border-gray-200 p-4 rounded-xl text-xs text-gray-700 shadow-xl">
          <h4 className="font-bold text-[#0EA5E9] mb-2 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Importez votre avatar réaliste
          </h4>
          <p className="mb-2 text-gray-600">Pour un rendu ultra-photoréaliste, vous pouvez télécharger un modèle 3D depuis :</p>
          <ul className="list-disc pl-4 space-y-1 mb-3 text-gray-600">
            <li><a href="https://readyplayer.me/" target="_blank" rel="noreferrer" className="text-[#0EA5E9] hover:underline font-medium">ReadyPlayer.me</a> (Création de visage gratuit)</li>
            <li><a href="https://sketchfab.com/tags/face-scan" target="_blank" rel="noreferrer" className="text-[#0EA5E9] hover:underline font-medium">Sketchfab</a> (Rechercher "face scan")</li>
          </ul>
          <p className="text-gray-600">
            Placez votre fichier <code className="bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-gray-800">.glb</code> ou <code className="bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-gray-800">.gltf</code> dans le dossier <code className="bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-gray-800">public/models/</code> de votre projet sous le nom <code className="bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-gray-800">face.glb</code> et décommentez le composant <code className="text-[#0EA5E9]">CustomFaceGLB</code> dans <code className="text-[#0EA5E9]">Face3DViewer.tsx</code>.
          </p>
        </div>
      )}

      {/* Canvas */}
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 1, 4], fov: 40 }}
          style={{ background: 'transparent' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-3, 3, 2]} intensity={0.3} color="#0EA5E9" />
          <pointLight position={[0, 2, 3]} intensity={0.5} color="#0EA5E9" />

          {/* Environment for reflections */}
          <Environment preset="studio" />

          {/* Face mesh (Fallback procedural or Custom) */}
          <CustomFaceGLB />

          {/* Contact shadow */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.15}
            scale={4}
            blur={2}
            far={4}
            color="#000000"
          />

          {/* Face zone tags */}
          {FACE_ZONES.map((zone) => (
            <FaceTag
              key={zone.id}
              zone={zone}
              matchedProducts={zoneProducts[zone.id] || []}
              isActive={highlightedZone === zone.id}
              onClick={() => onZoneClick(zone.id, zone.categories)}
            />
          ))}

          {/* Orbital controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2.5}
            maxDistance={7}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(3 * Math.PI) / 4}
            target={[0, 0.8, 0]}
            autoRotate={showInstructions === false}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </Suspense>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 py-1.5 px-3 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 text-[10px] whitespace-nowrap shadow-sm pointer-events-none z-10">
        <span className="flex items-center gap-1">🖱️ Glisser = Tourner</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span className="flex items-center gap-1">🔍 Molette = Zoomer</span>
      </div>

      {/* Clean border overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none border border-black/5" />
    </div>
  );
}
