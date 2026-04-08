/**
 * Bubbles.tsx
 * Instanced mesh of ~80 bubble spheres drifting upward with a slight wobble.
 * Using InstancedMesh for performance — one draw call for all bubbles.
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, MeshStandardMaterial } from "three";

const COUNT = 80;

// Seed random initial positions & speeds once (stable across re-renders)
function makeParticles() {
  return Array.from({ length: COUNT }, () => ({
    x:       (Math.random() - 0.5) * 20,
    y:       (Math.random() - 0.5) * 14 - 2,   // start spread vertically
    z:       (Math.random() - 0.5) * 10,
    radius:  Math.random() * 0.08 + 0.03,       // tiny bubbles
    speed:   Math.random() * 0.4 + 0.15,        // rise speed
    wobble:  Math.random() * Math.PI * 2,        // phase offset for horizontal drift
    wobbleFreq: Math.random() * 0.5 + 0.3,
    wobbleAmp:  Math.random() * 0.15 + 0.05,
  }));
}

interface Props {
  isDark: boolean;
}

const dummy = new Object3D();

export default function Bubbles({ isDark }: Props) {
  const meshRef = useRef<InstancedMesh>(null!);
  const particles = useMemo(makeParticles, []);

  // Swap material colour when theme changes
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as MeshStandardMaterial;
    mat.color.set(isDark ? "#00ffe0" : "#aaf0ff");
    mat.emissive.set(isDark ? "#00ffe0" : "#00c8ff");
    mat.emissiveIntensity = isDark ? 0.8 : 0.3;
  }, [isDark]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    particles.forEach((p, i) => {
      // Drift upward, wrap when above scene
      p.y += p.speed * 0.016; // ~per-frame at 60fps
      if (p.y > 8) {
        p.y = -8;
        p.x = (Math.random() - 0.5) * 20;
      }

      // Horizontal wobble
      const wobbleX = Math.sin(t * p.wobbleFreq + p.wobble) * p.wobbleAmp;

      dummy.position.set(p.x + wobbleX, p.y, p.z);
      dummy.scale.setScalar(p.radius);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      {/* Low-poly sphere — 6 segments is enough for tiny bubbles */}
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={isDark ? "#00ffe0" : "#aaf0ff"}
        emissive={isDark ? "#00ffe0" : "#00c8ff"}
        emissiveIntensity={isDark ? 0.8 : 0.3}
        transparent
        opacity={0.55}
        roughness={0.1}
        metalness={0.05}
      />
    </instancedMesh>
  );
}
