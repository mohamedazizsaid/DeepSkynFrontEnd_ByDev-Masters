/**
 * Realistic 3D Avatar for French Sign Language (LSF) Translation
 * 
 * Uses a rigged Ready Player Me / Mixamo compatible avatar
 * with full skeletal animation support for sign language gestures
 */

import React, { useRef, useEffect, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  ContactShadows,
  useAnimations,
  Html,
  BakeShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarFrame, AvatarKeypoint } from './sign-avatar-renderer';

// CDN URLs for rigged avatars (Mixamo-compatible with full skeleton)
const AVATAR_MODELS = {
  // Ready Player Me style avatars hosted on GitHub/CDN
  female: 'https://models.readyplayer.me/64c77c6e8b9a5f4f5e8f9a4b.glb',
  male: 'https://models.readyplayer.me/64c77c6e8b9a5f4f5e8f9a4c.glb',
  // Fallback to a known working rigged model
  fallback: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/korrigan-hat/model.gltf',
};

// Mixamo bone name mappings (standard naming convention)
const MIXAMO_BONES = {
  // Spine
  hips: 'mixamorigHips',
  spine: 'mixamorigSpine',
  spine1: 'mixamorigSpine1', 
  spine2: 'mixamorigSpine2',
  neck: 'mixamorigNeck',
  head: 'mixamorigHead',
  // Left arm
  leftShoulder: 'mixamorigLeftShoulder',
  leftArm: 'mixamorigLeftArm',
  leftForeArm: 'mixamorigLeftForeArm',
  leftHand: 'mixamorigLeftHand',
  // Right arm  
  rightShoulder: 'mixamorigRightShoulder',
  rightArm: 'mixamorigRightArm',
  rightForeArm: 'mixamorigRightForeArm',
  rightHand: 'mixamorigRightHand',
  // Left hand fingers
  leftThumb1: 'mixamorigLeftHandThumb1',
  leftThumb2: 'mixamorigLeftHandThumb2',
  leftThumb3: 'mixamorigLeftHandThumb3',
  leftIndex1: 'mixamorigLeftHandIndex1',
  leftIndex2: 'mixamorigLeftHandIndex2',
  leftIndex3: 'mixamorigLeftHandIndex3',
  leftMiddle1: 'mixamorigLeftHandMiddle1',
  leftMiddle2: 'mixamorigLeftHandMiddle2',
  leftMiddle3: 'mixamorigLeftHandMiddle3',
  leftRing1: 'mixamorigLeftHandRing1',
  leftRing2: 'mixamorigLeftHandRing2',
  leftRing3: 'mixamorigLeftHandRing3',
  leftPinky1: 'mixamorigLeftHandPinky1',
  leftPinky2: 'mixamorigLeftHandPinky2',
  leftPinky3: 'mixamorigLeftHandPinky3',
  // Right hand fingers
  rightThumb1: 'mixamorigRightHandThumb1',
  rightThumb2: 'mixamorigRightHandThumb2',
  rightThumb3: 'mixamorigRightHandThumb3',
  rightIndex1: 'mixamorigRightHandIndex1',
  rightIndex2: 'mixamorigRightHandIndex2',
  rightIndex3: 'mixamorigRightHandIndex3',
  rightMiddle1: 'mixamorigRightHandMiddle1',
  rightMiddle2: 'mixamorigRightHandMiddle2',
  rightMiddle3: 'mixamorigRightHandMiddle3',
  rightRing1: 'mixamorigRightHandRing1',
  rightRing2: 'mixamorigRightHandRing2',
  rightRing3: 'mixamorigRightHandRing3',
  rightPinky1: 'mixamorigRightHandPinky1',
  rightPinky2: 'mixamorigRightHandPinky2',
  rightPinky3: 'mixamorigRightHandPinky3',
};

interface RealisticAvatar3DProps {
  frame: AvatarFrame | null;
  gender?: 'female' | 'male';
  utterance?: string;
  debug?: boolean;
}

// Keypoint to finger joint mapping
const KEYPOINT_FINGER_MAP: Record<number, { finger: string; joint: number }> = {
  1: { finger: 'thumb', joint: 0 },
  2: { finger: 'thumb', joint: 1 },
  3: { finger: 'thumb', joint: 2 },
  4: { finger: 'thumb', joint: 3 },
  5: { finger: 'index', joint: 0 },
  6: { finger: 'index', joint: 1 },
  7: { finger: 'index', joint: 2 },
  8: { finger: 'index', joint: 3 },
  9: { finger: 'middle', joint: 0 },
  10: { finger: 'middle', joint: 1 },
  11: { finger: 'middle', joint: 2 },
  12: { finger: 'middle', joint: 3 },
  13: { finger: 'ring', joint: 0 },
  14: { finger: 'ring', joint: 1 },
  15: { finger: 'ring', joint: 2 },
  16: { finger: 'ring', joint: 3 },
  17: { finger: 'pinky', joint: 0 },
  18: { finger: 'pinky', joint: 1 },
  19: { finger: 'pinky', joint: 2 },
  20: { finger: 'pinky', joint: 3 },
};

function normalizeKeypoint(kp: AvatarKeypoint): THREE.Vector3 {
  const x = kp.x > 2 ? kp.x / 512 : kp.x;
  const y = kp.y > 2 ? kp.y / 512 : kp.y;
  const z = kp.z || 0;
  return new THREE.Vector3(
    (x - 0.5) * 2,
    (0.5 - y) * 2,
    -z * 0.5
  );
}

function AvatarModel({ 
  frame, 
  gender = 'female',
  utterance,
}: { 
  frame: AvatarFrame | null; 
  gender: 'female' | 'male';
  utterance?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const modelPath = gender === 'female' ? '/models/femme.glb' : '/models/homme.glb';
  
  // Load the GLB model
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, groupRef);
  
  // Clone the scene for independent instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Apply PBR materials to all meshes
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Enhance materials for realism
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const stdMat = mat as THREE.MeshStandardMaterial;
              stdMat.envMapIntensity = 0.8;
              stdMat.roughness = Math.max(stdMat.roughness, 0.3);
              stdMat.needsUpdate = true;
            }
          });
        }
      }
    });
    
    return clone;
  }, [scene]);

  // Get skeleton bones
  const bones = useMemo(() => {
    const boneMap: Record<string, THREE.Bone> = {};
    clonedScene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        boneMap[child.name] = child as THREE.Bone;
      }
    });
    return boneMap;
  }, [clonedScene]);

  // Find morph targets for facial expressions
  const morphTargets = useMemo(() => {
    const targets: { mesh: THREE.Mesh; influences: number[] }[] = [];
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          targets.push({
            mesh,
            influences: mesh.morphTargetInfluences,
          });
        }
      }
    });
    return targets;
  }, [clonedScene]);

  // Animate the avatar
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Subtle idle breathing animation - don't scale, just chest movement
    const breathAmount = Math.sin(t * 1.5) * 0.006;
    
    // Subtle body sway
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.015;
    groupRef.current.position.y = -1.2 + Math.sin(t * 1.2) * 0.005;
    
    // Subtle head movement
    const headBone = bones['Head'] || bones['head'] || bones['mixamorigHead'];
    if (headBone) {
      headBone.rotation.y = Math.sin(t * 0.4) * 0.04;
      headBone.rotation.x = Math.sin(t * 0.3) * 0.025;
      headBone.rotation.z = Math.sin(t * 0.35) * 0.015;
    }
    
    // Spine breathing
    const spineBone = bones['Spine'] || bones['spine'] || bones['mixamorigSpine'];
    if (spineBone) {
      spineBone.rotation.x = breathAmount;
    }
    
    // Eye blinking via morph targets
    const blinkCycle = t % 4;
    const blinkValue = blinkCycle < 0.12 ? Math.sin((blinkCycle / 0.12) * Math.PI) : 0;
    morphTargets.forEach(({ mesh }) => {
      const dict = mesh.morphTargetDictionary;
      if (dict) {
        const blinkLeftIdx = dict['eyeBlinkLeft'] ?? dict['Blink_Left'] ?? dict['blink_L'];
        const blinkRightIdx = dict['eyeBlinkRight'] ?? dict['Blink_Right'] ?? dict['blink_R'];
        if (blinkLeftIdx !== undefined && mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[blinkLeftIdx] = blinkValue;
        }
        if (blinkRightIdx !== undefined && mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[blinkRightIdx] = blinkValue;
        }
      }
    });
    
    // Lip sync animation when speaking
    if (utterance && utterance.trim().length > 0) {
      const mouthOpen = 0.3 + Math.sin(t * 8) * 0.2;
      morphTargets.forEach(({ mesh }) => {
        const dict = mesh.morphTargetDictionary;
        if (dict && mesh.morphTargetInfluences) {
          const jawOpenIdx = dict['jawOpen'] ?? dict['Jaw_Open'] ?? dict['mouthOpen'];
          if (jawOpenIdx !== undefined) {
            mesh.morphTargetInfluences[jawOpenIdx] = mouthOpen;
          }
        }
      });
    }

    // Apply hand keypoints to bones
    if (frame) {
      applyHandPose(bones, frame.hand_right_keypoints, 'Right', t);
      applyHandPose(bones, frame.hand_left_keypoints, 'Left', t);
      applyBodyPose(bones, frame.pose_keypoints);
    }
  });

  function applyHandPose(
    boneMap: Record<string, THREE.Bone>,
    keypoints: AvatarKeypoint[],
    side: 'Left' | 'Right',
    time: number
  ) {
    if (!keypoints || keypoints.length < 21) return;

    // Wrist position
    const wristKp = keypoints[0];
    const wristBone = boneMap[`${side}_Wrist`] || boneMap[`wrist_${side.toLowerCase()}`];
    if (wristBone && wristKp) {
      const wristPos = normalizeKeypoint(wristKp);
      // Smooth transition
      wristBone.position.lerp(
        new THREE.Vector3(
          wristPos.x * 0.3,
          wristPos.y * 0.3 + 0.5,
          wristPos.z * 0.2
        ),
        0.15
      );
    }

    // Finger rotations
    for (let i = 1; i <= 20; i++) {
      const mapping = KEYPOINT_FINGER_MAP[i];
      if (!mapping) continue;
      
      const kp = keypoints[i];
      const prevKp = keypoints[i - 1] || keypoints[0];
      if (!kp || !prevKp) continue;

      const boneName = `${side}_${mapping.finger}_${mapping.joint}`;
      const bone = boneMap[boneName] || boneMap[boneName.toLowerCase()];
      
      if (bone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(kp),
          normalizeKeypoint(prevKp)
        );
        
        // Calculate rotation from direction
        const angle = Math.atan2(dir.y, dir.length()) * 0.6;
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, angle, 0.2);
      }
    }
  }

  function applyBodyPose(boneMap: Record<string, THREE.Bone>, poseKps: AvatarKeypoint[]) {
    if (!poseKps || poseKps.length < 17) return;

    // Shoulders
    const lShoulder = poseKps[11];
    const rShoulder = poseKps[12];
    const lElbow = poseKps[13];
    const rElbow = poseKps[14];

    if (lShoulder && lElbow) {
      const lShoulderBone = boneMap['Left_Shoulder'] || boneMap['shoulder_L'];
      if (lShoulderBone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(lElbow),
          normalizeKeypoint(lShoulder)
        );
        lShoulderBone.rotation.z = THREE.MathUtils.lerp(
          lShoulderBone.rotation.z,
          Math.atan2(dir.y, dir.x) + Math.PI / 2,
          0.1
        );
      }
    }

    if (rShoulder && rElbow) {
      const rShoulderBone = boneMap['Right_Shoulder'] || boneMap['shoulder_R'];
      if (rShoulderBone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(rElbow),
          normalizeKeypoint(rShoulder)
        );
        rShoulderBone.rotation.z = THREE.MathUtils.lerp(
          rShoulderBone.rotation.z,
          Math.atan2(dir.y, -dir.x) - Math.PI / 2,
          0.1
        );
      }
    }
  }

  return (
    <group ref={groupRef} position={[0, -7, 0]} scale={1.9}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Camera controller that focuses on upper body
function CameraController() {
  const { camera } = useThree();
  
  useFrame(() => {
    // Ensure camera always looks at the upper body area
    camera.lookAt(0, 0.8, 0);
  });
  
  return null;
}

// Loading fallback - simple silhouette
function LoadingFallback() {
  return (
    <mesh position={[0, 0.8, 0]}>
      <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
      <meshStandardMaterial color="#1a1a2e" transparent opacity={0.5} />
    </mesh>
  );
}

// Professional studio lighting setup
function StudioLighting() {
  return (
    <>
      {/* Key light - main illumination */}
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.2}
        color="#fff5eb"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      
      {/* Fill light - soften shadows */}
      <directionalLight
        position={[-3, 2, 3]}
        intensity={0.5}
        color="#b8d4ff"
      />
      
      {/* Rim light - edge definition */}
      <spotLight
        position={[0, 3, -3]}
        intensity={0.8}
        angle={0.4}
        penumbra={0.8}
        color="#e8f0ff"
      />
      
      {/* Hair light */}
      <pointLight
        position={[0, 4, 0]}
        intensity={0.4}
        color="#ffe8d6"
      />
      
      {/* Ambient fill */}
      <ambientLight intensity={0.35} color="#e0e8ff" />
      
      {/* Ground bounce */}
      <directionalLight
        position={[0, -2, 2]}
        intensity={0.15}
        color="#a0b8e0"
      />
    </>
  );
}

export function RealisticAvatar3D({
  frame,
  gender = 'female',
  utterance,
  debug = false,
}: RealisticAvatar3DProps) {
  // Preload models
  useEffect(() => {
    useGLTF.preload('/models/femme.glb');
    useGLTF.preload('/models/homme.glb');
  }, []);

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #12122a 50%, #0a0a1a 100%)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />
      
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        camera={{ position: [0, 1.4, 2.5], fov: 32 }}
      >
        <color attach="background" args={['#0a0a1a']} />
        
        <CameraController />
        <StudioLighting />
        
        {/* HDR Environment for reflections */}
        <Environment preset="studio" background={false} />
        
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel 
            frame={frame} 
            gender={gender} 
            utterance={utterance}
          />
        </Suspense>
        
        {/* Floor shadow */}
        <ContactShadows
          position={[0, -2.0, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={5}
          color="#000020"
        />
        
        {/* Bake shadows for performance */}
        <BakeShadows />
      </Canvas>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)',
          zIndex: 10,
        }}
      />
    </div>
  );
}

export default RealisticAvatar3D;
