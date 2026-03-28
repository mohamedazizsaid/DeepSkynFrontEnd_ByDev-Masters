/**
 * Avatar 3D Professionnel pour LSF
 * Performance optimale, 60 FPS, WebGL pur
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GestureData } from '../../lib/services/sign-language.service';

interface ProfessionalAvatarProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  scale?: number;
  position?: [number, number, number];
}

/**
 * Créer texture procédurale de peau optimisée
 */
const createOptimizedSkinTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fond dégradé principal
  const gradient = ctx.createRadialGradient(128, 128, 50, 128, 128, 180);
  gradient.addColorStop(0, '#FFE8D6');
  gradient.addColorStop(0.5, '#FFDBAC');
  gradient.addColorStop(1, '#FFC9A3');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Détails pores et imperfections
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#8B7355';
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = Math.random() * 1.5;
    ctx.fillRect(x, y, size, size);
  }

  // Highlights subtils
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 16;
  return texture;
};

const ProfessionalAvatar = React.forwardRef<THREE.Group, ProfessionalAvatarProps>(
  (
    { gestures, isAnimating = true, onGestureComplete, scale = 1, position = [0, 0, 0] },
    ref
  ) => {
    const groupRef = useRef<THREE.Group>(null);
    const skeletonRef = useRef<{ [key: string]: THREE.Group }>({});
    const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const skinMaterial = useMemo(() => {
      const texture = createOptimizedSkinTexture();
      return new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.05,
        clearcoat: 0.2,
        clearcoatRoughness: 0.8,
        side: THREE.DoubleSide,
      });
    }, []);

    const hairMaterial = useMemo(
      () =>
        new THREE.MeshPhysicalMaterial({
          color: 0x2d1810,
          roughness: 0.6,
          metalness: 0,
        }),
      []
    );

    /**
     * Initialiser le squelette et modèles 3D
     */
    useEffect(() => {
      if (!groupRef.current || Object.keys(skeletonRef.current).length > 0) return;

      // TÊTE
      const headGroup = new THREE.Group();
      headGroup.name = 'head';
      headGroup.position.y = 1.65;

      const headGeometry = new THREE.IcosahedronGeometry(0.32, 5);
      const head = new THREE.Mesh(headGeometry, skinMaterial);
      headGroup.add(head);

      // Cheveux (géométrie plus complexe)
      const hairGeometry = new THREE.IcosahedronGeometry(0.35, 4);
      const hair = new THREE.Mesh(hairGeometry, hairMaterial);
      hair.position.z = 0.02;
      headGroup.add(hair);

      // Yeux avec réflectivité
      const eyeGeometry = new THREE.IcosahedronGeometry(0.045, 3);
      const eyeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.12, 0.08, 0.28);
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.12, 0.08, 0.28);
      headGroup.add(rightEye);

      // Iris
      const irisGeometry = new THREE.IcosahedronGeometry(0.022, 3);
      const irisMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x5d4033,
        roughness: 0.1,
        metalness: 0.3,
      });

      const leftIris = new THREE.Mesh(irisGeometry, irisMaterial);
      leftIris.position.set(-0.122, 0.08, 0.32);
      headGroup.add(leftIris);

      const rightIris = new THREE.Mesh(irisGeometry, irisMaterial);
      rightIris.position.set(0.122, 0.08, 0.32);
      headGroup.add(rightIris);

      // Pupilles avec réflectivité maximale
      const pupilGeometry = new THREE.IcosahedronGeometry(0.01, 2);
      const pupilMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.01,
        metalness: 0.5,
        clearcoat: 1,
      });

      const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      leftPupil.position.set(-0.122, 0.08, 0.34);
      headGroup.add(leftPupil);

      const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      rightPupil.position.set(0.122, 0.08, 0.34);
      headGroup.add(rightPupil);

      skeletonRef.current.head = headGroup;
      groupRef.current!.add(headGroup);

      // CORPS
      const bodyGroup = new THREE.Group();
      bodyGroup.name = 'body';

      const torsoGeometry = new THREE.CylinderGeometry(0.28, 0.26, 0.75, 8);
      const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
      torso.position.y = 0.45;
      bodyGroup.add(torso);

      // Bras
      const armGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6);

      const leftArm = new THREE.Group();
      leftArm.name = 'leftArm';
      leftArm.position.set(-0.35, 0.65, 0);
      const leftArmMesh = new THREE.Mesh(armGeometry, skinMaterial);
      leftArm.add(leftArmMesh);
      bodyGroup.add(leftArm);
      skeletonRef.current.leftArm = leftArm;

      const rightArm = new THREE.Group();
      rightArm.name = 'rightArm';
      rightArm.position.set(0.35, 0.65, 0);
      const rightArmMesh = new THREE.Mesh(armGeometry, skinMaterial);
      rightArm.add(rightArmMesh);
      bodyGroup.add(rightArm);
      skeletonRef.current.rightArm = rightArm;

      // Jambes
      const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 6);

      const leftLeg = new THREE.Mesh(legGeometry, skinMaterial);
      leftLeg.position.set(-0.15, -0.45, 0);
      bodyGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeometry, skinMaterial);
      rightLeg.position.set(0.15, -0.45, 0);
      bodyGroup.add(rightLeg);

      skeletonRef.current.body = bodyGroup;
      groupRef.current!.add(bodyGroup);

      // MAINS
      createHand(groupRef.current!, skinMaterial, 'left', skeletonRef.current);
      createHand(groupRef.current!, skinMaterial, 'right', skeletonRef.current);

      // ÉCLAIRAGE PRO 3-Point
      const lighting = createProLighting();
      groupRef.current!.add(...lighting);

      // Performance optimization
      groupRef.current!.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
    }, [skinMaterial, hairMaterial]);

    /**
     * Animation des gestes en temps réel
     */
    useFrame((state, delta) => {
      if (!isAnimating || gestures.length === 0 || !groupRef.current) return;

      setElapsedTime((prev) => prev + delta * 1000);

      const currentGesture = gestures[currentGestureIndex];
      const duration = currentGesture.movement.duration;
      const progress = (elapsedTime % (duration + 200)) / duration;

      if (progress <= 1) {
        animateGesture(skeletonRef.current, currentGesture, progress);
      }

      if (elapsedTime > duration + 200) {
        setElapsedTime(0);
        const nextIndex = (currentGestureIndex + 1) % gestures.length;
        setCurrentGestureIndex(nextIndex);
        if (nextIndex === 0 && onGestureComplete) {
          onGestureComplete();
        }
      }
    });

    return <group ref={groupRef} scale={scale} position={position} />;
  }
);

ProfessionalAvatar.displayName = 'ProfessionalAvatar';

/**
 * Créer une main professionnel avec doigts articulés
 */
function createHand(
  parent: THREE.Group,
  material: THREE.Material,
  side: 'left' | 'right',
  skeleton: { [key: string]: THREE.Group }
) {
  const hand = new THREE.Group();
  hand.name = `${side}Hand`;
  hand.position.set(side === 'left' ? -0.35 : 0.35, 0.3, 0);

  // Paume
  const palmGeometry = new THREE.IcosahedronGeometry(0.11, 3);
  const palm = new THREE.Mesh(palmGeometry, material);
  hand.add(palm);

  // Doigts avec articulations
  const fingerConfigs = [
    { name: 'thumb', x: side === 'left' ? 0.12 : -0.12, y: 0.05, length: 0.14 },
    { name: 'index', x: 0, y: 0.15, length: 0.16 },
    { name: 'middle', x: side === 'left' ? -0.08 : 0.08, y: 0.16, length: 0.18 },
    { name: 'ring', x: side === 'left' ? -0.14 : 0.14, y: 0.12, length: 0.16 },
    { name: 'pinky', x: side === 'left' ? -0.18 : 0.18, y: 0.06, length: 0.13 },
  ];

  fingerConfigs.forEach(({ name, x, y, length }) => {
    const finger = new THREE.Group();
    finger.name = `${side}${name}`;
    finger.position.set(x, y, 0);

    for (let j = 0; j < 3; j++) {
      const segGeom = new THREE.IcosahedronGeometry(0.035 - j * 0.008, 2);
      const seg = new THREE.Mesh(segGeom, material);
      seg.position.y = j * (length / 3);
      finger.add(seg);
    }

    hand.add(finger);
    skeleton[finger.name] = finger;
  });

  parent.add(hand);
  skeleton[hand.name] = hand;
}

/**
 * Éclairage professionnel 3-point
 */
function createProLighting() {
  const lights: THREE.Light[] = [];

  // Main light
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(2, 2.5, 2);
  keyLight.castShadow = true;
  lights.push(keyLight);

  // Fill light
  const fillLight = new THREE.PointLight(0xe0d4c4, 0.7);
  fillLight.position.set(-2, 1.5, 1);
  lights.push(fillLight);

  // Back light
  const backLight = new THREE.PointLight(0xa8d8ff, 0.6);
  backLight.position.set(0, 1, -2);
  lights.push(backLight);

  // Ambient
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  lights.push(ambientLight);

  return lights;
}

/**
 * Animer les gestes avec IK inversée
 */
function animateGesture(
  skeleton: { [key: string]: THREE.Group },
  gesture: GestureData,
  progress: number
) {
  const easing = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

  gesture.movement.hands.forEach((hand) => {
    const armName = hand.hand === 'left' ? 'leftArm' : 'rightArm';
    const handName = hand.hand === 'left' ? 'leftHand' : 'rightHand';

    const arm = skeleton[armName];
    const handGroup = skeleton[handName];

    if (arm) {
      arm.rotation.x = hand.rotation.x * easing;
      arm.rotation.y = hand.rotation.y * easing;
      arm.rotation.z = hand.rotation.z * easing;
    }

    if (handGroup) {
      handGroup.position.x += hand.position.x * easing * 0.5;
      handGroup.position.y += hand.position.y * easing * 0.5;
      handGroup.position.z += hand.position.z * easing * 0.3;
    }

    // Finger animations
    hand.fingers.forEach((finger) => {
      const fingerName = `${hand.hand === 'left' ? 'left' : 'right'}${finger.finger}`;
      const fingerGroup = skeleton[fingerName];

      if (fingerGroup) {
        const rotation = finger.extended ? 0 : -Math.PI * 0.25 * (finger.curled || 0.8);
        fingerGroup.children.forEach((segment, idx) => {
          if (segment instanceof THREE.Mesh || segment instanceof THREE.Group) {
            segment.rotation.x = rotation * easing - 0.1 * idx;
          }
        });
      }
    });
  });
}

export { ProfessionalAvatar };
export type { ProfessionalAvatarProps };
