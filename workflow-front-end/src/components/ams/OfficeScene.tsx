/**
 * OfficeScene.tsx
 * Magical bioluminescent forest scene — atmospheric glow + bloom.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Vec3 = [number, number, number];

// ── Aurora (background glow source) ──────────────────────────────────────────
function Aurora() {
  return (
    <group position={[0, 4, -14]}>
      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[3.5, 64, 64]} />
        <meshStandardMaterial
          color="#001030"
          emissive="#00aaff"
          emissiveIntensity={3}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[6, 64, 64]} />
        <meshStandardMaterial
          color="#000820"
          emissive="#0044bb"
          emissiveIntensity={1.5}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#22aaff" intensity={10} distance={35} decay={1.4} />
    </group>
  );
}

// ── Ground ────────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#080614" roughness={1} />
    </mesh>
  );
}

// ── Rock ──────────────────────────────────────────────────────────────────────
function Rock({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: Vec3;
  scale?: number;
  rotation?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[0.2, rotation, 0.15]}
      scale={scale}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[0.38, 1]} />
      <meshStandardMaterial color="#050412" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

// ── Bioluminescent plant ──────────────────────────────────────────────────────
function Plant({
  position,
  color,
  scale = 1,
}: {
  position: Vec3;
  color: string;
  scale?: number;
}) {
  const stems: { offset: Vec3; height: number; tilt: number; rot: number }[] = [
    { offset: [0, 0, 0],       height: 0.38, tilt: 0,    rot: 0 },
    { offset: [0.09, 0, 0.06], height: 0.24, tilt: 0.28, rot: 72 },
    { offset: [-0.08, 0, 0.05],height: 0.30, tilt: -0.22,rot: 144 },
    { offset: [0.05, 0, -0.09],height: 0.20, tilt: 0.18, rot: 216 },
    { offset: [-0.05, 0, -0.06],height: 0.27,tilt: -0.12,rot: 288 },
  ];

  return (
    <group position={position} scale={scale}>
      {stems.map((s, i) => (
        <group
          key={i}
          position={s.offset}
          rotation={[s.tilt, (s.rot * Math.PI) / 180, 0]}
        >
          <mesh position={[0, s.height / 2, 0]} castShadow>
            <cylinderGeometry args={[0.007, 0.017, s.height, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1.5}
              roughness={0.4}
            />
          </mesh>
          {/* Glowing tip */}
          <mesh position={[0, s.height + 0.022, 0]}>
            <sphereGeometry args={[0.026, 16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={color}
              emissiveIntensity={5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Tree silhouette ───────────────────────────────────────────────────────────
function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const mat = (
    <meshStandardMaterial color="#040310" roughness={1} />
  );
  const canopy: [number, number, number, number][] = [
    [0, 3.2, 0, 1.0],
    [-0.55, 2.8, 0.2, 0.75],
    [0.6, 2.65, -0.1, 0.72],
    [0.1, 3.75, 0.3, 0.6],
    [-0.3, 3.55, -0.25, 0.65],
    [0.35, 2.45, 0.4, 0.55],
  ];

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.21, 3, 12]} />
        {mat}
      </mesh>
      {canopy.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 20, 20]} />
          {mat}
        </mesh>
      ))}
    </group>
  );
}

// ── Floating orbs ─────────────────────────────────────────────────────────────
type OrbData = {
  id: number;
  pos: Vec3;
  size: number;
  speed: number;
  drift: number;
  phase: number;
};

function FloatingOrbs() {
  const orbs = useMemo<OrbData[]>(() => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      pos: [rand(-5.5, 5.5), rand(0.2, 1.8), rand(-9, 1.5)] as Vec3,
      size: rand(0.03, 0.09),
      speed: rand(0.1, 0.22),
      drift: rand(0.25, 0.6),
      phase: rand(0, Math.PI * 2),
    }));
  }, []);

  return (
    <>
      {orbs.map((o) => (
        <Orb key={o.id} data={o} />
      ))}
    </>
  );
}

function Orb({ data }: { data: OrbData }) {
  const ref = useRef<THREE.Mesh>(null);
  const { pos, size, speed, drift, phase } = data;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    const loop = t % 5;
    ref.current.position.set(
      pos[0] + Math.sin(t * 0.9) * drift * 0.45,
      pos[1] + loop,
      pos[2] + Math.cos(t * 0.55) * drift * 0.2
    );
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.opacity = Math.sin((loop / 5) * Math.PI) * 0.85;
  });

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#aaddff"
        emissiveIntensity={4}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
export default function OfficeScene() {
  return (
    <>
      <fog attach="fog" args={["#03060f", 10, 32]} />
      <ambientLight intensity={0.07} color="#1a2050" />

      <Aurora />
      <Ground />

      {/* Left trees */}
      <Tree position={[-5.5, 0, -4]}  scale={1.4} />
      <Tree position={[-7.2, 0, -1]}  scale={1.9} />
      <Tree position={[-4.2, 0, -9]}  scale={1.2} />
      {/* Right trees */}
      <Tree position={[5.8,  0, -4]}  scale={1.5} />
      <Tree position={[7.0,  0, -2]}  scale={1.8} />
      <Tree position={[4.5,  0, -9]}  scale={1.1} />

      {/* Rocks */}
      <Rock position={[-2.5, 0.22, 1.0]} scale={1.2} rotation={0.4}  />
      <Rock position={[2.1,  0.16, 0.5]} scale={0.9} rotation={1.2}  />
      <Rock position={[-4.0, 0.26, -2]}  scale={1.5} rotation={2.1}  />
      <Rock position={[3.6,  0.20, -3]}  scale={1.1} rotation={0.8}  />
      <Rock position={[-1.0, 0.12, -1]}  scale={0.7} rotation={1.8}  />
      <Rock position={[0.8,  0.18, -4]}  scale={1.0} rotation={3.0}  />

      {/* Pink / red plants */}
      <Plant position={[-1.6, 0, 1.2]}  color="#ff2255" scale={1.3} />
      <Plant position={[1.3,  0, 0.8]}  color="#ff4400" scale={1.0} />
      <Plant position={[-3.1, 0, 0.5]}  color="#ff1177" scale={1.5} />
      <Plant position={[2.9,  0, -0.5]} color="#ee2244" scale={0.9} />
      {/* Teal plants */}
      <Plant position={[0.6,  0, 1.5]}  color="#00ffcc" scale={1.1} />
      <Plant position={[-2.1, 0, -1.0]} color="#00ddaa" scale={1.3} />
      <Plant position={[3.6,  0, 0.3]}  color="#00ffbb" scale={0.8} />
      {/* Purple plants */}
      <Plant position={[-0.6, 0, 0.9]}  color="#cc44ff" scale={1.0} />
      <Plant position={[1.9,  0, -2.0]} color="#aa22ff" scale={1.2} />
      {/* Orange plants */}
      <Plant position={[-1.1, 0, -2.5]} color="#ff8800" scale={0.9} />
      <Plant position={[0.4,  0, -3.0]} color="#ffaa00" scale={1.1} />

      <FloatingOrbs />

      <OrbitControls
        target={[0, 1.5, -2]}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}
