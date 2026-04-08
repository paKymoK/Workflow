/**
 * Fish.tsx
 * A low-poly fish (light mode) or shark (dark mode) built from basic geometries.
 * Swims in a lazy sine-wave figure-eight path.
 * Scatters (speeds up & veers away) when an orb is active.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { OrbId } from "./OrbMenu";

interface Props {
  isDark: boolean;
  activeOrb: OrbId | null;
}

// ── Low-poly fish geometry assembled from primitive meshes ────────────────────
function FishBody({ isDark }: { isDark: boolean }) {
  const bodyColor  = isDark ? "#1a1a3e" : "#ff9f43";
  const finColor   = isDark ? "#2a2a5e" : "#e67e22";
  const eyeColor   = isDark ? "#ff2255" : "#2c3e50"; // red eye for shark

  return (
    <group>
      {/* Main body — elongated ellipsoid */}
      <mesh>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={isDark ? 0.3 : 0} />
      </mesh>

      {/* Head — slightly smaller sphere at front */}
      <mesh position={[0.55, 0.05, 0]}>
        <sphereGeometry args={[0.32, 7, 5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>

      {/* Tail fin — flat cone pointing backwards */}
      <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.35, 0.5, 4]} />
        <meshStandardMaterial color={finColor} roughness={0.7} side={2} />
      </mesh>

      {/* Dorsal fin — small triangle on top */}
      <mesh position={[0, 0.52, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={isDark ? [0.22, 0.5, 3] : [0.15, 0.3, 3]} />
        <meshStandardMaterial color={finColor} roughness={0.7} side={2} />
      </mesh>

      {/* Pectoral fin left */}
      <mesh position={[0.1, -0.1, 0.35]} rotation={[0.4, 0, 0.6]}>
        <coneGeometry args={[0.12, 0.32, 3]} />
        <meshStandardMaterial color={finColor} roughness={0.7} side={2} />
      </mesh>

      {/* Eye */}
      <mesh position={[0.72, 0.1, 0.2]}>
        <sphereGeometry args={[0.06, 5, 5]} />
        <meshStandardMaterial color={eyeColor} emissive={isDark ? "#ff0033" : "#000"} emissiveIntensity={isDark ? 1.5 : 0} />
      </mesh>

      {/* Dark mode: bioluminescent belly stripe */}
      {isDark && (
        <mesh position={[0, -0.25, 0]} scale={[1, 0.18, 0.8]}>
          <sphereGeometry args={[0.5, 8, 4]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={1.2}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Swimming path constants ───────────────────────────────────────────────────
const SWIM_RADIUS  = 5;    // horizontal loop radius
const SWIM_SPEED   = 0.35; // radians per second
const WAVE_HEIGHT  = 1.2;  // vertical sine amplitude
const WAVE_FREQ    = 1.8;  // vertical oscillation frequency

export default function Fish({ isDark, activeOrb }: Props) {
  const groupRef  = useRef<Group>(null!);
  const angleRef  = useRef(0); // current angle around the loop

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Scatter boost when an orb is hovered/active
    const speed = activeOrb ? SWIM_SPEED * 3.5 : SWIM_SPEED;
    angleRef.current += speed * delta;

    const angle = angleRef.current;
    const x = Math.cos(angle) * SWIM_RADIUS;
    const z = Math.sin(angle) * (SWIM_RADIUS * 0.6); // flatten Z for depth effect
    const y = Math.sin(angle * WAVE_FREQ) * WAVE_HEIGHT;

    groupRef.current.position.set(x, y, z);

    // Face the direction of travel (tangent to the path)
    const nextAngle = angle + 0.01;
    const nx = Math.cos(nextAngle) * SWIM_RADIUS;
    const nz = Math.sin(nextAngle) * (SWIM_RADIUS * 0.6);
    groupRef.current.lookAt(nx, y, nz);

    // Gentle body roll — fish waggle
    groupRef.current.rotation.z = Math.sin(angle * 4) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <FishBody isDark={isDark} />
    </group>
  );
}
