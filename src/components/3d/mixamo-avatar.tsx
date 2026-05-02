/**
 * Avatar Mixamo pour la traduction LSF
 * 
 * Étapes pour utiliser Mixamo:
 * 1. Allez sur https://www.mixamo.com/
 * 2. Choisissez un avatar (ex: "Aj", "Mery", "Remy")
 * 3. Cliquez "Download"
 * 4. Format: GLB
 * 5. Placez le fichier dans public/models/mixamo-avatar.glb
 * 
 * Avantages:
 * - Qualité très élevée
 * - 3000+ animations pré-faites
 * - Support excellent du rigging
 * - Facile à animer
 */

import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GestureData } from '../../lib/services/sign-language.service';

interface MixamoAvatarProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  scale?: number;
  position?: [number, number, number];
  avatarPath?: string; // Chemin personnalisé vers le modèle
}

/**
 * Composant Avatar Mixamo pour la traduction LSF
 */
export function MixamoAvatar({
  gestures,
  isAnimating = true,
  onGestureComplete,
  scale = 1.2,
  position = [0, -1.2, 0],
  avatarPath = '/models/mixamo-avatar.glb',
}: MixamoAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(avatarPath);
  const { mixer } = useAnimations(animations, scene);
  
  const gestureIndexRef = useRef(0);
  const gestureTimerRef = useRef<NodeJS.Timeout>();
  const [currentActionRef] = useState({ action: null as THREE.AnimationAction | null });

  /**
   * Initialiser l'avatar
   */
  useEffect(() => {
    if (!scene) return;

    // Centrer et cadrer
    const bbox = new THREE.Box3().setFromObject(scene);
    const center = bbox.getCenter(new THREE.Vector3());
    scene.position.sub(center);

    // Ajouter les ombres
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    return () => {
      if (currentActionRef.action) {
        mixer?.uncacheAction(currentActionRef.action.getClip());
      }
    };
  }, [scene, mixer]);

  /**
   * Jouer les animations correspondant aux gestes
   */
  useEffect(() => {
    if (!isAnimating || gestures.length === 0 || !mixer || !animations.length) {
      return;
    }

    const playGesture = (index: number) => {
      if (index >= gestures.length) {
        // Fin de la séquence
        if (onGestureComplete) {
          onGestureComplete();
        }
        gestureIndexRef.current = 0;
        return;
      }

      const gesture = gestures[index];
      const duration = gesture.movement.duration || 500; // en ms

      // Trouver une animation appropriée
      // Pour une meilleure expérience, mapper les gestes aux animations Mixamo
      const animationClip = animations[index % animations.length];

      // Éviter de jouer la même animation deux fois
      if (currentActionRef.action) {
        currentActionRef.action.stop();
      }

      const action = mixer.clipAction(animationClip);
      action.reset();
      action.clampWhenFinished = false;
      action.loop = THREE.LoopOnce;
      action.play();

      currentActionRef.action = action;

      // Planifier le prochain geste
      gestureTimerRef.current = setTimeout(() => {
        playGesture(index + 1);
      }, duration);
    };

    playGesture(0);

    return () => {
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
      if (currentActionRef.action) {
        currentActionRef.action.stop();
      }
    };
  }, [isAnimating, gestures, mixer, animations, onGestureComplete]);

  /**
   * Mettre à jour les animations chaque frame
   */
  useFrame((_state, delta) => {
    if (mixer && isAnimating) {
      mixer.update(delta);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * Précharger l'avatar pour une meilleure performance
 */
useGLTF.preload('/models/mixamo-avatar.glb');

export default MixamoAvatar;
