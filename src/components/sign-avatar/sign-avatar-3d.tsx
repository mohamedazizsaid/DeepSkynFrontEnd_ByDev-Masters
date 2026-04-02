// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarFrame, AvatarKeypoint } from './sign-avatar-renderer';

interface SignAvatar3DProps {
  frame: AvatarFrame | null;
  styleMode: 'cartoon' | 'skeleton' | 'silhouette';
  isDark?: boolean;
  utterance?: string;
}

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const HAND_FINGER_CHAINS: Array<[number, number, number, number]> = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];

function createDefaultFrame(): AvatarFrame {
  const pose: AvatarKeypoint[] = Array.from({ length: 25 }, (_, i) => ({
    id: `pose-${i}`,
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  pose[0] = { id: 'nose', x: 0.5, y: 0.17, z: 0 };
  pose[11] = { id: 'left_shoulder', x: 0.4, y: 0.31, z: 0 };
  pose[12] = { id: 'right_shoulder', x: 0.6, y: 0.31, z: 0 };
  pose[13] = { id: 'left_elbow', x: 0.34, y: 0.47, z: 0 };
  pose[14] = { id: 'right_elbow', x: 0.66, y: 0.47, z: 0 };
  pose[15] = { id: 'left_wrist', x: 0.33, y: 0.62, z: 0 };
  pose[16] = { id: 'right_wrist', x: 0.67, y: 0.62, z: 0 };
  pose[23] = { id: 'left_hip', x: 0.44, y: 0.73, z: 0 };
  pose[24] = { id: 'right_hip', x: 0.56, y: 0.73, z: 0 };

  const makeHand = (centerX: number, centerY: number, right: boolean): AvatarKeypoint[] => {
    const s = right ? 1 : -1;
    return [
      { id: 'wrist', x: centerX, y: centerY, z: 0 },
      { id: 'thumb_cmc', x: centerX + s * 0.02, y: centerY - 0.01, z: 0 },
      { id: 'thumb_mcp', x: centerX + s * 0.03, y: centerY - 0.02, z: 0 },
      { id: 'thumb_ip', x: centerX + s * 0.04, y: centerY - 0.03, z: 0 },
      { id: 'thumb_tip', x: centerX + s * 0.05, y: centerY - 0.04, z: 0 },
      { id: 'index_mcp', x: centerX + s * 0.012, y: centerY - 0.03, z: 0 },
      { id: 'index_pip', x: centerX + s * 0.015, y: centerY - 0.055, z: 0 },
      { id: 'index_dip', x: centerX + s * 0.018, y: centerY - 0.075, z: 0 },
      { id: 'index_tip', x: centerX + s * 0.02, y: centerY - 0.09, z: 0 },
      { id: 'middle_mcp', x: centerX, y: centerY - 0.035, z: 0 },
      { id: 'middle_pip', x: centerX, y: centerY - 0.06, z: 0 },
      { id: 'middle_dip', x: centerX, y: centerY - 0.082, z: 0 },
      { id: 'middle_tip', x: centerX, y: centerY - 0.098, z: 0 },
      { id: 'ring_mcp', x: centerX - s * 0.01, y: centerY - 0.03, z: 0 },
      { id: 'ring_pip', x: centerX - s * 0.012, y: centerY - 0.054, z: 0 },
      { id: 'ring_dip', x: centerX - s * 0.014, y: centerY - 0.074, z: 0 },
      { id: 'ring_tip', x: centerX - s * 0.016, y: centerY - 0.088, z: 0 },
      { id: 'pinky_mcp', x: centerX - s * 0.02, y: centerY - 0.025, z: 0 },
      { id: 'pinky_pip', x: centerX - s * 0.025, y: centerY - 0.045, z: 0 },
      { id: 'pinky_dip', x: centerX - s * 0.028, y: centerY - 0.06, z: 0 },
      { id: 'pinky_tip', x: centerX - s * 0.03, y: centerY - 0.07, z: 0 },
    ];
  };

  return {
    pose_keypoints: pose,
    hand_left_keypoints: makeHand(0.33, 0.62, false),
    hand_right_keypoints: makeHand(0.67, 0.62, true),
  };
}

function ensureFrame(frame: AvatarFrame | null): AvatarFrame {
  const fallback = createDefaultFrame();
  const fill = (src: AvatarKeypoint[] | undefined, minLen: number, pool: AvatarKeypoint[]) => {
    const list = src && src.length > 0 ? src : pool;
    if (list.length >= minLen) return list;
    const out = [...list];
    while (out.length < minLen) {
      out.push(pool[Math.min(out.length, pool.length - 1)]);
    }
    return out;
  };

  return {
    pose_keypoints: fill(frame?.pose_keypoints, 25, fallback.pose_keypoints),
    hand_left_keypoints: fill(frame?.hand_left_keypoints, 21, fallback.hand_left_keypoints),
    hand_right_keypoints: fill(frame?.hand_right_keypoints, 21, fallback.hand_right_keypoints),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toWorld(kp: AvatarKeypoint): THREE.Vector3 {
  const x = clamp(kp.x, 0, 1);
  const y = clamp(kp.y, 0, 1);
  const z = clamp(kp.z, -1, 1);

  return new THREE.Vector3(
    (x - 0.5) * 1.9,
    (0.56 - y) * 2.15,
    -z * 0.42,
  );
}

// Centered version for hands-only modes (skeleton/silhouette)
// Centers the hand in the viewport and zooms in
function toWorldCentered(kp: AvatarKeypoint, handCenter: { x: number; y: number }, isRight: boolean): THREE.Vector3 {
  const x = clamp(kp.x, 0, 1);
  const y = clamp(kp.y, 0, 1);
  const z = clamp(kp.z, -1, 1);

  // Offset to center the hand
  const offsetX = isRight ? -0.25 : 0.25; // Spread hands apart horizontally
  
  // Scale and center the keypoints relative to hand center
  return new THREE.Vector3(
    ((x - handCenter.x) * 2.5) + offsetX, // Scale up and center, offset for left/right
    ((handCenter.y - y) * 2.5) + 0.1,     // Scale up and center vertically
    -z * 0.5 + 0.3,                        // Push forward
  );
}

function segmentTransform(start: THREE.Vector3, end: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(dir.length(), 0.0001);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );
  return { length, mid, quat };
}

function Segment({
  start,
  end,
  radius,
  color,
  opacity = 1,
  roughness = 0.5,
  alwaysOnTop = false,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  color: string;
  opacity?: number;
  roughness?: number;
  alwaysOnTop?: boolean;
}) {
  const { length, mid, quat } = segmentTransform(start, end);
  return (
    <mesh
      position={[mid.x, mid.y, mid.z]}
      quaternion={[quat.x, quat.y, quat.z, quat.w]}
      castShadow
      receiveShadow
      renderOrder={alwaysOnTop ? 30 : 10}
    >
      <cylinderGeometry args={[radius, radius * 0.9, length, 14]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={0.03}
        transparent={opacity < 1}
        opacity={opacity}
        depthTest={!alwaysOnTop}
        depthWrite={!alwaysOnTop}
      />
    </mesh>
  );
}

function createProceduralHandMaps(baseHex: string) {
  const size = 96;
  const c = new THREE.Color(baseHex);

  const colorData = new Uint8Array(size * size * 3);
  const roughData = new Uint8Array(size * size);
  const normalData = new Uint8Array(size * size * 3);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      const u = x / (size - 1);
      const v = y / (size - 1);

      const pore = 0.5 + 0.5 * Math.sin(u * 84 + v * 47);
      const fold = 0.5 + 0.5 * Math.sin((u + v * 0.5) * 26);
      const tint = THREE.MathUtils.clamp(0.9 + (pore - 0.5) * 0.08 + (fold - 0.5) * 0.1, 0.78, 1.08);

      colorData[i * 3] = Math.round(THREE.MathUtils.clamp(c.r * 255 * tint, 0, 255));
      colorData[i * 3 + 1] = Math.round(THREE.MathUtils.clamp(c.g * 255 * tint, 0, 255));
      colorData[i * 3 + 2] = Math.round(THREE.MathUtils.clamp(c.b * 255 * tint, 0, 255));

      roughData[i] = Math.round(THREE.MathUtils.clamp(162 + (0.5 - pore) * 44 + (0.5 - fold) * 24, 95, 230));

      const nx = Math.round(128 + (pore - 0.5) * 28);
      const ny = Math.round(128 + (fold - 0.5) * 24);
      normalData[i * 3] = THREE.MathUtils.clamp(nx, 96, 160);
      normalData[i * 3 + 1] = THREE.MathUtils.clamp(ny, 96, 160);
      normalData[i * 3 + 2] = 255;
    }
  }

  const colorMap = new THREE.DataTexture(colorData, size, size, THREE.RGBFormat);
  colorMap.needsUpdate = true;
  colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(2, 2);

  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RedFormat);
  roughnessMap.needsUpdate = true;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);

  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBFormat);
  normalMap.needsUpdate = true;
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2, 2);

  return { colorMap, roughnessMap, normalMap };
}

function OvalPhalanx({
  start,
  end,
  radiusTop,
  radiusBottom,
  axisScale,
  material,
  renderOrder = 30,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radiusTop: number;
  radiusBottom: number;
  axisScale: number;
  material: React.ReactNode;
  renderOrder?: number;
}) {
  const { length, mid, quat } = segmentTransform(start, end);
  return (
    <mesh
      position={[mid.x, mid.y, mid.z]}
      quaternion={[quat.x, quat.y, quat.z, quat.w]}
      castShadow
      receiveShadow
      renderOrder={renderOrder}
      scale={[axisScale, 1, 1]}
    >
      <cylinderGeometry args={[radiusTop, radiusBottom, length, 18, 1, false]} />
      {material}
    </mesh>
  );
}

function PalmCrease({
  points,
  color,
  opacity,
  width,
  renderOrder = 36,
}: {
  points: THREE.Vector3[];
  color: string;
  opacity: number;
  width: number;
  renderOrder?: number;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5), [points]);
  return (
    <mesh renderOrder={renderOrder}>
      <tubeGeometry args={[curve, 30, width, 10, false]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.78}
        metalness={0}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function Hand({
  keypoints,
  skin,
  bone,
  isSkeleton,
  wristAnchor,
  centered,
  isRight,
}: {
  keypoints: AvatarKeypoint[];
  skin: string;
  bone: string;
  isSkeleton: boolean;
  wristAnchor?: THREE.Vector3; // Position from body pose_keypoints
  centered?: boolean; // For hands-only modes (skeleton/silhouette)
  isRight?: boolean; // Is this the right hand
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Convert keypoints to world space and anchor to body wrist position
  const pts = useMemo(() => {
    if (keypoints.length === 0) return [];
    
    // For centered mode (hands-only), center the hands in view
    if (centered) {
      // Calculate hand center from wrist position
      const wristKp = keypoints[0];
      const handCenter = { x: wristKp.x, y: wristKp.y };
      
      // Use centered transformation
      return keypoints.map((kp) => toWorldCentered(kp, handCenter, isRight ?? false));
    }
    
    // First convert all keypoints to world space
    const worldPts = keypoints.map((kp) => toWorld(kp));
    
    // If we have a wrist anchor from the body, reposition the hand relative to it
    if (wristAnchor && worldPts.length > 0) {
      const handWrist = worldPts[0]; // Index 0 is wrist in hand keypoints
      const offset = new THREE.Vector3().subVectors(wristAnchor, handWrist);
      
      // Move all points to align with body wrist and push forward
      return worldPts.map((p) => {
        return new THREE.Vector3(
          p.x + offset.x,
          p.y + offset.y,
          p.z + offset.z + 0.25 // Push significantly forward to appear in front of body
        );
      });
    }
    
    // Fallback: just push forward
    return worldPts.map((p) => new THREE.Vector3(p.x, p.y, p.z + 0.25));
  }, [keypoints, wristAnchor, centered, isRight]);

  const maps = useMemo(() => createProceduralHandMaps(skin), [skin]);

  // Early return if no keypoints
  if (pts.length < 21) {
    return null;
  }

  const wristToMiddle = new THREE.Vector3().subVectors(pts[9], pts[0]);
  const palmYaw = Math.atan2(wristToMiddle.x, wristToMiddle.y) * 0.6;
  const isRightHand = pts[5].x > pts[17].x;
  const side = isRightHand ? 1 : -1;

  const wrist = pts[0];
  const mcp = [pts[5], pts[9], pts[13], pts[17]];
  const palmCenter = mcp.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(1 / mcp.length);
  const palmRadius = isSkeleton ? 0.03 : 0.043;
  const handSkin = isSkeleton ? bone : skin;
  const skinShadow = isSkeleton ? bone : '#d8ad92';
  const creaseColor = isSkeleton ? bone : '#b27963';

  const segmentRadiusByChain = [
    [0.012, 0.0102, 0.0088],
    [0.0145, 0.0118, 0.0102],
    [0.0152, 0.0122, 0.0108],
    [0.0138, 0.0108, 0.0096],
    [0.0115, 0.0096, 0.0086],
  ];

  const jointIndices = [
    1, 2, 3,
    5, 6, 7,
    9, 10, 11,
    13, 14, 15,
    17, 18, 19,
  ];

  useFrame((state) => {
    if (!groupRef.current || isSkeleton) return;
    const t = state.clock.elapsedTime;
    const sideOffset = isRightHand ? 0 : 0.9;
    const drift = Math.sin(t * 1.25 + sideOffset) * 0.003;
    const pulse = Math.sin(t * 5.3 + palmCenter.x * 2.6) * 0.0036;
    const yawSway = Math.sin(t * 1.6 + sideOffset * 0.8) * 0.0026;
    const verticalMicro = Math.sin(t * 2.15 + sideOffset) * 0.0018;
    groupRef.current.rotation.x = drift;
    groupRef.current.rotation.y = yawSway;
    groupRef.current.rotation.z = pulse;
    groupRef.current.position.y = verticalMicro;
  });

  const palmU = new THREE.Vector3().subVectors(pts[5], pts[17]).normalize();
  const palmV = new THREE.Vector3().subVectors(pts[9], pts[0]).normalize();

  const palmPoint = (uOffset: number, vOffset: number, zOffset = 0.012) => (
    new THREE.Vector3()
      .copy(palmCenter)
      .add(new THREE.Vector3().copy(palmU).multiplyScalar(uOffset))
      .add(new THREE.Vector3().copy(palmV).multiplyScalar(vOffset))
      .add(new THREE.Vector3(0, 0, zOffset))
  );

  return (
    <group ref={groupRef}>
      <group position={[palmCenter.x, palmCenter.y, palmCenter.z]} rotation={[0, palmYaw, 0]}>
        <mesh castShadow receiveShadow renderOrder={31}>
          <sphereGeometry args={[palmRadius, 26, 20]} />
          <meshPhysicalMaterial
            color={handSkin}
            map={isSkeleton ? undefined : maps.colorMap}
            roughnessMap={isSkeleton ? undefined : maps.roughnessMap}
            normalMap={isSkeleton ? undefined : maps.normalMap}
            normalScale={isSkeleton ? new THREE.Vector2(0, 0) : new THREE.Vector2(0.42, 0.42)}
            roughness={0.5}
            metalness={0.02}
            clearcoat={0.14}
            clearcoatRoughness={0.8}
            sheen={0.2}
            sheenRoughness={0.58}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {!isSkeleton && (
          <>
            <mesh position={[side * 0.016, -0.011, 0.004]} scale={[1.55, 1.22, 0.8]} castShadow receiveShadow renderOrder={31}>
              <sphereGeometry args={[palmRadius, 24, 20]} />
              <meshPhysicalMaterial
                color={handSkin}
                map={maps.colorMap}
                roughnessMap={maps.roughnessMap}
                normalMap={maps.normalMap}
                normalScale={new THREE.Vector2(0.36, 0.36)}
                roughness={0.48}
                metalness={0.02}
                clearcoat={0.14}
                clearcoatRoughness={0.84}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[side * 0.029, -0.015, -0.007]} scale={[0.86, 0.82, 0.72]} castShadow receiveShadow renderOrder={31}>
              <sphereGeometry args={[palmRadius * 0.88, 18, 16]} />
              <meshStandardMaterial
                color={skinShadow}
                roughness={0.64}
                metalness={0.01}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>

            <PalmCrease
              points={[
                palmPoint(side * 0.03, -0.002, 0.016),
                palmPoint(side * 0.016, -0.005, 0.017),
                palmPoint(0, -0.009, 0.017),
                palmPoint(-side * 0.02, -0.013, 0.016),
              ]}
              color={creaseColor}
              opacity={0.34}
              width={0.0014}
            />
            <PalmCrease
              points={[
                palmPoint(side * 0.024, 0.016, 0.016),
                palmPoint(side * 0.01, 0.012, 0.017),
                palmPoint(-side * 0.008, 0.007, 0.017),
                palmPoint(-side * 0.021, 0.004, 0.016),
              ]}
              color={creaseColor}
              opacity={0.26}
              width={0.0012}
            />
            <PalmCrease
              points={[
                palmPoint(side * 0.02, -0.021, 0.015),
                palmPoint(side * 0.008, -0.024, 0.016),
                palmPoint(-side * 0.007, -0.027, 0.016),
                palmPoint(-side * 0.018, -0.03, 0.015),
              ]}
              color={creaseColor}
              opacity={0.22}
              width={0.0011}
            />
          </>
        )}
      </group>

      {!isSkeleton && (
        <OvalPhalanx
          start={wrist}
          end={palmCenter}
          radiusTop={0.016}
          radiusBottom={0.013}
          axisScale={1.18}
          material={(
            <meshPhysicalMaterial
              color={handSkin}
              map={maps.colorMap}
              roughnessMap={maps.roughnessMap}
              normalMap={maps.normalMap}
              normalScale={new THREE.Vector2(0.35, 0.35)}
              roughness={0.54}
              clearcoat={0.08}
              clearcoatRoughness={0.88}
              depthTest={false}
              depthWrite={false}
            />
          )}
        />
      )}

      {isSkeleton && HAND_CONNECTIONS.map(([a, b], idx) => (
        <Segment
          key={`h-skel-${idx}`}
          start={pts[a]}
          end={pts[b]}
          radius={0.008}
          color={bone}
          opacity={0.92}
          roughness={0.32}
          alwaysOnTop
        />
      ))}

      {!isSkeleton && HAND_FINGER_CHAINS.map((chain, chainIndex) => {
        const [a, b, c, d] = chain;
        const [r1, r2, r3] = segmentRadiusByChain[chainIndex];
        const axisScale = chainIndex === 0 ? 1.4 : 1.15;

        return (
          <React.Fragment key={`finger-vol-${chainIndex}`}>
            <OvalPhalanx
              start={pts[a]}
              end={pts[b]}
              radiusTop={r1}
              radiusBottom={r2}
              axisScale={axisScale}
              material={(
                <meshPhysicalMaterial
                  color={handSkin}
                  map={maps.colorMap}
                  roughnessMap={maps.roughnessMap}
                  normalMap={maps.normalMap}
                  normalScale={new THREE.Vector2(0.3, 0.3)}
                  roughness={0.52}
                  clearcoat={0.08}
                  clearcoatRoughness={0.86}
                  depthTest={false}
                  depthWrite={false}
                />
              )}
            />
            <OvalPhalanx
              start={pts[b]}
              end={pts[c]}
              radiusTop={r2}
              radiusBottom={r3}
              axisScale={axisScale * 0.96}
              material={(
                <meshPhysicalMaterial
                  color={handSkin}
                  map={maps.colorMap}
                  roughnessMap={maps.roughnessMap}
                  normalMap={maps.normalMap}
                  normalScale={new THREE.Vector2(0.28, 0.28)}
                  roughness={0.53}
                  clearcoat={0.07}
                  clearcoatRoughness={0.87}
                  depthTest={false}
                  depthWrite={false}
                />
              )}
            />
            <OvalPhalanx
              start={pts[c]}
              end={pts[d]}
              radiusTop={r3}
              radiusBottom={Math.max(r3 * 0.7, 0.0065)}
              axisScale={axisScale * 0.92}
              material={(
                <meshPhysicalMaterial
                  color={handSkin}
                  map={maps.colorMap}
                  roughnessMap={maps.roughnessMap}
                  normalMap={maps.normalMap}
                  normalScale={new THREE.Vector2(0.24, 0.24)}
                  roughness={0.54}
                  clearcoat={0.06}
                  clearcoatRoughness={0.9}
                  depthTest={false}
                  depthWrite={false}
                />
              )}
            />
          </React.Fragment>
        );
      })}

      {!isSkeleton && jointIndices.map((idx) => {
        const p = pts[idx];
        return (
          <group key={`joint-wrap-${idx}`} position={[p.x, p.y, p.z]}>
            <mesh castShadow renderOrder={31}>
              <sphereGeometry args={[idx % 4 === 1 ? 0.0125 : 0.0102, 14, 12]} />
              <meshPhysicalMaterial
                color={handSkin}
                map={maps.colorMap}
                roughnessMap={maps.roughnessMap}
                normalMap={maps.normalMap}
                normalScale={new THREE.Vector2(0.23, 0.23)}
                roughness={0.5}
                metalness={0.02}
                clearcoat={0.08}
                clearcoatRoughness={0.86}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.12, 0.56, 1]} renderOrder={32}>
              <torusGeometry args={[0.008, 0.0012, 8, 18]} />
              <meshStandardMaterial color="#c79174" roughness={0.72} metalness={0} depthTest={false} depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {[4, 8, 12, 16, 20].map((tipIdx) => {
        const p = pts[tipIdx];
        return (
          <mesh key={`tip-${tipIdx}`} position={[p.x, p.y, p.z]} castShadow renderOrder={32}>
            <sphereGeometry args={[isSkeleton ? 0.011 : 0.0132, 14, 12]} />
            <meshPhysicalMaterial
              color={isSkeleton ? '#e8f3ff' : '#f7d1b8'}
              roughness={0.34}
              metalness={0.03}
              clearcoat={0.08}
              clearcoatRoughness={0.88}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {!isSkeleton && [4, 8, 12, 16, 20].map((tipIdx) => {
        const tip = pts[tipIdx];
        const prev = pts[Math.max(0, tipIdx - 1)];
        const dir = new THREE.Vector3().subVectors(tip, prev).normalize();
        const nailPos = new THREE.Vector3().copy(tip).add(dir.multiplyScalar(0.0088));
        return (
          <group key={`nail-g-${tipIdx}`} position={[nailPos.x, nailPos.y + 0.0012, nailPos.z + 0.0012]}>
            <mesh castShadow renderOrder={33} scale={[1.26, 0.42, 0.165]}>
              <sphereGeometry args={[0.0084, 14, 12]} />
              <meshPhysicalMaterial
                color="#f5d2ca"
                roughness={0.12}
                transmission={0.2}
                thickness={0.055}
                metalness={0.01}
                clearcoat={0.26}
                clearcoatRoughness={0.18}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, -0.00145, -0.0008]} renderOrder={34} scale={[0.58, 0.3, 0.14]}>
              <sphereGeometry args={[0.0086, 10, 8]} />
              <meshStandardMaterial color="#f3c0b5" roughness={0.32} metalness={0} depthTest={false} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.00055, 0.00265]} renderOrder={35} scale={[0.72, 0.08, 0.07]}>
              <sphereGeometry args={[0.0084, 12, 10]} />
              <meshStandardMaterial color="#fff3ef" roughness={0.06} metalness={0.01} depthTest={false} depthWrite={false} />
            </mesh>
            <mesh position={[0.00335, -0.0001, 0.0006]} renderOrder={35} scale={[0.22, 0.75, 0.12]}>
              <boxGeometry args={[0.0032, 0.0052, 0.0007]} />
              <meshStandardMaterial color="#efd4cc" roughness={0.2} metalness={0} depthTest={false} depthWrite={false} />
            </mesh>
            <mesh position={[-0.00335, -0.0001, 0.0006]} renderOrder={35} scale={[0.22, 0.75, 0.12]}>
              <boxGeometry args={[0.0032, 0.0052, 0.0007]} />
              <meshStandardMaterial color="#efd4cc" roughness={0.2} metalness={0} depthTest={false} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function AvatarRig({
  frame,
  styleMode,
  utterance,
}: {
  frame: AvatarFrame;
  styleMode: 'cartoon' | 'skeleton' | 'silhouette';
  utterance?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const chestRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  const palette = useMemo(() => {
    if (styleMode === 'skeleton') {
      return {
        skin: '#8ec5ff',
        cloth: '#4a7dcc',
        bone: '#a8d5ff',
        head: '#d4ebff',
        hair: '#5a9aff',
        eye: '#1a4a8a',
        iris: '#2d6bc4',
        shirt: '#3a6bb8',
        accent: '#7cb3ff',
      };
    }
    if (styleMode === 'silhouette') {
      return {
        skin: '#0f172a',
        cloth: '#0b1220',
        bone: '#1f2f49',
        head: '#111b2f',
        hair: '#080d15',
        eye: '#1a2540',
        iris: '#0a1525',
        shirt: '#0d1825',
        accent: '#1a2a40',
      };
    }
    return {
      skin: '#f5d0b5',
      cloth: '#1e40af',
      bone: '#b7d9ff',
      head: '#f7d5bc',
      hair: '#3d2314',
      eye: '#ffffff',
      iris: '#4a6741',
      shirt: '#2563eb',
      accent: '#3b82f6',
    };
  }, [styleMode]);

  const pose = frame.pose_keypoints;
  const lShoulder = toWorld(pose[11]);
  const rShoulder = toWorld(pose[12]);
  const lElbow = toWorld(pose[13]);
  const rElbow = toWorld(pose[14]);
  const lWrist = toWorld(pose[15]);
  const rWrist = toWorld(pose[16]);
  const lHip = toWorld(pose[23]);
  const rHip = toWorld(pose[24]);
  const nose = toWorld(pose[0]);

  const shoulderCenter = new THREE.Vector3().addVectors(lShoulder, rShoulder).multiplyScalar(0.5);
  const hipCenter = new THREE.Vector3().addVectors(lHip, rHip).multiplyScalar(0.5);
  const torsoCenter = new THREE.Vector3().addVectors(shoulderCenter, hipCenter).multiplyScalar(0.5);
  const headCenter = new THREE.Vector3(nose.x, nose.y + 0.12, nose.z - 0.01);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Keep framing stable while adding subtle organic life (sway + breathing).
    const targetX = 0;
    const targetY = -0.08;
    const targetZ = 0;
    const bodySwayX = Math.sin(t * 0.9) * 0.012;
    const bodySwayY = Math.sin(t * 1.8) * 0.006;
    const bodyYaw = Math.sin(t * 0.75 + 0.2) * 0.05;
    const bodyRoll = Math.sin(t * 0.95 + 0.7) * 0.025;
    const breath = 1 + Math.sin(t * 1.6 + 0.4) * 0.032;

    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX + bodySwayX, 7, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 7, delta) + bodySwayY;
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 7, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, bodyYaw, 9, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, bodyRoll, 9, delta);

    if (chestRef.current) {
      chestRef.current.scale.x = THREE.MathUtils.damp(chestRef.current.scale.x, breath * 1.02, 6, delta);
      chestRef.current.scale.y = THREE.MathUtils.damp(chestRef.current.scale.y, 1 + (breath - 1) * 0.65, 6, delta);
      chestRef.current.scale.z = THREE.MathUtils.damp(chestRef.current.scale.z, breath, 6, delta);
    }

    if (mouthRef.current) {
      const speaking = utterance && utterance.trim().length > 0;
      const open = speaking ? 0.7 + Math.sin(t * 7.5) * 0.25 : 0.35;
      mouthRef.current.scale.y = THREE.MathUtils.damp(mouthRef.current.scale.y, open, 8, delta);
    }

    // Eye blinking animation
    const blinkCycle = t % 4.5;
    const blinkAmount = blinkCycle < 0.15 ? Math.sin((blinkCycle / 0.15) * Math.PI) * 0.85 : 0;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = 1 - blinkAmount;
      rightEyeRef.current.scale.y = 1 - blinkAmount;
    }

    // Eyebrow subtle animation (expressive)
    const browLift = Math.sin(t * 0.8) * 0.003;
    if (leftBrowRef.current && rightBrowRef.current) {
      leftBrowRef.current.position.y = 0.115 + browLift;
      rightBrowRef.current.position.y = 0.115 + browLift;
    }
  });

  const skeleton = styleMode === 'skeleton';
  const handsOnly = styleMode === 'skeleton' || styleMode === 'silhouette';

  // For hands-only modes (skeleton/silhouette), only render the hands
  if (handsOnly) {
    return (
      <group ref={groupRef}>
        <Hand keypoints={frame.hand_left_keypoints} skin={palette.skin} bone={palette.bone} isSkeleton={skeleton} centered={true} isRight={false} />
        <Hand keypoints={frame.hand_right_keypoints} skin={palette.skin} bone={palette.bone} isSkeleton={skeleton} centered={true} isRight={true} />
      </group>
    );
  }

  // Full body render for cartoon mode
  return (
    <group ref={groupRef}>
      {/* Torso/Body - Professional shirt with collar */}
      <Segment
        start={shoulderCenter}
        end={hipCenter}
        radius={0.088}
        color={palette.shirt}
        roughness={0.6}
      />

      {/* Shoulders */}
      <Segment start={lShoulder} end={rShoulder} radius={0.058} color={palette.shirt} />
      <Segment start={lHip} end={rHip} radius={0.062} color={palette.shirt} />
      
      {/* Chest with shirt */}
      <mesh ref={chestRef} position={[torsoCenter.x, torsoCenter.y + 0.06, torsoCenter.z + 0.02]} castShadow receiveShadow>
        <sphereGeometry args={[0.128, 28, 22]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.62} metalness={0.02} />
      </mesh>
      
      {/* Shirt collar left */}
      <mesh position={[shoulderCenter.x - 0.04, shoulderCenter.y + 0.04, shoulderCenter.z + 0.06]} rotation={[0.3, 0.4, 0.2]}>
        <boxGeometry args={[0.025, 0.045, 0.01]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.5} />
      </mesh>
      {/* Shirt collar right */}
      <mesh position={[shoulderCenter.x + 0.04, shoulderCenter.y + 0.04, shoulderCenter.z + 0.06]} rotation={[0.3, -0.4, -0.2]}>
        <boxGeometry args={[0.025, 0.045, 0.01]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.5} />
      </mesh>
      
      {/* Shirt V-neck accent */}
      <mesh position={[shoulderCenter.x, shoulderCenter.y + 0.02, shoulderCenter.z + 0.08]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.025, 0.05, 3]} />
        <meshStandardMaterial color={palette.accent} roughness={0.55} />
      </mesh>

      {/* Arms */}
      <Segment start={lShoulder} end={lElbow} radius={0.04} color={palette.shirt} />
      <Segment start={lElbow} end={lWrist} radius={0.028} color={palette.skin} />
      <Segment start={rShoulder} end={rElbow} radius={0.04} color={palette.shirt} />
      <Segment start={rElbow} end={rWrist} radius={0.028} color={palette.skin} />

      {/* Neck */}
      <Segment start={new THREE.Vector3(shoulderCenter.x, shoulderCenter.y + 0.03, shoulderCenter.z)} end={headCenter} radius={0.048} color={palette.skin} />

      {/* Head */}
      <mesh position={[headCenter.x, headCenter.y + 0.07, headCenter.z]} castShadow receiveShadow>
        <sphereGeometry args={[0.155, 32, 32]} />
        <meshPhysicalMaterial 
          color={palette.head} 
          roughness={0.42} 
          metalness={0.01}
          clearcoat={0.08}
          clearcoatRoughness={0.6}
        />
      </mesh>

      {/* Hair - Stylized professional look */}
      <mesh position={[headCenter.x, headCenter.y + 0.16, headCenter.z - 0.02]} castShadow>
        <sphereGeometry args={[0.14, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={palette.hair} roughness={0.75} metalness={0.05} />
      </mesh>
      {/* Hair sides */}
      <mesh position={[headCenter.x - 0.12, headCenter.y + 0.09, headCenter.z - 0.02]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color={palette.hair} roughness={0.72} />
      </mesh>
      <mesh position={[headCenter.x + 0.12, headCenter.y + 0.09, headCenter.z - 0.02]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color={palette.hair} roughness={0.72} />
      </mesh>
      {/* Hair back */}
      <mesh position={[headCenter.x, headCenter.y + 0.06, headCenter.z - 0.14]}>
        <sphereGeometry args={[0.11, 20, 14]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>

      {/* Ears */}
      <mesh position={[headCenter.x - 0.145, headCenter.y + 0.07, headCenter.z]} rotation={[0, -0.3, 0]}>
        <sphereGeometry args={[0.028, 12, 10]} />
        <meshStandardMaterial color={palette.head} roughness={0.5} />
      </mesh>
      <mesh position={[headCenter.x + 0.145, headCenter.y + 0.07, headCenter.z]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.028, 12, 10]} />
        <meshStandardMaterial color={palette.head} roughness={0.5} />
      </mesh>

      {/* Left Eye Group */}
      <group ref={leftEyeRef} position={[headCenter.x - 0.048, headCenter.y + 0.085, headCenter.z + 0.13]}>
        {/* Eye white */}
        <mesh>
          <sphereGeometry args={[0.022, 16, 14]} />
          <meshPhysicalMaterial color={palette.eye} roughness={0.15} metalness={0} clearcoat={0.3} />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.012]}>
          <sphereGeometry args={[0.012, 14, 12]} />
          <meshStandardMaterial color={palette.iris} roughness={0.2} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.018]}>
          <sphereGeometry args={[0.006, 10, 10]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[0.004, 0.005, 0.021]}>
          <sphereGeometry args={[0.0025, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Right Eye Group */}
      <group ref={rightEyeRef} position={[headCenter.x + 0.048, headCenter.y + 0.085, headCenter.z + 0.13]}>
        {/* Eye white */}
        <mesh>
          <sphereGeometry args={[0.022, 16, 14]} />
          <meshPhysicalMaterial color={palette.eye} roughness={0.15} metalness={0} clearcoat={0.3} />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.012]}>
          <sphereGeometry args={[0.012, 14, 12]} />
          <meshStandardMaterial color={palette.iris} roughness={0.2} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.018]}>
          <sphereGeometry args={[0.006, 10, 10]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
        </mesh>
        {/* Eye highlight */}
        <mesh position={[0.004, 0.005, 0.021]}>
          <sphereGeometry args={[0.0025, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh ref={leftBrowRef} position={[headCenter.x - 0.048, headCenter.y + 0.115, headCenter.z + 0.125]} rotation={[0.1, 0, 0.15]}>
        <boxGeometry args={[0.04, 0.008, 0.012]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      <mesh ref={rightBrowRef} position={[headCenter.x + 0.048, headCenter.y + 0.115, headCenter.z + 0.125]} rotation={[0.1, 0, -0.15]}>
        <boxGeometry args={[0.04, 0.008, 0.012]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>

      {/* Nose */}
      <mesh position={[headCenter.x, headCenter.y + 0.055, headCenter.z + 0.145]}>
        <sphereGeometry args={[0.018, 12, 10]} />
        <meshStandardMaterial color={palette.head} roughness={0.5} />
      </mesh>
      <mesh position={[headCenter.x, headCenter.y + 0.045, headCenter.z + 0.155]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <meshStandardMaterial color={palette.head} roughness={0.55} />
      </mesh>

      {/* Mouth - Animated */}
      <mesh ref={mouthRef} position={[headCenter.x, headCenter.y + 0.02, headCenter.z + 0.148]}>
        <sphereGeometry args={[0.022, 14, 12]} />
        <meshStandardMaterial color="#c76b6e" roughness={0.35} />
      </mesh>
      {/* Lips outline */}
      <mesh position={[headCenter.x, headCenter.y + 0.028, headCenter.z + 0.152]} scale={[1.3, 0.4, 0.5]}>
        <sphereGeometry args={[0.018, 12, 10]} />
        <meshStandardMaterial color="#d18080" roughness={0.4} />
      </mesh>

      <Hand keypoints={frame.hand_left_keypoints} skin={palette.skin} bone={palette.bone} isSkeleton={false} wristAnchor={lWrist} />
      <Hand keypoints={frame.hand_right_keypoints} skin={palette.skin} bone={palette.bone} isSkeleton={false} wristAnchor={rWrist} />
    </group>
  );
}

export function SignAvatar3D({ frame, styleMode, isDark = true, utterance }: SignAvatar3DProps) {
  const safeFrame = useMemo(() => ensureFrame(frame), [frame]);
  
  // Adjust camera position based on mode
  const handsOnly = styleMode === 'skeleton' || styleMode === 'silhouette';
  const cameraPosition: [number, number, number] = handsOnly 
    ? [0, 0.15, 1.8]  // Closer and slightly higher for hands-only view
    : [0, 0.06, 2.35]; // Default for full body
  const cameraFov = handsOnly ? 45 : 32; // Wider FOV for hands-only

  const bg = isDark
    ? 'radial-gradient(ellipse 150% 120% at 50% 5%, #1a2744 0%, #0f172a 35%, #070b14 85%, #030508 100%)'
    : 'radial-gradient(ellipse 150% 120% at 50% 5%, #e0eaff 0%, #b8d4ff 35%, #8ab8f5 85%, #6a9fea 100%)';

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: bg }}>
      {/* Subtle vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark 
            ? 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.35) 100%)'
            : 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.08) 100%)',
          zIndex: 10,
        }}
      />
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.55} />
        <directionalLight 
          position={[3, 4, 3]} 
          intensity={1.15} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-2.5, 2, 1.5]} intensity={0.4} color="#a8d4ff" />
        <spotLight 
          position={[0, 2.5, 2.8]} 
          intensity={0.55} 
          angle={0.45} 
          penumbra={0.6} 
          color="#ffe4d0"
          castShadow
        />
        {/* Rim light for professional look */}
        <pointLight position={[-1.5, 0.5, -1]} intensity={0.25} color="#8ec5ff" />
        <pointLight position={[1.5, 0.5, -1]} intensity={0.25} color="#8ec5ff" />
        
        {/* Fill light from below */}
        <directionalLight position={[0, -1, 2]} intensity={0.15} color="#e8f0ff" />

        <Environment preset="studio" />
        <AvatarRig frame={safeFrame} styleMode={styleMode} utterance={utterance} />
        <ContactShadows 
          position={[0, -1.05, 0]} 
          opacity={0.45} 
          blur={2.5} 
          scale={6} 
          far={3}
          color={isDark ? '#0a0f1a' : '#3a5080'}
        />
      </Canvas>
    </div>
  );
}

export default SignAvatar3D;