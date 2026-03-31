/**
 * Mixamo Avatar 3D Component
 * 
 * Loads and animates a Mixamo-rigged avatar for sign language gestures.
 * Supports both GLB (preferred) and FBX file formats.
 */

import React, { useRef, useEffect, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Environment, 
  ContactShadows,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { AvatarFrame, AvatarKeypoint } from './sign-avatar-renderer';

// Mixamo bone name mappings
const MIXAMO_BONES = {
  // Core
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

// Alternative bone names (without mixamorig prefix)
const SIMPLE_BONES = {
  hips: 'Hips',
  spine: 'Spine',
  spine1: 'Spine1',
  spine2: 'Spine2',
  neck: 'Neck',
  head: 'Head',
  leftShoulder: 'LeftShoulder',
  leftArm: 'LeftArm',
  leftForeArm: 'LeftForeArm',
  leftHand: 'LeftHand',
  rightShoulder: 'RightShoulder',
  rightArm: 'RightArm',
  rightForeArm: 'RightForeArm',
  rightHand: 'RightHand',
  // Fingers would be similar...
};

// Auto-detect bone naming scheme
function detectBoneScheme(bones: Record<string, THREE.Bone>): typeof MIXAMO_BONES {
  const boneNames = Object.keys(bones);
  
  if (boneNames.length === 0) {
    console.error('❌ NO BONES FOUND IN MODEL - Using fallback');
    return MIXAMO_BONES;
  }
  
  // Check if any bone has mixamorig prefix
  const hasMixamorigPrefix = boneNames.some(name => name.startsWith('mixamorig'));
  
  if (hasMixamorigPrefix) {
    console.log('✅ Using Mixamo naming scheme (mixamorig prefix)');
    return MIXAMO_BONES;
  }
  
  // Check for simple naming (Hips, Spine, etc.)
  const hasSimpleNaming = boneNames.some(name => 
    name === 'Hips' || name === 'Spine' || name === 'Head'
  );
  
  if (hasSimpleNaming) {
    console.log('✅ Using simple naming scheme (no prefix)');
    return SIMPLE_BONES as typeof MIXAMO_BONES;
  }
  
  console.warn('⚠️ Unknown bone naming scheme, trying Mixamo default');
  console.log('First 5 bone names:', boneNames.slice(0, 5));
  return MIXAMO_BONES;
}

interface MixamoAvatar3DProps {
  frame: AvatarFrame | null;
  utterance?: string;
  debug?: boolean;
  modelPath?: string;
}

// Helper to normalize keypoints
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

// Smooth interpolation helper
function lerpAngle(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

// Calculate arm rotations from keypoint positions (shoulder -> elbow -> wrist)
// This synchronizes Mixamo avatar with skeleton display
function calculateArmRotations(
  shoulder: AvatarKeypoint | undefined,
  elbow: AvatarKeypoint | undefined,
  wrist: AvatarKeypoint | undefined,
  isLeft: boolean
): { armRotation: THREE.Euler; foreArmRotation: THREE.Euler } | null {
  if (!shoulder || !elbow || !wrist) {
    return null;
  }
  
  // Convert to normalized 3D positions (same as skeleton)
  const shoulderPos = new THREE.Vector3(
    (shoulder.x - 0.5) * 2,
    (0.5 - shoulder.y) * 2,
    -(shoulder.z || 0) * 0.5
  );
  const elbowPos = new THREE.Vector3(
    (elbow.x - 0.5) * 2,
    (0.5 - elbow.y) * 2,
    -(elbow.z || 0) * 0.5
  );
  const wristPos = new THREE.Vector3(
    (wrist.x - 0.5) * 2,
    (0.5 - wrist.y) * 2,
    -(wrist.z || 0) * 0.5
  );
  
  // Vector from shoulder to elbow (upper arm direction)
  const upperArmDir = new THREE.Vector3().subVectors(elbowPos, shoulderPos).normalize();
  
  // Vector from elbow to wrist (forearm direction)
  const foreArmDir = new THREE.Vector3().subVectors(wristPos, elbowPos).normalize();
  
  // Calculate arm rotation
  // In T-pose, arms point outward (+X for left, -X for right)
  const tPoseDir = new THREE.Vector3(isLeft ? 1 : -1, 0, 0);
  
  // Calculate rotation to align T-pose direction to upper arm direction
  const armQuat = new THREE.Quaternion().setFromUnitVectors(tPoseDir, upperArmDir);
  const armEuler = new THREE.Euler().setFromQuaternion(armQuat, 'XYZ');
  
  // For forearm, calculate angle relative to upper arm
  // The forearm in T-pose points same direction as arm
  const foreArmQuat = new THREE.Quaternion().setFromUnitVectors(upperArmDir, foreArmDir);
  const foreArmEuler = new THREE.Euler().setFromQuaternion(foreArmQuat, 'XYZ');
  
  return {
    armRotation: armEuler,
    foreArmRotation: foreArmEuler
  };
}

function findPoseKeypoint(
  poseKps: AvatarKeypoint[],
  idTokens: string[],
  fallbackIndex: number
): AvatarKeypoint | undefined {
  const byId = poseKps.find((kp) => {
    const id = (kp.id || '').toLowerCase();
    return idTokens.every((t) => id.includes(t));
  });
  return byId ?? poseKps[fallbackIndex];
}

function normalizeHandLandmarks(handKps: AvatarKeypoint[]): Array<AvatarKeypoint | undefined> {
  const mapped: Array<AvatarKeypoint | undefined> = Array.from({ length: 21 }, () => undefined);

  // DEBUG: Log received keypoint IDs
  console.log(`[normalizeHandLandmarks] Input IDs: ${handKps.slice(0, 5).map(kp => kp.id).join(', ')}...`);

  const assignIfEmpty = (index: number, kp: AvatarKeypoint) => {
    if (!mapped[index]) mapped[index] = kp;
  };

  // Finger joint name patterns from spoken-to-signed pipeline
  // Format: right_hand_thumb_cmc, right_hand_index_pip, etc.
  const jointOrder = ['cmc', 'mcp', 'ip', 'tip']; // thumb uses cmc/mcp/ip/tip
  const jointOrderFinger = ['mcp', 'pip', 'dip', 'tip']; // other fingers

  handKps.forEach((kp, rawIndex) => {
    const id = (kp.id || '').toLowerCase();

    if (id.includes('wrist')) {
      assignIfEmpty(0, kp);
      return;
    }

    // Handles ids like right_hand_finger2_joint3 (mock/demo format)
    const fingerJointMatch = id.match(/finger(\d+)_joint(\d+)/);
    if (fingerJointMatch) {
      const finger = Number(fingerJointMatch[1]); // 0..4
      const joint = Number(fingerJointMatch[2]);  // 0..3
      const idx = 1 + finger * 4 + joint;
      if (idx >= 1 && idx <= 20) assignIfEmpty(idx, kp);
      return;
    }

    const fingerMap: Array<{ token: string; start: number; isThumb: boolean }> = [
      { token: 'thumb', start: 1, isThumb: true },
      { token: 'index', start: 5, isThumb: false },
      { token: 'middle', start: 9, isThumb: false },
      { token: 'ring', start: 13, isThumb: false },
      { token: 'pinky', start: 17, isThumb: false },
      { token: 'little', start: 17, isThumb: false },
    ];

    const hit = fingerMap.find((f) => id.includes(f.token));
    if (hit) {
      const joints = hit.isThumb ? jointOrder : jointOrderFinger;
      let placed = false;
      for (let j = 0; j < joints.length; j++) {
        if (id.includes(joints[j])) {
          assignIfEmpty(hit.start + j, kp);
          placed = true;
          break;
        }
      }
      if (!placed) {
        // fallback: place by first free slot in this finger range
        for (let i = hit.start; i <= hit.start + 3; i += 1) {
          if (!mapped[i]) {
            mapped[i] = kp;
            break;
          }
        }
      }
      return;
    }

    // Last fallback keeps original order if IDs are unknown
    if (!mapped[rawIndex] && rawIndex < 21) mapped[rawIndex] = kp;
  });

  // DEBUG: Log mapped positions
  const mappedIndices = mapped.map((kp, i) => kp ? i : null).filter(i => i !== null);
  console.log(`[normalizeHandLandmarks] Mapped to indices: ${mappedIndices.join(', ')}`);

  return mapped;
}

// Apply hand pose animation from MediaPipe keypoints
function applyHandPose(
  bones: Record<string, THREE.Bone>,
  handKps: AvatarKeypoint[],
  side: 'left' | 'right'
) {
  const landmarks = normalizeHandLandmarks(handKps);
  const prefix = side === 'left' ? 'left' : 'right';
  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  const fingerIndices = [
    [1, 2, 3, 4],     // Thumb: CMC, MCP, IP, TIP
    [5, 6, 7, 8],     // Index: MCP, PIP, DIP, TIP
    [9, 10, 11, 12],  // Middle
    [13, 14, 15, 16], // Ring
    [17, 18, 19, 20], // Pinky
  ];

  // DEBUG: Log keypoint mapping (only once per side)
  const mappedCount = landmarks.filter(Boolean).length;
  if (mappedCount > 0) {
    console.log(`[applyHandPose] ${side}: ${handKps.length} input -> ${mappedCount} mapped landmarks`);
  }

  fingerNames.forEach((fingerName, fingerIdx) => {
    const indices = fingerIndices[fingerIdx];
    
    for (let joint = 0; joint < 3; joint++) {
      // Use the keys from MIXAMO_BONES mapping (e.g., 'leftThumb1', 'rightIndex2')
      const boneKey = `${prefix}${fingerName}${joint + 1}`;
      const bone = bones[boneKey];
      
      if (!bone) {
        // Debug: log missing bones
        if (joint === 0 && fingerIdx === 0) {
          console.warn(`⚠️ Finger bone not found: ${boneKey}`);
        }
        continue;
      }
      
      const kpIdx = indices[joint];
      const nextKpIdx = indices[joint + 1];
      
      if (!landmarks[kpIdx] || !landmarks[nextKpIdx]) continue;
      
      const current = normalizeKeypoint(landmarks[kpIdx] as AvatarKeypoint);
      const next = normalizeKeypoint(landmarks[nextKpIdx] as AvatarKeypoint);
      const dir = new THREE.Vector3().subVectors(next, current);
      
      // Calculate finger curl angle
      const curlAngle = Math.atan2(dir.y, dir.length());
      
      // Apply with stronger intensity for more visible gestures
      // Increased from 0.35/0.5 to 0.6/0.8 and faster lerp 0.18 -> 0.35
      const intensity = fingerName === 'Thumb' ? 0.6 : 0.8;
      bone.rotation.x = lerpAngle(bone.rotation.x, curlAngle * intensity, 0.35);
      
      // Add finger spread for base joints - increased from 0.08 to 0.15
      if (fingerName !== 'Thumb' && joint === 0) {
        const spread = (fingerIdx - 2) * 0.15;
        bone.rotation.z = lerpAngle(bone.rotation.z, spread, 0.2);
      }
    }
  });
}

// FBX/GLB Avatar component with dynamic loader
function MixamoAvatar({ 
  frame, 
  modelPath = '/models/ybot.fbx',
  utterance,
}: { 
  frame: AvatarFrame | null; 
  modelPath?: string;
  utterance?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Detect file type and load appropriately
  useEffect(() => {
    setLoading(true);
    const isFBX = modelPath.toLowerCase().endsWith('.fbx');
    
    if (isFBX) {
      // Load FBX
      const loader = new FBXLoader();
      loader.load(
        modelPath,
        (fbx) => {
          console.log('✅ FBX loaded:', modelPath);
          
          // Scale for Mixamo models (usually in cm)
          fbx.scale.setScalar(0.01);
          
          // Center and ground the model
          const box = new THREE.Box3().setFromObject(fbx);
          const center = box.getCenter(new THREE.Vector3());
          fbx.position.x = -center.x;
          fbx.position.z = -center.z;
          fbx.position.y = -box.min.y * 0.01;
          
          // Setup materials
          fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                  if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                    const stdMat = mat as THREE.MeshStandardMaterial;
                    stdMat.envMapIntensity = 1.2;
                    stdMat.roughness = Math.min(stdMat.roughness + 0.1, 1);
                    stdMat.needsUpdate = true;
                  }
                });
              }
            }
          });
          
          setModel(fbx);
          setLoading(false);
        },
        undefined,
        (error) => {
          console.error('❌ Error loading FBX:', error);
          setLoading(false);
        }
      );
    } else {
      // Load GLB with useGLTF
      console.log('ℹ️ For GLB files, use the GLBAvatar component instead');
      setLoading(false);
    }
  }, [modelPath]);
  
  // Collect bones once model is loaded
  useEffect(() => {
    if (!model) return;
    
    const bones: THREE.Bone[] = [];
    model.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        bones.push(child as THREE.Bone);
      }
    });
    
    console.log('🦴 Mixamo bones found:', bones.length);
    console.log('Sample bones:', bones.slice(0, 5).map(b => b.name));
    
    const boneNames = bones.map(b => b.name);
    const hasMixamorigPrefix = boneNames.some(n => n.startsWith('mixamorig'));
    console.log('Has mixamorig prefix:', hasMixamorigPrefix);
    
    // Determine bone naming scheme
    let boneScheme: typeof MIXAMO_BONES;
    if (hasMixamorigPrefix) {
      console.log('✅ Using Mixamo naming scheme (mixamorig prefix)');
      boneScheme = MIXAMO_BONES;
    } else if (boneNames.some(n => n === 'Hips' || n === 'Spine' || n === 'Head')) {
      console.log('✅ Using simple naming scheme (no prefix)');
      boneScheme = SIMPLE_BONES as typeof MIXAMO_BONES;
    } else {
      console.warn('⚠️ Unknown bone naming scheme, using Mixamo default');
      console.log('First 5 bone names:', boneNames.slice(0, 5));
      boneScheme = MIXAMO_BONES;
    }
    
    // Map bones by name
    const boneMap: Record<string, THREE.Bone> = {};
    Object.entries(boneScheme).forEach(([key, boneName]) => {
      const bone = bones.find(b => b.name === boneName);
      if (bone) {
        boneMap[key] = bone;
      }
    });
    
    bonesRef.current = boneMap;
    
    console.log('✅ Bones mapped:', Object.keys(boneMap).length, 'bones');
    console.log('Sample mapped bones:', Object.keys(boneMap).slice(0, 5));
  }, [model]);
  
  // Animation loop
  useFrame((state) => {
    if (!frame || !model) return;
    
    const bones = bonesRef.current;
    if (Object.keys(bones).length === 0) {
      return; // Silently wait for bones to be mapped
    }
    
    const t = state.clock.elapsedTime;
    
    // Idle animations
    const breathAmount = Math.sin(t * 1.5) * 0.015;
    if (bones.spine) {
      bones.spine.rotation.x = lerpAngle(bones.spine.rotation.x, breathAmount, 0.1);
    }
    if (bones.spine1) {
      bones.spine1.rotation.z = lerpAngle(bones.spine1.rotation.z, Math.sin(t * 0.9) * 0.03, 0.08);
    }
    if (bones.spine2) {
      bones.spine2.rotation.y = lerpAngle(bones.spine2.rotation.y, Math.sin(t * 0.7) * 0.04, 0.08);
    }
    if (bones.neck) {
      bones.neck.rotation.x = lerpAngle(bones.neck.rotation.x, Math.sin(t * 0.8) * 0.03, 0.1);
    }
    if (bones.head) {
      bones.head.rotation.y = lerpAngle(bones.head.rotation.y, Math.sin(t * 0.6) * 0.05, 0.08);
      bones.head.rotation.x = lerpAngle(bones.head.rotation.x, Math.sin(t * 0.45) * 0.04, 0.08);
    }
    
    // Apply body pose from keypoints - synchronized with skeleton display
    if (frame.pose_keypoints && frame.pose_keypoints.length > 0) {
      // Prefer name-based lookup; fallback to MediaPipe indices
      const leftShoulder = findPoseKeypoint(frame.pose_keypoints, ['left', 'shoulder'], 11);
      const rightShoulder = findPoseKeypoint(frame.pose_keypoints, ['right', 'shoulder'], 12);
      const leftElbow = findPoseKeypoint(frame.pose_keypoints, ['left', 'elbow'], 13);
      const rightElbow = findPoseKeypoint(frame.pose_keypoints, ['right', 'elbow'], 14);
      const leftWrist = findPoseKeypoint(frame.pose_keypoints, ['left', 'wrist'], 15);
      const rightWrist = findPoseKeypoint(frame.pose_keypoints, ['right', 'wrist'], 16);
      
      // Calculate left arm rotations from keypoints
      const leftArmRot = calculateArmRotations(leftShoulder, leftElbow, leftWrist, true);
      if (leftArmRot && bones.leftArm && bones.leftForeArm) {
        // Apply upper arm rotation with smoothing
        bones.leftArm.rotation.x = lerpAngle(bones.leftArm.rotation.x, leftArmRot.armRotation.x, 0.25);
        bones.leftArm.rotation.y = lerpAngle(bones.leftArm.rotation.y, leftArmRot.armRotation.y, 0.25);
        bones.leftArm.rotation.z = lerpAngle(bones.leftArm.rotation.z, leftArmRot.armRotation.z, 0.25);
        
        // Apply forearm rotation with smoothing
        bones.leftForeArm.rotation.x = lerpAngle(bones.leftForeArm.rotation.x, leftArmRot.foreArmRotation.x, 0.25);
        bones.leftForeArm.rotation.y = lerpAngle(bones.leftForeArm.rotation.y, leftArmRot.foreArmRotation.y, 0.25);
        bones.leftForeArm.rotation.z = lerpAngle(bones.leftForeArm.rotation.z, leftArmRot.foreArmRotation.z, 0.25);
      } else {
        // Fallback to default pose for left arm
        if (bones.leftArm) {
          bones.leftArm.rotation.z = lerpAngle(bones.leftArm.rotation.z, 0.6, 0.15);
          bones.leftArm.rotation.x = lerpAngle(bones.leftArm.rotation.x, -0.4, 0.15);
        }
        if (bones.leftForeArm) {
          bones.leftForeArm.rotation.z = lerpAngle(bones.leftForeArm.rotation.z, 1.2, 0.15);
          bones.leftForeArm.rotation.x = lerpAngle(bones.leftForeArm.rotation.x, -0.3, 0.15);
        }
      }
      
      // Calculate right arm rotations from keypoints
      const rightArmRot = calculateArmRotations(rightShoulder, rightElbow, rightWrist, false);
      if (rightArmRot && bones.rightArm && bones.rightForeArm) {
        // Apply upper arm rotation with smoothing
        bones.rightArm.rotation.x = lerpAngle(bones.rightArm.rotation.x, rightArmRot.armRotation.x, 0.25);
        bones.rightArm.rotation.y = lerpAngle(bones.rightArm.rotation.y, rightArmRot.armRotation.y, 0.25);
        bones.rightArm.rotation.z = lerpAngle(bones.rightArm.rotation.z, rightArmRot.armRotation.z, 0.25);
        
        // Apply forearm rotation with smoothing
        bones.rightForeArm.rotation.x = lerpAngle(bones.rightForeArm.rotation.x, rightArmRot.foreArmRotation.x, 0.25);
        bones.rightForeArm.rotation.y = lerpAngle(bones.rightForeArm.rotation.y, rightArmRot.foreArmRotation.y, 0.25);
        bones.rightForeArm.rotation.z = lerpAngle(bones.rightForeArm.rotation.z, rightArmRot.foreArmRotation.z, 0.25);
      } else {
        // Fallback to default pose for right arm
        if (bones.rightArm) {
          bones.rightArm.rotation.z = lerpAngle(bones.rightArm.rotation.z, -0.6, 0.15);
          bones.rightArm.rotation.x = lerpAngle(bones.rightArm.rotation.x, -0.4, 0.15);
        }
        if (bones.rightForeArm) {
          bones.rightForeArm.rotation.z = lerpAngle(bones.rightForeArm.rotation.z, -1.2, 0.15);
          bones.rightForeArm.rotation.x = lerpAngle(bones.rightForeArm.rotation.x, -0.3, 0.15);
        }
      }
    } else {
      // Default pose: natural sign language position
      if (bones.leftArm) {
        bones.leftArm.rotation.z = lerpAngle(bones.leftArm.rotation.z, 0.6, 0.15);
        bones.leftArm.rotation.x = lerpAngle(bones.leftArm.rotation.x, -0.4, 0.15);
      }
      if (bones.leftForeArm) {
        bones.leftForeArm.rotation.z = lerpAngle(bones.leftForeArm.rotation.z, 1.2, 0.15);
        bones.leftForeArm.rotation.x = lerpAngle(bones.leftForeArm.rotation.x, -0.3, 0.15);
      }
      if (bones.rightArm) {
        bones.rightArm.rotation.z = lerpAngle(bones.rightArm.rotation.z, -0.6, 0.15);
        bones.rightArm.rotation.x = lerpAngle(bones.rightArm.rotation.x, -0.4, 0.15);
      }
      if (bones.rightForeArm) {
        bones.rightForeArm.rotation.z = lerpAngle(bones.rightForeArm.rotation.z, -1.2, 0.15);
        bones.rightForeArm.rotation.x = lerpAngle(bones.rightForeArm.rotation.x, -0.3, 0.15);
      }
    }
    
    // Apply hand gestures (simplified - use the existing logic from GLBAvatar)
    if (frame.hand_right_keypoints && frame.hand_right_keypoints.length > 0) {
      applyHandPose(bones, frame.hand_right_keypoints, 'right');
    }
    if (frame.hand_left_keypoints && frame.hand_left_keypoints.length > 0) {
      applyHandPose(bones, frame.hand_left_keypoints, 'left');
    }
  });
  
  if (loading) {
    return (
      <Html center>
        <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '4px' }}>
          Chargement du modèle...
        </div>
      </Html>
    );
  }
  
  if (!model) {
    return (
      <Html center>
        <div style={{ color: '#ff6b6b', background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '4px' }}>
          Erreur de chargement
        </div>
      </Html>
    );
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

// GLB Avatar component using useGLTF (keep for backward compatibility)
function GLBAvatar({ 
  frame, 
  modelPath = '/models/ybot.fbx',
  utterance,
}: { 
  frame: AvatarFrame | null; 
  modelPath?: string;
  utterance?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  
  // Load GLB model with useGLTF (caching built-in)
  const { scene } = useGLTF(modelPath);
  
  // Clone and setup model
  const model = useMemo(() => {
    const clone = scene.clone();
    
    // Scale for Mixamo models (usually in cm)
    clone.scale.setScalar(0.01);
    
    // Center and ground the model
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x = -center.x;
    clone.position.z = -center.z;
    clone.position.y = -box.min.y * 0.01;
    
    // Setup materials and collect bones
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Enhance existing materials or create new ones
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const stdMat = mat as THREE.MeshStandardMaterial;
              stdMat.envMapIntensity = 1.2;
              stdMat.roughness = Math.min(stdMat.roughness + 0.1, 1);
              stdMat.needsUpdate = true;
            }
          });
        } else {
          // Create default material for meshes without one
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#3a3a5a'),
            metalness: 0.5,
            roughness: 0.4,
            envMapIntensity: 1.2,
          });
        }
      }
      
      // Collect bone references
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone;
        bonesRef.current[bone.name] = bone;
      }
    });
    
    // Debug: Log bone names found
    const boneNames = Object.keys(bonesRef.current);
    console.log('🦴 Mixamo bones found:', boneNames.length);
    console.log('Sample bones:', boneNames.slice(0, 10));
    
    // Auto-detect bone naming scheme
    const detectedScheme = detectBoneScheme(bonesRef.current);
    const schemeUsed = detectedScheme === MIXAMO_BONES ? 'mixamorig' : 'simple';
    console.log('🎯 Bone scheme detected:', schemeUsed);
    
    // Check for Mixamo naming convention
    const hasMixamorigPrefix = boneNames.some(name => name.startsWith('mixamorig'));
    console.log('Has mixamorig prefix:', hasMixamorigPrefix);
    
    if (!hasMixamorigPrefix && boneNames.length > 0) {
      console.warn('⚠️ Bones found but without mixamorig prefix!');
      console.log('First bone name:', boneNames[0]);
    }
    
    if (boneNames.length === 0) {
      console.error('❌ CRITICAL: No bones found in the model!');
      console.error('This GLB file has NO SKELETON - it\'s a static mesh.');
      console.error('Please download a RIGGED model from Mixamo.com');
    }
    
    return clone;
  }, [scene]);

  // Animation loop
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    const bones = bonesRef.current;
    
    // Debug: Log frame data occasionally
    if (Math.floor(t) % 2 === 0 && t - Math.floor(t) < 0.1) {
      if (frame) {
        console.log('📊 Frame received:', {
          hasRightHand: !!frame.hand_right_keypoints?.length,
          hasLeftHand: !!frame.hand_left_keypoints?.length,
          hasPose: !!frame.pose_keypoints?.length,
        });
      } else {
        console.log('⚠️ No frame data received');
      }
    }
    
    // Idle breathing animation
    const breathAmount = Math.sin(t * 1.5) * 0.015;
    const spine = bones[MIXAMO_BONES.spine];
    if (spine) {
      spine.rotation.x = lerpAngle(spine.rotation.x, breathAmount, 0.1);
    }
    
    // Subtle head movement (looking around)
    const head = bones[MIXAMO_BONES.head];
    if (head) {
      head.rotation.y = lerpAngle(head.rotation.y, Math.sin(t * 0.4) * 0.06, 0.08);
      head.rotation.x = lerpAngle(head.rotation.x, Math.sin(t * 0.3) * 0.04, 0.08);
    }
    
    // Subtle body sway
    const hips = bones[MIXAMO_BONES.hips];
    if (hips) {
      hips.rotation.y = lerpAngle(hips.rotation.y, Math.sin(t * 0.25) * 0.02, 0.05);
    }
    
    // Apply keypoint-based animation when available
    if (frame) {
      applyPoseFromFrame(bones, frame);
    }
  });

  function applyPoseFromFrame(bones: Record<string, THREE.Bone>, frame: AvatarFrame) {
    // Apply arm/shoulder pose from body keypoints
    if (frame.pose_keypoints && frame.pose_keypoints.length >= 17) {
      applyShoulderPose(bones, frame.pose_keypoints);
    }
    
    // Apply hand gestures
    if (frame.hand_right_keypoints && frame.hand_right_keypoints.length === 21) {
      applyHandPose(bones, frame.hand_right_keypoints, 'right');
    }
    
    if (frame.hand_left_keypoints && frame.hand_left_keypoints.length === 21) {
      applyHandPose(bones, frame.hand_left_keypoints, 'left');
    }
  }

  function applyShoulderPose(bones: Record<string, THREE.Bone>, poseKps: AvatarKeypoint[]) {
    // MediaPipe pose indices: 11=L shoulder, 12=R shoulder, 13=L elbow, 14=R elbow, 15=L wrist, 16=R wrist
    const leftShoulder = poseKps[11];
    const rightShoulder = poseKps[12];
    const leftElbow = poseKps[13];
    const rightElbow = poseKps[14];
    const leftWrist = poseKps[15];
    const rightWrist = poseKps[16];

    // Left upper arm
    if (leftShoulder && leftElbow) {
      const leftArmBone = bones[MIXAMO_BONES.leftArm];
      if (leftArmBone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(leftElbow),
          normalizeKeypoint(leftShoulder)
        );
        const targetZ = Math.atan2(dir.y, dir.x) + Math.PI / 2;
        leftArmBone.rotation.z = lerpAngle(leftArmBone.rotation.z, targetZ * 0.7, 0.12);
      }
    }

    // Left forearm
    if (leftElbow && leftWrist) {
      const leftForeArmBone = bones[MIXAMO_BONES.leftForeArm];
      if (leftForeArmBone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(leftWrist),
          normalizeKeypoint(leftElbow)
        );
        const angle = Math.atan2(dir.y, dir.length()) * 0.7;
        leftForeArmBone.rotation.x = lerpAngle(leftForeArmBone.rotation.x, angle, 0.12);
      }
    }

    // Right upper arm
    if (rightShoulder && rightElbow) {
      const rightArmBone = bones[MIXAMO_BONES.rightArm];
      if (rightArmBone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(rightElbow),
          normalizeKeypoint(rightShoulder)
        );
        const targetZ = Math.atan2(dir.y, -dir.x) - Math.PI / 2;
        rightArmBone.rotation.z = lerpAngle(rightArmBone.rotation.z, targetZ * 0.7, 0.12);
      }
    }

    // Right forearm
    if (rightElbow && rightWrist) {
      const rightForeArmBone = bones[MIXAMO_BONES.rightForeArm];
      if (rightForeArmBone) {
        const dir = new THREE.Vector3().subVectors(
          normalizeKeypoint(rightWrist),
          normalizeKeypoint(rightElbow)
        );
        const angle = Math.atan2(dir.y, dir.length()) * 0.7;
        rightForeArmBone.rotation.x = lerpAngle(rightForeArmBone.rotation.x, angle, 0.12);
      }
    }
  }

  return (
    <group ref={groupRef} position={[0, -0.85, 0]} scale={1}>
      <primitive object={model} />
    </group>
  );
}

// Camera controller for framing upper body
function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Keep full upper body + face visible (critical for LSF grammar/facial markers)
    camera.position.set(0, 1.5, 2.9);
    camera.lookAt(0, 1.05, 0);
  }, [camera]);
  
  useFrame(() => {
    camera.lookAt(0, 1.05, 0);
  });
  
  return null;
}

// Loading fallback
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm opacity-70">Chargement de l'avatar Mixamo...</span>
      </div>
    </Html>
  );
}

// Studio lighting setup
function StudioLighting() {
  return (
    <>
      {/* Key light - main warm light */}
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.8}
        color="#fff5eb"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light - cool blue */}
      <directionalLight
        position={[-3, 2, 3]}
        intensity={0.7}
        color="#b8d4ff"
      />
      
      {/* Rim/back light */}
      <spotLight
        position={[0, 4, -3]}
        intensity={1.2}
        angle={0.6}
        penumbra={0.8}
        color="#60a5fa"
      />
      
      {/* Top light */}
      <pointLight
        position={[0, 5, 0]}
        intensity={0.5}
        color="#ffffff"
      />
      
      {/* Ambient fill */}
      <ambientLight intensity={0.45} color="#e0e8ff" />
    </>
  );
}

export function MixamoAvatar3D({
  frame,
  utterance,
  debug = false,
  modelPath = '/models/ybot.fbx',
}: MixamoAvatar3DProps) {
  
  // Detect if it's FBX or GLB
  const isFBX = modelPath.toLowerCase().endsWith('.fbx');
  
  // Preload GLB models only
  useEffect(() => {
    if (!isFBX) {
      useGLTF.preload(modelPath);
    }
  }, [modelPath, isFBX]);

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
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 1.5, 2.9], fov: 36 }}
      >
        <color attach="background" args={['#0a0a1a']} />
        
        <CameraController />
        <StudioLighting />
        
        <Environment preset="studio" background={false} />
        
        <Suspense fallback={<LoadingFallback />}>
          {isFBX ? (
            <MixamoAvatar 
              frame={frame}
              utterance={utterance}
              modelPath={modelPath}
              />
            ) : (
              <GLBAvatar 
                frame={frame}
                utterance={utterance}
                modelPath={modelPath}
              />
            )}
          </Suspense>
          
          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.5}
            scale={12}
            blur={2.5}
            far={5}
            color="#000030"
          />
          
          {debug && <OrbitControls />}
        </Canvas>

        {/* Vignette effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 100%)',
            zIndex: 10,
          }}
        />
        
        {/* Model badge */}
        <div 
          className="absolute bottom-3 right-3 text-xs text-white/30 pointer-events-none"
          style={{ zIndex: 11 }}
        >
          Avatar Mixamo • LSF
        </div>
      </div>
    );
  }

export default MixamoAvatar3D;
