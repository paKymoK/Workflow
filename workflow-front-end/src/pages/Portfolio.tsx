import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const PARTICLE_COLORS = ["#FF006E", "#00FF94", "#FFE600", "#00CFFF", "#FF4D00"];

const PROJECTS = [
  {
    id: "001", title: "SYNTHWAVE OS", tag: "WEB APP", year: "2025",
    colorClass: "pf-c-pink",
    desc: "A fully browser-based OS-style interface with draggable windows, a working music player, and a retro aesthetic. 40K+ visitors in launch week.",
  },
  {
    id: "002", title: "NEON_CITY", tag: "3D / WEBGL", year: "2024",
    colorClass: "pf-c-green",
    desc: "Procedural cyberpunk cityscape rendered in raw WebGL. Infinite parallax scroll, dynamic neon lighting, zero libraries.",
  },
  {
    id: "003", title: "GLITCH_COMMERCE", tag: "E-COMMERCE", year: "2024",
    colorClass: "pf-c-yellow",
    desc: "Headless Shopify storefront with a brutalist UI, real-time inventory, and a checkout flow that converts 30% above industry average.",
  },
  {
    id: "004", title: "STATIC_FM", tag: "AUDIO TOOL", year: "2023",
    colorClass: "pf-c-cyan",
    desc: "Web Audio API experiments turned product. Generative noise compositions, a waveform editor, and downloadable exports.",
  },
  {
    id: "005", title: "VOID.DASH", tag: "DASHBOARD", year: "2023",
    colorClass: "pf-c-orange",
    desc: "Analytics dashboard for indie devs. Real-time WebSocket data, dark-mode-first design, and a brutalist data-viz library built from scratch.",
  },
];

const SKILLS = [
  { name: "REACT",      colorClass: "pf-skill-cyan"   },
  { name: "NEXT.JS",    colorClass: "pf-skill-white"  },
  { name: "NODE.JS",    colorClass: "pf-skill-green"  },
  { name: "TYPESCRIPT", colorClass: "pf-skill-cyan"   },
  { name: "POSTGRES",   colorClass: "pf-skill-yellow" },
  { name: "WEBGL",      colorClass: "pf-skill-orange" },
  { name: "THREE.JS",   colorClass: "pf-skill-green"  },
  { name: "GSAP",       colorClass: "pf-skill-pink"   },
  { name: "FIGMA",      colorClass: "pf-skill-orange" },
  { name: "DOCKER",     colorClass: "pf-skill-cyan"   },
  { name: "AWS",        colorClass: "pf-skill-yellow" },
  { name: "SHOPIFY",    colorClass: "pf-skill-green"  },
];

const SOCIAL_LINKS = [
  { label: "GH", colorClass: "pf-social-green",  href: "#" },
  { label: "TW", colorClass: "pf-social-cyan",   href: "#" },
  { label: "LI", colorClass: "pf-social-pink",   href: "#" },
  { label: "DR", colorClass: "pf-social-yellow", href: "#" },
];

const STATS = [
  { num: "12", label: "PROJECTS"     },
  { num: "06", label: "YRS EXP"      },
  { num: "28", label: "CLIENTS"      },
  { num: "4K", label: "GITHUB STARS" },
];

export default function Portfolio() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const cursorRef  = useRef<HTMLDivElement>(null);
  const animRef    = useRef<number>(0);
  const navigate   = useNavigate();
  const [openProject, setOpenProject] = useState<string | null>(null);

  // Hide default cursor while on portfolio page
  useEffect(() => {
    document.body.classList.add("pf-active");
    return () => document.body.classList.remove("pf-active");
  }, []);

  // Custom diamond cursor
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 11}px, ${e.clientY - 11}px) rotate(45deg)`;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Dot = { x: number; y: number; r: number; color: string; vx: number; vy: number };
    let dots: Dot[] = [];

    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = Array.from({ length: 90 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.5 + 0.4,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        vx:    (Math.random() - 0.5) * 0.35,
        vy:    (Math.random() - 0.5) * 0.35,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle   = d.color;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = d.color;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", init);
    init();
    draw();
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const toggleProject = (id: string) =>
    setOpenProject((prev) => (prev === id ? null : id));

  return (
    <div className="pf-root">
      {/* Diamond cursor */}
      <div ref={cursorRef} className="pf-cursor" />

      {/* Particle background */}
      <canvas ref={canvasRef} className="pf-canvas" />

      {/* CRT scanlines */}
      <div className="pf-scanlines" />

      <div className="pf-page">

        {/* ── Ticker ──────────────────────────────────── */}
        <div className="pf-ticker">
          <div className="pf-ticker-inner">
            <span>★ AVAILABLE FOR WORK ★ FULL-STACK DEVELOPER ★ OPEN TO FREELANCE ★ BASED IN BERLIN ★ LET'S BUILD ★</span>
            <span>★ AVAILABLE FOR WORK ★ FULL-STACK DEVELOPER ★ OPEN TO FREELANCE ★ BASED IN BERLIN ★ LET'S BUILD ★</span>
            <span>★ AVAILABLE FOR WORK ★ FULL-STACK DEVELOPER ★ OPEN TO FREELANCE ★ BASED IN BERLIN ★ LET'S BUILD ★</span>
          </div>
        </div>

        {/* ── Nav ─────────────────────────────────────── */}
        <nav className="pf-nav">
          <div className="pf-logo">▸ ALEX.KOVA</div>
          <div className="pf-nav-links">
            <button className="pf-nav-link" onClick={() => scrollTo("work")}>WORK</button>
            <button className="pf-nav-link" onClick={() => scrollTo("about")}>ABOUT</button>
            <button className="pf-nav-link" onClick={() => scrollTo("contact")}>CONTACT</button>
            <button className="pf-nav-link pf-nav-back" onClick={() => navigate("/login")}>← LOGIN</button>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────── */}
        <section className="pf-hero">
          <div className="pf-hero-eyebrow">SYS://PORTFOLIO_v4.1 — INITIALIZED</div>

          <div className="pf-title-wrap">
            <h1 className="pf-hero-title">
              FULL-STACK<br />
              <span className="pf-accent">DEVELOPER</span>
            </h1>
            <div className="pf-glitch g1">FULL-STACK<br />DEVELOPER</div>
            <div className="pf-glitch g2">FULL-STACK<br />DEVELOPER</div>
          </div>

          <div className="pf-hero-sub">
            <div className="pf-hero-line" />
            <p>BUILDING RAW, FUNCTIONAL, UNAPOLOGETIC DIGITAL EXPERIENCES SINCE 2018.</p>
          </div>

          <div className="pf-hero-btns">
            <button className="pf-btn-primary" onClick={() => scrollTo("work")}>VIEW WORK ▸</button>
            <button className="pf-btn-outline" onClick={() => scrollTo("contact")}>CONTACT</button>
          </div>

          <div className="pf-hero-stats">
            {STATS.map(({ num, label }) => (
              <div key={label}>
                <div className="pf-stat-num">{num}</div>
                <div className="pf-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Work ────────────────────────────────────── */}
        <section className="pf-section" id="work">
          <div className="pf-section-label">
            <span>▸ SELECTED WORK</span>
            <span>[ {PROJECTS.length} PROJECTS ]</span>
          </div>

          <div className="pf-project-list">
            {PROJECTS.map((p) => {
              const isOpen = openProject === p.id;
              return (
                <div
                  key={p.id}
                  className={`pf-project-item ${p.colorClass}${isOpen ? " pf-project-open" : ""}`}
                  onClick={() => toggleProject(p.id)}
                >
                  <div className="pf-project-row">
                    <span className="pf-project-num">{p.id}</span>
                    <div className="pf-project-info">
                      <div className="pf-project-title-row">
                        <span className="pf-project-title">{p.title}</span>
                        <span className="pf-project-tag">{p.tag}</span>
                      </div>
                      <p className={`pf-project-desc${isOpen ? " pf-project-desc-open" : ""}`}>
                        {p.desc}
                      </p>
                    </div>
                    <span className="pf-project-year">{p.year}</span>
                    <span className={`pf-project-toggle${isOpen ? " pf-project-toggle-open" : ""}`}>+</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Skills ──────────────────────────────────── */}
        <section className="pf-section">
          <div className="pf-section-label"><span>▸ TECH_STACK</span></div>
          <div className="pf-skills-grid">
            {SKILLS.map(({ name, colorClass }) => (
              <div key={name} className={`pf-skill-tag ${colorClass}`}>{name}</div>
            ))}
          </div>
        </section>

        {/* ── About ───────────────────────────────────── */}
        <section className="pf-section" id="about">
          <div className="pf-section-label"><span>▸ ABOUT_ME</span></div>
          <div className="pf-about-grid">
            <div className="pf-photo-frame">
              <div className="pf-photo-placeholder">
                <div className="pf-photo-icon">◈</div>
                <p>PHOTO HERE</p>
              </div>
              <div className="pf-photo-rec">● REC</div>
            </div>
            <div className="pf-about-text">
              <p>
                HEY — I'M ALEX. A BERLIN-BASED DEVELOPER WHO BUILDS THINGS THAT REFUSE TO BLEND IN.<br /><br />
                I SPECIALIZE IN PERFORMANT WEB APPS, CREATIVE INTERFACES, AND SYSTEMS THAT ACTUALLY SCALE.
                SIX YEARS IN THE INDUSTRY, I'VE WORKED WITH STARTUPS AND AGENCIES ACROSS EUROPE AND THE US.<br /><br />
                IF YOUR PROJECT NEEDS TO STAND OUT — NOT JUST SHOW UP — LET'S TALK.
              </p>
              <div className="pf-social-links">
                {SOCIAL_LINKS.map(({ label, colorClass, href }) => (
                  <a key={label} href={href} className={`pf-social-link ${colorClass}`}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact ─────────────────────────────────── */}
        <section className="pf-contact" id="contact">
          <div className="pf-contact-eyebrow">▸ CONTACT</div>
          <h2 className="pf-contact-heading">
            LET'S BUILD<br />
            <span className="pf-blink-accent">SOMETHING<span className="pf-blink-cursor">_</span></span>
          </h2>
          <a href="mailto:alex@kova.dev" className="pf-contact-email">ALEX@KOVA.DEV</a>
        </section>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="pf-footer">
          <span>©2025 ALEX.KOVA — ALL RIGHTS RESERVED</span>
          <span>BUILT WITH BRUTALISM + NEON + ZERO REGRETS</span>
        </footer>

      </div>
    </div>
  );
}
