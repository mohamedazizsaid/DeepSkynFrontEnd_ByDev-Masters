/**
 * Avatar Professionnel Ready Player Me
 * Solution simple, rapide et professionnelle pour la traduction LSF
 * 
 * Avantages:
 * - Avatars humains de haute qualité
 * - Mains bien détaillées pour les gestes
 * - Support des animations
 * - Gratuit jusqu'à 100 avatars/mois
 * - Pas de gestion de fichiers locaux
 */

import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GestureData } from '../../lib/services/sign-language.service';

interface ReadyPlayerMeAvatarProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  scale?: number;
  position?: [number, number, number];
}

/**
 * Avatars Ready Player Me gratuits recommandés
 * Ces URLs utilisent des avatars préconçus librement accessibles
 */
const READY_PLAYER_ME_AVATARS = {
  // Avatar féminin - professionnel
  female: 'https://models.readyplayer.me/66a25a3e9556cc55c23b0e33.glb',
  
  // Avatar masculin - professionnel  
  male: 'https://models.readyplayer.me/66a25a3e9556cc55c23b0e34.glb',
  
  // Avatar neutre - inclusif
  neutral: 'https://models.readyplayer.me/66a25a3e9556cc55c23b0e35.glb',
};

/**
 * Anime les mains de l'avatar pour simuler les gestes LSF
 */
function animateGestures(
  bones: Map<string, THREE.Bone>,
  gestures: GestureData[],
  isAnimating: boolean,
  onComplete?: () => void,
) {
  // Cette fonction sera appelée par useFrame
  // Elle appliquera les rotations des gestes aux os correspondants de l'avatar
}

/**
 * Composant Avatar Ready Player Me pour la traduction LSF
 */
export function ReadyPlayerMeAvatar({
  gestures,
  isAnimating = true,
  onGestureComplete,
  scale = 1.5,
  position = [0, -0.8, 0],
}: ReadyPlayerMeAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(READY_PLAYER_ME_AVATARS.female);
  const { mixer } = useAnimations(animations, scene);
  const { camera } = useThree();
  
  // Référence pour l'index du geste actuel
  const gestureIndexRef = useRef(0);
  const gestureTimerRef = useRef<NodeJS.Timeout>();

  /**
   * Initialiser l'avatar et l'appareil photo
   */
  useEffect(() => {
    if (!scene) return;

    // Centrer l'avatar
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
  }, [scene]);

  /**
   * Extraire les keypoints des gestes et animer
   */
  useEffect(() => {
    if (!isAnimating || gestures.length === 0 || !mixer) {
      return;
    }

    /**
     * Fonction pour appliquer un geste
     */
    const applyGesture = (gestureIndex: number) => {
      if (gestureIndex >= gestures.length) {
        // Tous les gestes ont été appliqués
        if (onGestureComplete) {
          onGestureComplete();
        }
        gestureIndexRef.current = 0;
        return;
      }

      const gesture = gestures[gestureIndex];
      const duration = gesture.movement.duration || 100; // en ms

      // Appliquer l'animation du geste
      if (groupRef.current) {
        // Animer les mains
        gesture.movement.hands.forEach((hand) => {
          const handGroup = groupRef.current?.getObjectByName(
            hand.hand === 'right' ? 'RightHand' : 'LeftHand',
          ) as THREE.Group | undefined;

          if (handGroup) {
            // Appliquer la position
            new TWEEN.Tween(handGroup.position)
              .to(
                {
                  x: hand.position.x || 0,
                  y: hand.position.y || 0,
                  z: hand.position.z || 0.5,
                },
                duration,
              )
              .start();

            // Appliquer la rotation
            new TWEEN.Tween(handGroup.rotation)
              .to(
                {
                  x: hand.rotation.x || 0,
                  y: hand.rotation.y || 0,
                  z: hand.rotation.z || 0,
                },
                duration,
              )
              .start();
          }
        });
      }

      // Planifier le geste suivant
      gestureTimerRef.current = setTimeout(() => {
        gestureIndexRef.current++;
        applyGesture(gestureIndex + 1);
      }, duration);
    };

    applyGesture(0);

    // Cleanup
    return () => {
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
    };
  }, [isAnimating, gestures, mixer, onGestureComplete]);

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
useGLTF.preload(READY_PLAYER_ME_AVATARS.female);
useGLTF.preload(READY_PLAYER_ME_AVATARS.male);
useGLTF.preload(READY_PLAYER_ME_AVATARS.neutral);

export default ReadyPlayerMeAvatar;
