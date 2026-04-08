/**
 * Portfolio3D.tsx
 * Entry point for the underwater 3D portfolio page.
 * Wires together the R3F canvas, theme toggle, and the HTML overlay menu panels.
 */

import { Suspense, useState } from "react";
import "../components/three/portfolio3d.css";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme } from "../context/useTheme";
import UnderwaterScene from "../components/three/UnderwaterScene";
import type { OrbId } from "../components/three/OrbMenu";

// ── Panel content ─────────────────────────────────────────────────────────────
const PANELS: Record<OrbId, { title: string; body: string }> = {
  about: {
    title: "About Me",
    body: "Hey — I'm Thai. A Hanoi-based full-stack developer who builds things that refuse to blend in. 6 years in the industry across Vietnam and Korea.",
  },
  projects: {
    title: "Projects",
    body: "AION · HDBank Mobile · C-Ticket · C-Now · Warehouse Control System — and counting.",
  },
  contact: {
    title: "Contact",
    body: "thaimeo0210@gmail.com\n+84 916 320 407\ngithub.com/paKymoK",
  },
};

// ── Slide-in panel (Framer Motion HTML overlay) ───────────────────────────────
function Panel({ id, onClose }: { id: OrbId; onClose: () => void }) {
  const { title, body } = PANELS[id];
  return (
    <motion.div
      key={id}
      className="portfolio3d-panel"
      initial={{ x: "110%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "110%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <button className="portfolio3d-panel-close" onClick={onClose}>✕</button>
      <h2 className="portfolio3d-panel-title">{title}</h2>
      <p className="portfolio3d-panel-body" style={{ whiteSpace: "pre-line" }}>{body}</p>
    </motion.div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function Portfolio3D() {
  const { isDark, toggleTheme } = useTheme();
  // Which orb panel is open; null = none
  const [activeOrb, setActiveOrb] = useState<OrbId | null>(null);

  const handleOrbClick = (id: OrbId) => {
    // Toggle: clicking the same orb again closes the panel
    setActiveOrb((prev) => (prev === id ? null : id));
  };

  return (
    <div className="portfolio3d-root">
      {/* ── Full-viewport R3F Canvas ── */}
      <Canvas
        className="portfolio3d-canvas"
        camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/*
          Suspense is required by @react-three/drei loaders.
          We don't use heavy assets here, but it's good practice.
        */}
        <Suspense fallback={null}>
          <UnderwaterScene
            isDark={isDark}
            activeOrb={activeOrb}
            onOrbClick={handleOrbClick}
          />
        </Suspense>
      </Canvas>

      {/* ── HTML Overlay UI ── */}

      {/* Theme toggle button */}
      <button className="portfolio3d-theme-btn" onClick={toggleTheme} title="Toggle theme">
        {isDark ? <SunOutlined /> : <MoonOutlined />}
      </button>

      {/* Back link */}
      <a className="portfolio3d-back" href="/portfolio">← Classic View</a>

      {/* Orb label hints */}
      <div className="portfolio3d-hints">
        <span>Click an orb to explore</span>
      </div>

      {/* Slide-in detail panel */}
      <AnimatePresence>
        {activeOrb && (
          <Panel key={activeOrb} id={activeOrb} onClose={() => setActiveOrb(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
