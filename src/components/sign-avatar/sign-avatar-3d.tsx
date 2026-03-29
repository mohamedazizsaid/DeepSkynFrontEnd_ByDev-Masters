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
}: {
  keypoints: AvatarKeypoint[];
  skin: string;
  bone: string;
  isSkeleton: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Keep hands slightly in front of the torso to avoid visual occlusion during fast signs.
  const pts = keypoints.map((kp) => {
    const p = toWorld(kp);
    return new THREE.Vector3(p.x, p.y, p.z + 0.1);
  });

  const maps = useMemo(() => createProceduralHandMaps(skin), [skin]);

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

  const palette = useMemo(() => {
    if (styleMode === 'skeleton') {
      return {
        skin: '#8ec5ff',
        cloth: '#65a6ff',
        bone: '#a8d5ff',
        head: '#d4ebff',
      };
    }
    if (styleMode === 'silhouette') {
      return {
        skin: '#0f172a',
        cloth: '#0b1220',
        bone: '#1f2f49',
        head: '#111b2f',
      };
    }
    return {
      skin: '#efc3a5',
      cloth: '#2f6ac8',
      bone: '#b7d9ff',
      head: '#f2c8ae',
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
  });

  const skeleton = styleMode === 'skeleton';

  return (
    <group ref={groupRef}>
      <Segment
        start={shoulderCenter}
        end={hipCenter}
        radius={skeleton ? 0.03 : 0.085}
        color={skeleton ? palette.bone : palette.cloth}
      />

      {!skeleton && (
        <>
          <Segment start={lShoulder} end={rShoulder} radius={0.055} color={palette.cloth} />
          <Segment start={lHip} end={rHip} radius={0.06} color={palette.cloth} />
          <mesh ref={chestRef} position={[torsoCenter.x, torsoCenter.y + 0.06, torsoCenter.z + 0.02]} castShadow receiveShadow>
            <sphereGeometry args={[0.125, 26, 20]} />
            <meshStandardMaterial color={palette.cloth} roughness={0.55} metalness={0.01} />
          </mesh>
        </>
      )}

      <Segment start={lShoulder} end={lElbow} radius={skeleton ? 0.014 : 0.038} color={skeleton ? palette.bone : palette.cloth} />
      <Segment start={lElbow} end={lWrist} radius={skeleton ? 0.011 : 0.026} color={palette.skin} />
      <Segment start={rShoulder} end={rElbow} radius={skeleton ? 0.014 : 0.038} color={skeleton ? palette.bone : palette.cloth} />
      <Segment start={rElbow} end={rWrist} radius={skeleton ? 0.011 : 0.026} color={palette.skin} />

      <Segment start={new THREE.Vector3(shoulderCenter.x, shoulderCenter.y + 0.03, shoulderCenter.z)} end={headCenter} radius={skeleton ? 0.015 : 0.045} color={palette.skin} />

      <mesh position={[headCenter.x, headCenter.y + 0.07, headCenter.z]} castShadow receiveShadow>
        <sphereGeometry args={[skeleton ? 0.095 : 0.16, 24, 24]} />
        <meshStandardMaterial color={skeleton ? palette.bone : palette.head} roughness={0.45} metalness={0.02} />
      </mesh>

      {!skeleton && (
        <>
          <mesh position={[headCenter.x - 0.045, headCenter.y + 0.085, headCenter.z + 0.13]}>
            <sphereGeometry args={[0.012, 10, 10]} />
            <meshStandardMaterial color="#fefefe" roughness={0.2} />
          </mesh>
          <mesh position={[headCenter.x + 0.045, headCenter.y + 0.085, headCenter.z + 0.13]}>
            <sphereGeometry args={[0.012, 10, 10]} />
            <meshStandardMaterial color="#fefefe" roughness={0.2} />
          </mesh>
          <mesh ref={mouthRef} position={[headCenter.x, headCenter.y + 0.025, headCenter.z + 0.145]}>
            <sphereGeometry args={[0.023, 10, 10]} />
            <meshStandardMaterial color="#c86e71" roughness={0.4} />
          </mesh>
        </>
      )}

      <Hand keypoints={frame.hand_left_keypoints} skin={palette.skin} bone={palette.bone} isSkeleton={skeleton} />
      <Hand keypoints={frame.hand_right_keypoints} skin={palette.skin} bone={palette.bone} isSkeleton={skeleton} />
    </group>
  );
}

export function SignAvatar3D({ frame, styleMode, isDark = true, utterance }: SignAvatar3DProps) {
  const safeFrame = useMemo(() => ensureFrame(frame), [frame]);

  const bg = isDark
    ? 'radial-gradient(120% 100% at 50% 10%, #1f2b4d 0%, #0e1630 45%, #080d1d 100%)'
    : 'radial-gradient(120% 100% at 50% 10%, #bcd5ff 0%, #8db4fa 40%, #5c82d6 100%)';

  return (
    <div className="w-full h-full" style={{ background: bg }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.08, 2.45], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.05} castShadow />
        <directionalLight position={[-2.2, 1.4, 1.1]} intensity={0.35} color="#9bc8ff" />
        <spotLight position={[0, 2.1, 2.3]} intensity={0.48} angle={0.48} penumbra={0.5} color="#ffd8be" />

        <Environment preset="city" />
        <AvatarRig frame={safeFrame} styleMode={styleMode} utterance={utterance} />
        <ContactShadows position={[0, -1.05, 0]} opacity={0.38} blur={2.2} scale={5} far={2.5} />
      </Canvas>
    </div>
  );
}

export default SignAvatar3D;