/**
 * Avatar Canvas avec vos modèles 3D personnalisés
 * Version simplifiée et robuste
 */

import React, { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { GestureData } from '../../lib/services/sign-language.service';

interface SignLanguageAvatarCanvasProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  width?: number | string;
  height?: number | string;
  showControls?: boolean;
  avatarType?: 'homme' | 'femme' | 'face';
}

/**
 * Fallback loader pendant le chargement de l'avatar
 */
const AvatarFallback = () => (
  <mesh position={[0, 0, 0]}>
    <sphereGeometry args={[1, 32, 32]} />
    <meshPhongMaterial color={0x4f46e5} wireframe={false} />
  </mesh>
);

/**
 * Composant Avatar qui charge les modèles personnalisés
 */
function CustomAvatar({
  gestures,
  isAnimating = true,
  onGestureComplete,
  avatarType = 'femme',
}: Omit<SignLanguageAvatarCanvasProps, 'width' | 'height' | 'showControls'>) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const gestureTimerRef = useRef<NodeJS.Timeout>();

  // Charger le modèle 3D personnalisé
  const avatarPath = {
    homme: '/models/homme.glb',
    femme: '/models/femme.glb',
    face: '/models/face.glb',
  }[avatarType];

  const { scene } = useGLTF(avatarPath);

  // On n'utilise plus useAnimations car le GLB n'a pas d'animations

  // Initialiser l'avatar à la première charge
  useEffect(() => {
    if (!scene) return;

    console.log(`[Avatar] Chargement du modèle: ${avatarPath}`);

    // Centrer et positionner l'avatar
    const bbox = new THREE.Box3().setFromObject(scene);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    
    console.log(`[Avatar] Taille du modèle:`, size);
    
    scene.position.sub(center);

    // Activer les ombres
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
  }, [scene, avatarPath]);

  // Jouer les gestes en séquence
  useEffect(() => {
    if (!isAnimating) {
      console.log('[Avatar] Animation désactivée');
      return;
    }

    if (gestures.length === 0) {
      console.log('[Avatar] Pas de gestes à jouer');
      return;
    }

    console.log(`[Avatar] Démarrage de ${gestures.length} gestes`);

    const playNextGesture = (index: number) => {
      if (index >= gestures.length) {
        console.log('[Avatar] Tous les gestes joués');
        setCurrentGestureIndex(0);
        if (onGestureComplete) onGestureComplete();
        return;
      }

      setCurrentGestureIndex(index);
      const gesture = gestures[index];
      const duration = gesture.movement?.duration || 500;

      console.log(`[Avatar] Geste ${index + 1}/${gestures.length} - Durée: ${duration}ms`);

      // Planifier le prochain geste
      gestureTimerRef.current = setTimeout(() => {
        playNextGesture(index + 1);
      }, duration);
    };

    playNextGesture(0);

    return () => {
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    };
  }, [isAnimating, gestures, onGestureComplete]);

  // Animation dans useFrame - Gestes significatifs basés sur les vraies données
  useFrame((_state, delta) => {
    if (!isAnimating || !groupRef.current || gestures.length === 0) return;

    const currentGesture = gestures[currentGestureIndex];
    if (!currentGesture) return;

    const model = groupRef.current.children[0];
    if (!model) return;

    // Appliquer la rotation du corps du geste
    if (currentGesture.movement?.bodyRotation !== undefined) {
      groupRef.current.rotation.y = currentGesture.movement.bodyRotation * 0.5;
    }

    // Animer chaque main vers sa position réelle définie dans le geste
    if (currentGesture.hands && currentGesture.hands.length > 0) {
      currentGesture.hands.forEach((hand) => {
        // Chercher tous les enfants qui correspondent au bras/main
        let found = false;
        
        model.traverse((child: any) => {
          const childNameLower = child.name?.toLowerCase() || '';
          const handSide = hand.hand === 'right' ? 'right' : 'left';
          
          // Chercher les os du bras correspondant
          if (childNameLower.includes(handSide) && 
              (childNameLower.includes('arm') || childNameLower.includes('hand'))) {
            found = true;
            
            // Déplacer vers la position cible avec interpolation smooth
            if (hand.position) {
              const targetX = hand.position.x * 0.6;
              const targetY = hand.position.y * 0.6;
              const targetZ = hand.position.z * 0.6;

              child.position.x += (targetX - child.position.x) * delta * 8;
              child.position.y += (targetY - child.position.y) * delta * 8;
              child.position.z += (targetZ - child.position.z) * delta * 8;
            }

            // Appliquer la rotation de la main/poignet
            if (hand.rotation) {
              child.rotation.x += (hand.rotation.x - child.rotation.x) * delta * 5;
              child.rotation.y += (hand.rotation.y - child.rotation.y) * delta * 5;
              child.rotation.z += (hand.rotation.z - child.rotation.z) * delta * 5;
            }
          }
        });

        // Si on trouve pas le bras exact, animer au moins les os armature
        if (!found) {
          model.traverse((child: any) => {
            const childNameLower = child.name?.toLowerCase() || '';
            const handSide = hand.hand === 'right' ? 'right' : 'left';
            
            if (childNameLower.includes('armature') && childNameLower.includes(handSide)) {
              if (hand.position) {
                const targetX = hand.position.x * 0.4;
                const targetY = hand.position.y * 0.4;
                const targetZ = hand.position.z * 0.4;

                child.position.x += (targetX - child.position.x) * delta * 6;
                child.position.y += (targetY - child.position.y) * delta * 6;
                child.position.z += (targetZ - child.position.z) * delta * 6;
              }
            }
          });
        }
      });
    }

    // Animer la tête si info disponible
    if (currentGesture.movement?.headTilt !== undefined && currentGesture.movement.headTilt !== 0) {
      model.traverse((child: any) => {
        if (child.name?.toLowerCase().includes('head')) {
          child.rotation.z += (currentGesture.movement.headTilt! - child.rotation.z) * delta * 3;
        }
      });
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={[0, -0.5, 0]} 
      scale={2.0}
    >
      <primitive object={scene} />
    </group>
  );
}

// Précharger les avatars
useGLTF.preload('/models/homme.glb');
useGLTF.preload('/models/femme.glb');
useGLTF.preload('/models/face.glb');

/**
 * Canvas principal pour afficher l'avatar
 */
export function SignLanguageAvatarCanvas({
  gestures,
  isAnimating = true,
  onGestureComplete,
  width = '100%',
  height = '500px',
  showControls = false,
  avatarType = 'femme',
}: SignLanguageAvatarCanvasProps) {
  const memoizedGestures = useMemo(() => gestures, [gestures]);

  console.log(`[Canvas] Rerender avec ${memoizedGestures.length} gestes, isAnimating=${isAnimating}`);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: '1rem',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(126,34,206,0.3)',
        position: 'relative',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 2.5], fov: 50 }}
        gl={{
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        } as any}
        performance={{ min: 0.5 }}
        dpr={[1, 2]}
      >
        <Environment preset="studio" intensity={1.2} />
        <PerspectiveCamera makeDefault position={[0, 0.5, 2.5]} fov={50} />

        {showControls && (
          <OrbitControls
            autoRotate
            autoRotateSpeed={2}
            enableZoom={false}
            enablePan={false}
          />
        )}

        <Suspense fallback={<AvatarFallback />}>
          <CustomAvatar
            gestures={memoizedGestures}
            isAnimating={isAnimating}
            onGestureComplete={onGestureComplete}
            avatarType={avatarType}
          />
        </Suspense>

        {/* Sol avec ombres */}
        <mesh position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <shadowMaterial opacity={0.3} />
        </mesh>

        {/* Lumières */}
        <pointLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <pointLight position={[-5, 5, 5]} intensity={0.6} castShadow />
        <ambientLight intensity={0.6} />
      </Canvas>
    </div>
  );
}

export default SignLanguageAvatarCanvas;
