/**
 * UnderwaterScene.tsx
 * Root scene component that composes every 3D element.
 * Receives isDark + activeOrb from the page so the scene
 * can react to theme/state without touching global context.
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Fog } from "three";
import type * as THREE from "three";
import Lighting from "./Lighting";
import Bubbles from "./Bubbles";
import Fish from "./Fish";
import CausticOverlay from "./CausticOverlay";
import OrbMenu from "./OrbMenu";
import type { OrbId } from "./OrbMenu";

interface Props {
  isDark: boolean;
  activeOrb: OrbId | null;
  onOrbClick: (id: OrbId) => void;
}

// Fog colours for each mode
const LIGHT_FOG = "#1a7a8a"; // warm teal
const DARK_FOG  = "#020810"; // near-black

export default function UnderwaterScene({ isDark, activeOrb, onOrbClick }: Props) {
  const { scene, camera } = useThree();

  // ── Camera mouse-follow drift ──────────────────────────────────────────────
  // We track normalised mouse position via a ref updated by the R3F pointer event.
  const mouse = useRef({ x: 0, y: 0 });

  // useFrame fires every render tick — perfect for smooth camera drift.
  useFrame(({ pointer }, delta) => {
    // pointer is already normalised [-1, 1] by R3F
    mouse.current.x = pointer.x;
    mouse.current.y = pointer.y;

    // Gently lerp camera toward the mouse offset
    const targetX = mouse.current.x * 1.5;
    const targetY = mouse.current.y * 0.8;
    camera.position.x += (targetX - camera.position.x) * delta * 0.6;
    camera.position.y += (targetY - camera.position.y) * delta * 0.6;

    // Always look toward the scene origin so the drift feels natural
    camera.lookAt(0, 0, 0);

    // Update fog colour smoothly between modes
    const fogColor = isDark ? DARK_FOG : LIGHT_FOG;
    if (scene.fog instanceof Fog) {
      (scene.fog as THREE.Fog).color.set(fogColor);
    }
  });

  // Set initial fog (runs on first render)
  scene.fog = new Fog(isDark ? DARK_FOG : LIGHT_FOG, 12, 40);

  return (
    <>
      {/* Lighting changes with theme */}
      <Lighting isDark={isDark} />

      {/* Animated caustic ripple on the "ground" */}
      <CausticOverlay isDark={isDark} />

      {/* Floating bubble particles */}
      <Bubbles isDark={isDark} />

      {/* Swimming fish (or shark in dark mode) */}
      <Fish isDark={isDark} activeOrb={activeOrb} />

      {/* Three glowing orbs — About / Projects / Contact */}
      <OrbMenu isDark={isDark} activeOrb={activeOrb} onOrbClick={onOrbClick} />
    </>
  );
}
