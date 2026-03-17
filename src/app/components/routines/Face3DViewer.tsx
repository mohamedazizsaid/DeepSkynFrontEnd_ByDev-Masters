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

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 64, 64);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      let newY = y * 1.15;
      let newX = x;
      let newZ = z;

      if (y < -0.2) {
        const chinFactor = 1 - Math.pow(Math.abs(y + 0.2) / 1.2, 0.8) * 0.35;
        newX *= chinFactor;
        newZ *= chinFactor;
      }

      if (y > -0.2 && y < 0.3 && Math.abs(x) < 0.15 && z > 0.7) {
        newZ += 0.12 * Math.cos(x * 10) * (1 - Math.abs(y - 0.05) / 0.25);
      }

      const eyeY = 0.25;
      const eyeX = 0.35;
      const distL = Math.sqrt(Math.pow(x + eyeX, 2) + Math.pow(y - eyeY, 2));
      const distR = Math.sqrt(Math.pow(x - eyeX, 2) + Math.pow(y - eyeY, 2));
      if ((distL < 0.18 || distR < 0.18) && z > 0.5) {
        newZ -= 0.06;
      }

      positions.setXYZ(i, newX, newY, newZ);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0.8, 0]}>
      <meshPhysicalMaterial
        color="#e8c19e"
        roughness={0.6}
        metalness={0.05}
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
function CustomFaceGLB() {
  const { scene } = useGLTF('/models/face.glb');
  return <primitive object={scene} position={[0, 0, 0]} scale={1.5} />;
}
*/

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
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 group">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c29] via-[#1a1a3e] to-[#0f0c29]" />

      {/* Suggestion Info Banner - appears on hover */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded-xl text-white/70 hover:text-white flex items-center gap-2 text-xs transition-colors shadow-lg"
        >
          {showInstructions ? <AlertTriangle className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Download className="w-3.5 h-3.5 text-[#0EA5E9]" />}
          {showInstructions ? 'Fermer info' : 'Modèle 3D Personnel (.glb)'}
        </button>
      </div>

      {showInstructions && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-black/80 backdrop-blur-xl border border-[#0EA5E9]/30 p-4 rounded-xl text-xs text-white shadow-2xl">
          <h4 className="font-bold text-[#0EA5E9] mb-2 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Importez votre avatar réaliste
          </h4>
          <p className="mb-2 text-white/80">Pour un rendu ultra-photoréaliste, vous pouvez télécharger un modèle 3D depuis :</p>
          <ul className="list-disc pl-4 space-y-1 mb-3 text-white/60">
            <li><a href="https://readyplayer.me/" target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:underline">ReadyPlayer.me</a> (Création de visage gratuit)</li>
            <li><a href="https://sketchfab.com/tags/face-scan" target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:underline">Sketchfab</a> (Rechercher "face scan")</li>
          </ul>
          <p className="text-white/80">
            Placez votre fichier <code className="bg-white/10 px-1 py-0.5 rounded border border-white/10">.glb</code> ou <code className="bg-white/10 px-1 py-0.5 rounded border border-white/10">.gltf</code> dans le dossier <code className="bg-white/10 px-1 py-0.5 rounded border border-white/10">public/models/</code> de votre projet sous le nom <code className="bg-white/10 px-1 py-0.5 rounded border border-white/10">face.glb</code> et décommentez le composant <code className="text-[#D4AF37]">CustomFaceGLB</code> dans <code className="text-[#D4AF37]">Face3DViewer.tsx</code>.
          </p>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 1, 4], fov: 40 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-3, 3, 2]} intensity={0.3} color="#D4AF37" />
          <pointLight position={[0, 2, 3]} intensity={0.5} color="#0EA5E9" />

          {/* Environment for reflections */}
          <Environment preset="studio" />

          {/* Face mesh (Fallback procedural or Custom) */}
          <ProceduralFace />

          {/* Contact shadow */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={4}
            blur={2}
            far={4}
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
        </Suspense>
      </Canvas>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 py-1.5 px-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/40 text-[10px] whitespace-nowrap shadow-lg">
        <span className="flex items-center gap-1">🖱️ Glisser = Tourner</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="flex items-center gap-1">🔍 Molette = Zoomer</span>
      </div>

      {/* Gold border glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        boxShadow: 'inset 0 0 40px rgba(212,175,55,0.03)',
        border: '1px solid rgba(212,175,55,0.08)',
      }} />
    </div>
  );
}
