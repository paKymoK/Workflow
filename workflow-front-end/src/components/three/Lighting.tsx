/**
 * Lighting.tsx
 * Ambient + directional lighting that simulates sunlight filtering through water.
 *
 * Light mode  → bright cyan-white sunbeam from above
 * Dark mode   → dim blue ambient + faint purple-tinted "bioluminescent" point lights
 */

interface Props {
  isDark: boolean;
}

export default function Lighting({ isDark }: Props) {
  return (
    <>
      {/* Ambient — base fill light */}
      <ambientLight
        color={isDark ? "#040d20" : "#a8e6ef"}
        intensity={isDark ? 0.4 : 0.8}
      />

      {/* Main directional — the sun above the water surface */}
      <directionalLight
        color={isDark ? "#1a3a6e" : "#cef0ff"}
        intensity={isDark ? 0.3 : 1.2}
        position={[2, 8, 4]}
        castShadow={false}
      />

      {/* Secondary fill from below — subtle underwater bounce */}
      <directionalLight
        color={isDark ? "#0a0a30" : "#00c8ff"}
        intensity={isDark ? 0.15 : 0.4}
        position={[-3, -5, -2]}
      />

      {/* Dark mode bioluminescent point lights — cyan & magenta glow */}
      {isDark && (
        <>
          <pointLight color="#00ffe0" intensity={2} distance={10} position={[-4, 1, 2]} />
          <pointLight color="#c000ff" intensity={1.5} distance={8} position={[4, -1, -1]} />
          <pointLight color="#0060ff" intensity={1} distance={12} position={[0, -3, 3]} />
        </>
      )}

      {/* Light mode — extra warm caustic fill */}
      {!isDark && (
        <pointLight color="#00e5ff" intensity={1.5} distance={20} position={[0, 6, 0]} />
      )}
    </>
  );
}
