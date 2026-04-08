/**
 * OrbMenu.tsx
 * Three glowing orbs positioned in the scene — About, Projects, Contact.
 *
 * Behaviour:
 *   - Idle: slow pulse animation
 *   - Hover: scale up, emit brighter glow, nearby fish scatter (handled via activeOrb)
 *   - Click: notify parent → camera eases toward orb + HTML panel slides in
 *
 * Each orb is a sphere with an emissive material + a PointLight inside for a
 * real glow effect, plus a <Html> label from @react-three/drei.
 */

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";

export type OrbId = "about" | "projects" | "contact";

interface OrbConfig {
  id:       OrbId;
  label:    string;
  position: [number, number, number];
  hue:      string; // light-mode colour
  darkHue:  string; // dark-mode colour
}

const ORBS: OrbConfig[] = [
  { id: "about",    label: "About",    position: [-4,  1,  0], hue: "#00d4ff", darkHue: "#00ffe0" },
  { id: "projects", label: "Projects", position: [ 0, -1,  1], hue: "#ff9f43", darkHue: "#ff6ec7" },
  { id: "contact",  label: "Contact",  position: [ 4,  1,  0], hue: "#00ff88", darkHue: "#80ffff" },
];

// ── Single Orb ────────────────────────────────────────────────────────────────
interface OrbProps {
  config:    OrbConfig;
  isDark:    boolean;
  isActive:  boolean;
  onClick:   () => void;
}

function Orb({ config, isDark, isActive, onClick }: OrbProps) {
  const meshRef    = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const color = isDark ? config.darkHue : config.hue;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Idle pulse — slow breath scale
    const pulse  = 1 + Math.sin(t * 1.2 + ORBS.indexOf(config)) * 0.04;

    // Scale target: active > hovered > idle
    const targetScale = isActive ? 1.4 : hovered ? 1.2 : pulse;

    // Smooth lerp toward target
    meshRef.current.scale.setScalar(
      meshRef.current.scale.x + (targetScale - meshRef.current.scale.x) * 0.12
    );

    // Slow idle rotation for visual interest
    meshRef.current.rotation.y += 0.005;
  });

  return (
    <group position={config.position}>
      {/* Glow point light inside the orb */}
      <pointLight
        color={color}
        intensity={hovered || isActive ? 4 : 1.5}
        distance={6}
      />

      {/* Orb sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isActive ? 2.5 : 1.0}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Outer halo ring — always-transparent ring for soft edge glow */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* HTML label — stays readable in 3D space */}
      <Html
        center
        position={[0, -1.0, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          style={{
            color: color,
            fontSize: "11px",
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            textShadow: `0 0 8px ${color}`,
            opacity: hovered || isActive ? 1 : 0.7,
            transition: "opacity 0.3s",
            whiteSpace: "nowrap",
          }}
        >
          {config.label}
        </div>
      </Html>
    </group>
  );
}

// ── OrbMenu ───────────────────────────────────────────────────────────────────
interface Props {
  isDark:    boolean;
  activeOrb: OrbId | null;
  onOrbClick: (id: OrbId) => void;
}

export default function OrbMenu({ isDark, activeOrb, onOrbClick }: Props) {
  return (
    <>
      {ORBS.map((orb) => (
        <Orb
          key={orb.id}
          config={orb}
          isDark={isDark}
          isActive={activeOrb === orb.id}
          onClick={() => onOrbClick(orb.id)}
        />
      ))}
    </>
  );
}
