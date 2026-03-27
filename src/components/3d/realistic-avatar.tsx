/**
 * Avatar 3D Réaliste pour Traduction LSF
 * Corps humanoïde animé avec gestes en temps réel
 */

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GestureData } from '../../lib/services/sign-language.service';

interface RealisticAvatarProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  scale?: number;
  position?: [number, number, number];
}

/**
 * Corps principal du avatar
 */
const AvatarBodyComponent: React.FC<{
  gestures: GestureData[];
  isAnimating: boolean;
  onGestureComplete?: () => void;
}> = ({ gestures, isAnimating, onGestureComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [gestureTime, setGestureTime] = useState(0);

  const parts = useRef<{ [key: string]: THREE.Object3D }>({});

  // Matériaux réalistes
  const materials = useMemo(() => ({
    skin: new THREE.MeshPhysicalMaterial({
      color: 0xFFDBB4,
      roughness: 0.4,
      metalness: 0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.5,
    }),
    clothes: new THREE.MeshPhysicalMaterial({
      color: 0x1e40af,
      roughness: 0.6,
      metalness: 0.05,
    }),
    hair: new THREE.MeshPhysicalMaterial({
      color: 0x3d2817,
      roughness: 0.7,
      metalness: 0.02,
    }),
  }), []);

  // Construire le corps une seule fois
  useEffect(() => {
    if (!groupRef.current || Object.keys(parts.current).length > 0) return;

    // TÊTE
    const headGeometry = new THREE.IcosahedronGeometry(0.3, 8);
    const head = new THREE.Mesh(headGeometry, materials.skin);
    head.position.y = 1.8;
    head.castShadow = true;
    head.receiveShadow = true;
    groupRef.current.add(head);
    parts.current.head = head;

    // CHEVEUX
    const hairGeometry = new THREE.IcosahedronGeometry(0.32, 6);
    const hair = new THREE.Mesh(hairGeometry, materials.hair);
    hair.position.y = 1.85;
    hair.scale.set(1, 1.1, 1);
    groupRef.current.add(hair);

    // YEUX
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, clearcoat: 1 });
    
    const eyeL = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeL.position.set(-0.12, 1.85, 0.25);
    groupRef.current.add(eyeL);

    const irisL = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshPhysicalMaterial({ color: 0x5d4033 })
    );
    irisL.position.set(-0.12, 1.85, 0.32);
    groupRef.current.add(irisL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.12;
    groupRef.current.add(eyeR);

    const irisR = irisL.clone();
    irisR.position.x = 0.12;
    groupRef.current.add(irisR);

    // TORSE
    const torsoGeometry = new THREE.CylinderGeometry(0.28, 0.27, 0.7, 16);
    const torso = new THREE.Mesh(torsoGeometry, materials.clothes);
    torso.position.y = 0.55;
    torso.castShadow = true;
    torso.receiveShadow = true;
    groupRef.current.add(torso);
    parts.current.torso = torso;

    // ÉPAULES
    const shouldersGeometry = new THREE.BoxGeometry(0.6, 0.12, 0.2);
    const shoulders = new THREE.Mesh(shouldersGeometry, materials.clothes);
    shoulders.position.y = 1.05;
    shoulders.castShadow = true;
    groupRef.current.add(shoulders);

    // BRAS GAUCHE
    const leftArm = createArm(materials, -1);
    groupRef.current.add(leftArm);
    parts.current.leftArm = leftArm;

    // BRAS DROIT
    const rightArm = createArm(materials, 1);
    groupRef.current.add(rightArm);
    parts.current.rightArm = rightArm;

    // JAMBES
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.11, 0.8, 12);
    const leftLeg = new THREE.Mesh(legGeometry, materials.clothes);
    leftLeg.position.set(-0.15, -0.45, 0);
    leftLeg.castShadow = true;
    groupRef.current.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, materials.clothes);
    rightLeg.position.set(0.15, -0.45, 0);
    rightLeg.castShadow = true;
    groupRef.current.add(rightLeg);

    // PIEDS
    const footGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.22);
    const footMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2d2d2d });

    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.15, -1.25, 0.03);
    groupRef.current.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.15, -1.25, 0.03);
    groupRef.current.add(rightFoot);

    // Enable shadows
    groupRef.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [materials]);

  // Animation loop
  useFrame(() => {
    if (!isAnimating || gestures.length === 0 || !groupRef.current) return;

    const gesture = gestures[currentGestureIndex];
    const duration = gesture.movement.duration;
    let newTime = gestureTime + 16;

    if (newTime > duration + 200) {
      newTime = 0;
      const nextIndex = (currentGestureIndex + 1) % gestures.length;
      setCurrentGestureIndex(nextIndex);
      if (nextIndex === 0) {
        onGestureComplete?.();
      }
    }

    setGestureTime(newTime);

    // Animate gesture
    const progress = Math.min(newTime / duration, 1);
    applyGestureAnimation(parts.current, gesture, progress);
  });

  return <group ref={groupRef} />;
};

/**
 * Create arm with hand
 */
function createArm(materials: { [key: string]: THREE.Material }, side: number) {
  const armGroup = new THREE.Group();

  // Upper arm
  const upperArmGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.55, 12);
  const upperArm = new THREE.Mesh(upperArmGeom, materials.clothes);
  upperArm.position.set(side * 0.35, 0.8, 0);
  upperArm.castShadow = true;
  armGroup.add(upperArm);

  // Forearm
  const forearmGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 12);
  const forearm = new THREE.Mesh(forearmGeom, materials.skin);
  forearm.position.set(side * 0.42, 0.25, 0);
  forearm.castShadow = true;
  armGroup.add(forearm);

  // Hand group
  const handGroup = new THREE.Group();
  handGroup.position.set(side * 0.48, -0.05, 0);
  handGroup.name = side > 0 ? 'rightHand' : 'leftHand';

  // Palm
  const palmGeom = new THREE.BoxGeometry(0.1, 0.07, 0.12);
  const palm = new THREE.Mesh(palmGeom, materials.skin);
  handGroup.add(palm);

  // Fingers
  const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  fingerNames.forEach((name, i) => {
    const fingerGeom = new THREE.BoxGeometry(0.02, 0.03 - i * 0.005, 0.02);
    const finger = new THREE.Mesh(fingerGeom, materials.skin);
    finger.position.set((i - 2) * 0.025, 0.05, 0);
    finger.castShadow = true;
    finger.name = name;
    handGroup.add(finger);
  });

  armGroup.add(handGroup);
  armGroup.name = side > 0 ? 'rightArm' : 'leftArm';

  return armGroup;
}

/**
 * Apply gesture animation
 */
function applyGestureAnimation(parts: { [key: string]: THREE.Object3D }, gesture: GestureData, progress: number) {
  const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

  // Head
  const head = parts.head as THREE.Mesh | undefined;
  if (head && gesture.movement.headTilt) {
    head.rotation.z = THREE.MathUtils.lerp(0, gesture.movement.headTilt, ease);
  }

  // Torso
  const torso = parts.torso as THREE.Mesh | undefined;
  if (torso && gesture.movement.bodyRotation) {
    torso.rotation.y = THREE.MathUtils.lerp(0, gesture.movement.bodyRotation, ease);
  }

  // Arms and hands
  gesture.movement.hands.forEach((handGesture) => {
    const armName = handGesture.hand === 'right' ? 'rightArm' : 'leftArm';
    const arm = parts[armName] as THREE.Group | undefined;
    if (!arm) return;

    const side = handGesture.hand === 'right' ? 1 : -1;

    arm.position.x = THREE.MathUtils.lerp(side * 0.35, side * handGesture.position.x, ease);
    arm.position.y = THREE.MathUtils.lerp(0.8, 0.8 + handGesture.position.y, ease);
    arm.position.z = THREE.MathUtils.lerp(0, handGesture.position.z, ease);

    arm.rotation.x = THREE.MathUtils.lerp(0, handGesture.rotation.x * 0.5, ease);
    arm.rotation.y = THREE.MathUtils.lerp(0, handGesture.rotation.y * 0.5, ease);
    arm.rotation.z = THREE.MathUtils.lerp(0, handGesture.rotation.z * 0.5, ease);

    // Finger animation
    const hand = arm.children[2] as THREE.Group | undefined;
    if (hand) {
      handGesture.fingers.forEach((finger) => {
        const fingerMesh = hand.children.find((f) => f.name === finger.finger) as THREE.Mesh | undefined;
        if (fingerMesh) {
          fingerMesh.rotation.x = THREE.MathUtils.lerp(0, finger.curled * 0.5, ease);
        }
      });
    }
  });
}

/**
 * Main RealisticAvatar component
 */
export const RealisticAvatar: React.FC<RealisticAvatarProps> = ({
  gestures,
  isAnimating = true,
  onGestureComplete,
}: RealisticAvatarProps) => {
  return (
    <AvatarBodyComponent
      gestures={gestures}
      isAnimating={isAnimating}
      onGestureComplete={onGestureComplete}
    />
  );
};

export default RealisticAvatar;
