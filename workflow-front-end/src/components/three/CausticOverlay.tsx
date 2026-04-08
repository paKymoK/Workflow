/**
 * CausticOverlay.tsx
 * Simulates caustic light patterns (the rippling light you see underwater).
 *
 * Technique: a large semi-transparent plane with an animated shader material.
 * The shader distorts a grid pattern over time to mimic refracted sunlight.
 * In dark mode we skip this — bioluminescent lighting is handled in Lighting.tsx.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ShaderMaterial, PlaneGeometry } from "three";
import type * as THREE from "three";

interface Props {
  isDark: boolean;
}

// Minimal GLSL caustic shader — patterns from overlapping sine waves
const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;
  varying vec2  vUv;

  // Cheap caustic approximation: two offset sine grids
  float caustic(vec2 uv, float t) {
    vec2 p = uv * 6.0;
    float c  = sin(p.x + t) * sin(p.y + t * 0.7);
    float c2 = sin(p.x * 1.3 - t * 0.5) * sin(p.y * 1.3 + t * 0.8);
    return clamp((c + c2) * 0.5 + 0.5, 0.0, 1.0);
  }

  void main() {
    float pattern = caustic(vUv, uTime * 0.4);
    // Brighten only the high-frequency ridges
    float brightness = smoothstep(0.6, 1.0, pattern);
    gl_FragColor = vec4(uColor * brightness, brightness * uOpacity);
  }
`;

export default function CausticOverlay({ isDark }: Props) {
  const matRef = useRef<ShaderMaterial>(null!);

  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uColor:   { value: [0.4, 0.9, 1.0] },   // cyan-white
    uOpacity: { value: 0.18 },
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  // Skip in dark mode — scene relies on coloured point lights instead
  if (isDark) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <planeGeometry args={[40, 40, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
