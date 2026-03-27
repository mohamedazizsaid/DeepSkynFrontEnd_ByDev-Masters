/**
 * Avatar Personnalisé de l'Utilisateur
 * Utilise les modèles 3D existants
 * 
 * Fichiers disponibles:
 * - homme.glb (Avatar masculin)
 * - femme.glb (Avatar féminin)
 * - face.glb (Avatar du visage)
 */

import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GestureData } from '../../lib/services/sign-language.service';

interface UserAvatarProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  scale?: number;
  position?: [number, number, number];
  avatarType?: 'homme' | 'femme' | 'face'; // Type d'avatar
}

/**
 * Chemin vers les avatars de l'utilisateur
 */
const USER_AVATARS = {
  homme: '/models/homme.glb',
  femme: '/models/femme.glb',
  face: '/models/face.glb',
};

/**
 * Composant Avatar Personnalisé
 * Utilise les modèles 3D de l'utilisateur
 */
export function UserAvatar({
  gestures,
  isAnimating = true,
  onGestureComplete,
  scale = 1.2,
  position = [0, -0.8, 0],
  avatarType = 'femme', // Avatar par défaut
}: UserAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const avatarPath = USER_AVATARS[avatarType];
  
  const { scene, animations } = useGLTF(avatarPath);
  const { mixer } = useAnimations(animations, scene);
  
  const gestureIndexRef = useRef(0);
  const gestureTimerRef = useRef<NodeJS.Timeout>();

  /**
   * Initialiser l'avatar
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

    console.log(`Avatar "${avatarType}" chargé:`, {
      meshes: scene.children.length,
      animations: animations.length,
      animationNames: animations.map((a) => a.name),
    });
  }, [scene, animations, avatarType]);

  /**
   * Animer les gestes
   */
  useEffect(() => {
    if (!isAnimating || gestures.length === 0 || !mixer) {
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
      const duration = gesture.movement.duration || 100; // en ms

      // Si des animations sont disponibles, les jouer
      if (animations && animations.length > 0) {
        const animationIndex = index % animations.length;
        const animationClip = animations[animationIndex];

        if (mixer && animationClip) {
          // Arrêter les actions précédentes
          mixer.stopAllAction();

          // Créer et jouer la nouvelle action
          const action = mixer.clipAction(animationClip);
          action.reset();
          action.loop = THREE.LoopOnce;
          action.clampWhenFinished = false;
          action.play();

          console.log(`Geste ${index + 1}/${gestures.length}: ${animationClip.name}`);
        }
      } else {
        // Pas d'animations: appliquer les transformations du geste
        if (groupRef.current) {
          // Appliquer la position du geste
          groupRef.current.position.set(
            gesture.movement.hands[0]?.position.x || 0,
            gesture.movement.hands[0]?.position.y || 0,
            gesture.movement.hands[0]?.position.z || 0,
          );

          // Appliquer la rotation du corps
          if (gesture.movement.bodyRotation) {
            groupRef.current.rotation.y = gesture.movement.bodyRotation;
          }
        }
      }

      // Planifier le geste suivant
      gestureTimerRef.current = setTimeout(() => {
        playGesture(index + 1);
      }, duration + 50);
    };

    playGesture(0);

    // Cleanup
    return () => {
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
      if (mixer) {
        mixer.stopAllAction();
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
 * Précharger tous les avatars pour une meilleure performance
 */
Object.values(USER_AVATARS).forEach((path) => {
  useGLTF.preload(path);
});

export default UserAvatar;
