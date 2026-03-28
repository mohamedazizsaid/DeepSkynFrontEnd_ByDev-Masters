/**
 * Composant Avatar 3D pour traduction LSF
 * Avatar procédural haute qualité avec textures réalistes
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GestureData, HandGesture } from '../../lib/services/sign-language.service';

interface SignLanguageAvatarProps {
  gestures: GestureData[];
  isAnimating?: boolean;
  onGestureComplete?: () => void;
  scale?: number;
  position?: [number, number, number];
}

const AvatarGestureMesh = React.forwardRef<THREE.Group, SignLanguageAvatarProps>(
  ({ gestures, isAnimating = true, onGestureComplete, scale = 1, position = [0, 0, 0] }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const leftHandRef = useRef<THREE.Group | null>(null);
    const rightHandRef = useRef<THREE.Group | null>(null);
    const bodyRef = useRef<THREE.Group | null>(null);
    const headRef = useRef<THREE.Group | null>(null);

    const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
    const [gestureProgress, setGestureProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    /**
     * Créer une texture de peau réaliste
     */
    const createSkinTexture = (width: number = 128, height: number = 128) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#FFD7B5');
        gradient.addColorStop(0.5, '#FFDBAC');
        gradient.addColorStop(1, '#FFC9A3');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'rgba(180, 140, 100, 0.1)';
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    };

    /**
     * Créer le géométrie réaliste du corps et tête
     */
    useEffect(() => {
      if (!bodyRef.current && !headRef.current && !leftHandRef.current && !rightHandRef.current && groupRef.current) {
        const skinTexture = createSkinTexture(128, 128);
        const skinMaterial = new THREE.MeshStandardMaterial({
          map: skinTexture,
          roughness: 0.4,
          metalness: 0,
          side: THREE.DoubleSide,
        });

        // CORPS
        const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.7, 16, 32);
        const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
        torso.position.y = 0.5;

        const leftArmGeometry = new THREE.CapsuleGeometry(0.08, 0.65, 8, 16);
        const leftArm = new THREE.Mesh(leftArmGeometry, skinMaterial);
        leftArm.position.set(-0.35, 0.6, 0);

        const rightArmGeometry = new THREE.CapsuleGeometry(0.08, 0.65, 8, 16);
        const rightArm = new THREE.Mesh(rightArmGeometry, skinMaterial);
        rightArm.position.set(0.35, 0.6, 0);

        const leftLegGeometry = new THREE.CapsuleGeometry(0.1, 0.8, 8, 16);
        const leftLeg = new THREE.Mesh(leftLegGeometry, skinMaterial);
        leftLeg.position.set(-0.15, -0.4, 0);

        const rightLegGeometry = new THREE.CapsuleGeometry(0.1, 0.8, 8, 16);
        const rightLeg = new THREE.Mesh(rightLegGeometry, skinMaterial);
        rightLeg.position.set(0.15, -0.4, 0);

        bodyRef.current = new THREE.Group();
        bodyRef.current.add(torso, leftArm, rightArm, leftLeg, rightLeg);

        // TÊTE
        const headTexture = createSkinTexture(128, 128);
        const headMaterial = new THREE.MeshStandardMaterial({
          map: headTexture,
          roughness: 0.35,
          metalness: 0,
          side: THREE.DoubleSide,
        });

        const headGeometry = new THREE.SphereGeometry(0.28, 32, 32);
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6;

        // Cheveux
        const hairGeometry = new THREE.SphereGeometry(0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const hairMaterial = new THREE.MeshStandardMaterial({
          color: 0x3d2817,
          roughness: 0.7,
          metalness: 0,
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0, 1.7, 0.02);

        // Yeux
        const eyeWhiteGeometry = new THREE.SphereGeometry(0.04, 16, 16);
        const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.3,
        });

        const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        leftEyeWhite.position.set(-0.1, 1.68, 0.25);

        const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        rightEyeWhite.position.set(0.1, 1.68, 0.25);

        const irisGeometry = new THREE.SphereGeometry(0.018, 16, 16);
        const irisMaterial = new THREE.MeshStandardMaterial({
          color: 0x6b4423,
          roughness: 0.2,
          metalness: 0.2,
        });

        const leftIris = new THREE.Mesh(irisGeometry, irisMaterial);
        leftIris.position.set(-0.108, 1.68, 0.3);

        const rightIris = new THREE.Mesh(irisGeometry, irisMaterial);
        rightIris.position.set(0.108, 1.68, 0.3);

        const pupilGeometry = new THREE.SphereGeometry(0.008, 16, 16);
        const pupilMaterial = new THREE.MeshStandardMaterial({
          color: 0x000000,
          roughness: 0.05,
        });

        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.108, 1.68, 0.32);

        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.108, 1.68, 0.32);

        // Bouche
        const mouthGeometry = new THREE.BufferGeometry();
        const mouthPoints = [];
        for (let i = 0; i <= 10; i++) {
          const angle = (i / 10) * Math.PI;
          mouthPoints.push(
            Math.cos(angle) * 0.08,
            -Math.sin(angle) * 0.04 - 0.05,
            0.25
          );
        }
        mouthGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mouthPoints), 3));
        const mouthMaterial = new THREE.LineBasicMaterial({ color: 0xc7666a, linewidth: 2 });
        const mouth = new THREE.Line(mouthGeometry, mouthMaterial);
        mouth.position.y = 1.48;

        headRef.current = new THREE.Group();
        headRef.current.add(head, hair, leftEyeWhite, rightEyeWhite, leftIris, rightIris, leftPupil, rightPupil, mouth);

        // MAINS
        createHand(THREE, leftHandRef, -0.4, 0.8, 0xffdbac, skinMaterial);
        createHand(THREE, rightHandRef, 0.4, 0.8, 0xffdbac, skinMaterial);

        // Ajouter au groupe
        groupRef.current.add(bodyRef.current, headRef.current);
        if (leftHandRef.current) groupRef.current.add(leftHandRef.current);
        if (rightHandRef.current) groupRef.current.add(rightHandRef.current);

        // Ajouter les lumières
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        const pointLight1 = new THREE.PointLight(0xffffff, 1.2);
        pointLight1.position.set(2.5, 2, 2);

        const pointLight2 = new THREE.PointLight(0xe0d4c4, 0.6);
        pointLight2.position.set(-1.5, 1.5, 1.5);

        const pointLight3 = new THREE.PointLight(0xa8d8ff, 0.8);
        pointLight3.position.set(0, 1, -2);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 2, 1);

        groupRef.current.add(ambientLight, pointLight1, pointLight2, pointLight3, directionalLight);
      }
    }, []);

    /**
     * Animation des gestes
     */
    useFrame((state, delta) => {
      if (!isAnimating || gestures.length === 0 || !groupRef.current) return;

      setElapsedTime((prev) => prev + delta * 1000);

      const currentGesture = gestures[currentGestureIndex];
      const gestureDuration = currentGesture.movement.duration;
      const progress = (elapsedTime % (gestureDuration + 200)) / gestureDuration;

      setGestureProgress(Math.min(progress, 1));

      // Appliquer les transformations du geste
      applyGestureTransformations(
        currentGesture,
        progress,
        leftHandRef,
        rightHandRef,
        bodyRef,
        headRef
      );

      // Passer au geste suivant
      if (elapsedTime > gestureDuration + 200) {
        setElapsedTime(0);
        const nextIndex = (currentGestureIndex + 1) % gestures.length;
        setCurrentGestureIndex(nextIndex);

        if (nextIndex === 0 && onGestureComplete) {
          onGestureComplete();
        }
      }
    });

    return <group ref={groupRef} scale={scale} position={position} /> as any;
  }
);

AvatarGestureMesh.displayName = 'AvatarGestureMesh';

/**
 * Créer une géométrie main réaliste
 */
function createHand(
  THREE: typeof import('three'),
  handRef: React.MutableRefObject<THREE.Group | null>,
  x: number,
  y: number,
  color: number,
  skinMaterial: THREE.MeshStandardMaterial
) {
  const handGroup = new THREE.Group();

  // Paume
  const palmGeometry = new THREE.SphereGeometry(0.09, 32, 32);
  palmGeometry.scale(1.4, 1.1, 0.9);
  const palm = new THREE.Mesh(palmGeometry, skinMaterial);
  handGroup.add(palm);

  // Doigts réalistes avec 3 articulations
  const fingerConfig = [
    { x: 0, y: 0.2, z: 0.02, name: 'middle', length: 0.16 },
    { x: -0.1, y: 0.18, z: 0, name: 'index', length: 0.14 },
    { x: 0.1, y: 0.18, z: 0, name: 'ring', length: 0.14 },
    { x: -0.15, y: 0.1, z: 0, name: 'pinky', length: 0.12 },
    { x: 0.12, y: 0.05, z: -0.04, name: 'thumb', length: 0.13 },
  ];

  fingerConfig.forEach(({ x: fx, y: fy, z: fz, name, length }) => {
    const fingerGroup = new THREE.Group();

    for (let segment = 0; segment < 3; segment++) {
      const segmentLength = length / 3;
      const segmentRadius = 0.032 - segment * 0.005;

      const segmentGeometry = new THREE.CylinderGeometry(segmentRadius, segmentRadius * 0.8, segmentLength, 12);
      const segmentMesh = new THREE.Mesh(segmentGeometry, skinMaterial);
      
      segmentMesh.position.y = segment * segmentLength + segmentLength / 2;
      segmentMesh.userData.segment = segment;
      fingerGroup.add(segmentMesh);
    }

    fingerGroup.position.set(fx, fy, fz);
    fingerGroup.userData.name = name;
    handGroup.add(fingerGroup);
  });

  handGroup.position.set(x, y, 0);
  handRef.current = handGroup;
}

/**
 * Appliquer les transformations du geste
 */
function applyGestureTransformations(
  gesture: GestureData,
  progress: number,
  leftHandRef: React.MutableRefObject<THREE.Group | null>,
  rightHandRef: React.MutableRefObject<THREE.Group | null>,
  bodyRef: React.MutableRefObject<THREE.Group | null>,
  headRef: React.MutableRefObject<THREE.Group | null>
) {
  const easeInOutQuad = (t: number) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  const easedProgress = easeInOutQuad(progress);

  // Rotation du corps
  if (bodyRef.current && gesture.movement.bodyRotation !== undefined) {
    bodyRef.current.rotation.y = gesture.movement.bodyRotation * easedProgress;
  }

  // Inclinaison de la tête
  if (headRef.current && gesture.movement.headTilt !== undefined) {
    headRef.current.rotation.z = gesture.movement.headTilt * easedProgress;
  }

  // Transformations des mains
  gesture.movement.hands.forEach((hand) => {
    const handRef = hand.hand === 'left' ? leftHandRef : rightHandRef;

    if (handRef.current) {
      handRef.current.position.x = hand.position.x * easedProgress;
      handRef.current.position.y = hand.position.y * easedProgress;
      handRef.current.position.z = hand.position.z * easedProgress;

      handRef.current.rotation.x = hand.rotation.x * easedProgress;
      handRef.current.rotation.y = hand.rotation.y * easedProgress;
      handRef.current.rotation.z = hand.rotation.z * easedProgress;

      // Animation des doigts
      hand.fingers.forEach((finger) => {
        const fingerGroup = handRef.current?.children.find(
          (child) => child.userData?.name === finger.finger
        );

        if (fingerGroup && fingerGroup.children.length > 0) {
          fingerGroup.children.forEach((segment, segmentIndex) => {
            if (segment instanceof THREE.Mesh) {
              if (finger.extended) {
                segment.rotation.x = -0.1 * (segmentIndex + 1) * easedProgress;
              } else {
                const curlAmount = finger.curled !== undefined ? finger.curled : 0.8;
                segment.rotation.x = (-Math.PI * 0.3 * curlAmount) * easedProgress - 0.1 * (segmentIndex + 1);
              }
            }
          });
        }
      });
    }
  });
}

export { AvatarGestureMesh };
export type { SignLanguageAvatarProps };
