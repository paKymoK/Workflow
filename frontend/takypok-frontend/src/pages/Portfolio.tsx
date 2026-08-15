/* eslint-disable local/no-inline-styles */
import { useEffect, useRef, useState } from "react";
import avatar from "../assets/avatar.jpeg";
import { useTheme } from "@takypok/shared";
import { SunOutlined, MoonOutlined, GithubOutlined, FacebookOutlined } from "@ant-design/icons";

const PARTICLE_COLORS_DARK  = ["#00CFFF", "#48CAE4", "#90E0EF", "#ADE8F4", "#00F5C4"];
const PARTICLE_COLORS_LIGHT = ["#0055AA", "#0066CC", "#0055AA", "#0066CC", "#0055AA"];

const A = {
  pink:   "var(--pf-pink)",
  green:  "var(--pf-green)",
  yellow: "var(--pf-yellow)",
  cyan:   "var(--pf-cyan)",
  orange: "var(--pf-orange)",
};

type Status = "NDA" | "INTERNAL" | "PRIVATE" | "LIVE";
interface Project {
  id: string; title: string; tag: string; year: string;
  accentVar: string; status: Status;
  githubUrl: string | null; liveUrl: string | null;
  desc: string; problem: string; whatIBuilt: string; result: string;
  techStack: string[]; responsibilities: string[];
}
interface TlEntry {
  id: string; company: string; role: string; dates: string;
  desc: string; tags: string[]; accentVar: string;
}
interface SkillGroup {
  group: string; accentVar: string;
  skills: { name: string; years: string; pct: number }[];
}

const PROJECTS: Project[] = [
  {
    id: "001", title: "AION", tag: "WEB APP", year: "DEC 2025 — MAR 2026",
    accentVar: A.pink, status: "NDA",
    githubUrl: null, liveUrl: null,
    desc: "Internal KPI tracking back-office system for HDBank, enabling managers to monitor employee performance across departments in real time.",
    problem: "HDBank's monthly KPI reporting relied on Excel sheets shared over email — each cycle took 4+ hours to compile, was error-prone, and gave managers no live visibility into department performance.",
    whatIBuilt: "A React + TypeScript dashboard with real-time KPI completion rings per employee, department-level roll-up views, date-range selectors, and a manager approval flow — connected to a Spring Boot REST API.",
    result: "Reporting time cut from 4h → ~20min per cycle. 200+ employees onboarded across 6 departments. Manager sign-off rate increased to 97% in the first month.",
    techStack: ["React.js", "TypeScript", "Ant Design", "REST API", "Spring Boot"],
    responsibilities: [
      "Built and maintained the KPI tracking dashboard UI",
      "Integrated REST APIs for performance data",
      "Collaborated with backend team on API contract design",
      "Ensured responsive layouts for tablet and desktop",
    ],
  },
  {
    id: "002", title: "HDBANK MOBILE", tag: "MOBILE APP", year: "DEC 2024 — NOV 2025",
    accentVar: A.green, status: "NDA",
    githubUrl: null, liveUrl: null,
    desc: "Mobile banking application for HDBank customers — React Native frontend with a Spring Boot WebFlux backend for high-throughput transaction processing.",
    problem: "The bank's existing mobile app had p95 API latency over 900ms on payment flows, causing user drop-off on high-value transfers during peak hours.",
    whatIBuilt: "Redesigned the Payment Service and Voucher Service backend using Spring WebFlux reactive streams. Added DB index tuning and a Redis cache layer for repeat voucher queries.",
    result: "p95 payment API latency down from 920ms → 180ms. Voucher service throughput increased 4×. App store rating improved from 3.6 → 4.2 after the backend update shipped.",
    techStack: ["Java", "Spring Boot", "WebFlux", "React Native", "TypeScript", "Redis", "PostgreSQL"],
    responsibilities: [
      "Backend: Payment Service and Voucher Service",
      "Database tuning and performance optimization",
      "API contract definition with the frontend team",
      "Unit tests and code reviews",
    ],
  },
  {
    id: "003", title: "C-TICKET", tag: "WEB APP", year: "JUN 2024 — NOV 2024",
    accentVar: A.yellow, status: "INTERNAL",
    githubUrl: null, liveUrl: null,
    desc: "Internal web-based ticketing system with real-time SLA calculation — the predecessor to the TakyPok system you're reading this on.",
    problem: "The company's support team was tracking tickets in a shared spreadsheet with no SLA enforcement, no assignment logic, and no visibility for requesters.",
    whatIBuilt: "Full-stack: React.js frontend with a live SLA countdown, WebSocket push for status changes, and a Spring Boot backend with configurable SLA rules per priority level.",
    result: "SLA breach rate dropped 38% in the first quarter. Support team response time average: 4h → 1.2h. Used by 80+ internal users daily.",
    techStack: ["Java", "Spring Boot", "React.js", "WebSocket", "PostgreSQL"],
    responsibilities: [
      "Full-stack development — React frontend + Spring Boot backend",
      "WebSocket for real-time SLA updates and notifications",
    ],
  },
  {
    id: "004", title: "C-NOW", tag: "JIRA PLUGIN", year: "SEP 2023 — NOV 2024",
    accentVar: A.cyan, status: "INTERNAL",
    githubUrl: null, liveUrl: null,
    desc: "Custom Jira Server plugin extending the platform's workflow engine for the finance team's internal paperwork and approval chain.",
    problem: "Finance paperwork was routed via email with no tracking, no SLA, and no single source of truth. Approvals were lost, duplicated, or delayed for weeks.",
    whatIBuilt: "A full Jira Server plugin: custom workflow states mapped to finance approval stages, a REST API bridge to internal services, and a jQuery-based UI panel embedded directly in Jira tickets.",
    result: "Approval cycle time reduced by ~60%. 100% audit trail coverage for compliance. Still in production 2 years later with zero critical bugs.",
    techStack: ["Java", "Spring Core", "JavaScript", "jQuery", "Jira Server SDK", "REST API"],
    responsibilities: [
      "End-to-end plugin development (Java backend + JS frontend)",
      "Jira workflow configuration and custom field mapping",
      "REST API integration with internal finance services",
      "Finance team workflow service maintenance",
    ],
  },
  {
    id: "005", title: "WAREHOUSE CONTROL", tag: "WCS", year: "MAY 2022 — AUG 2023",
    accentVar: A.orange, status: "PRIVATE",
    githubUrl: null, liveUrl: null,
    desc: "Warehouse Control System for an automated fulfillment center — real-time inventory visualization and integration with Autostore robotic systems.",
    problem: "The warehouse had no live visibility into bin states or robot positions, causing picking errors and manual reconciliation delays that cost ~2h per shift.",
    whatIBuilt: "An Eclipse RCP backend for inbound/outbound flow management and a D3.js real-time visualization layer showing live bin occupancy, robot positions, and exception queues. WebSocket bridge to the Autostore API.",
    result: "Picking error rate cut by 72%. Manual reconciliation eliminated. System processed 1,200+ transactions/day at peak without incident.",
    techStack: ["Eclipse RCP", "Java", "Node.js", "WebSocket", "PostgreSQL"],
    responsibilities: [
      "Backend: business logic and database management",
      "DB tuning and performance optimization",
      "Autostore third-party API integration",
      "Real-time bin visualization",
    ],
  },
];

const TIMELINE: TlEntry[] = [
  {
    id: "t1", company: "Co-well Asia", role: "Mobile Developer",
    dates: "JAN 2020 — MAY 2022",
    desc: "",
    tags: ["Android", "Java", "React Native"],
    accentVar: A.orange,
  },
  {
    id: "t2", company: "CMC Global", role: "Full-Stack Developer",
    dates: "MAY 2022 — NOW",
    desc: "",    
    tags: ["Java", "Spring Boot", "React.js"],
    accentVar: A.cyan,
  },
];

const SKILLS_GROUPED: SkillGroup[] = [
  {
    group: "FRONTEND", accentVar: A.cyan,
    skills: [
      { name: "React.js",   years: "4y", pct: 90 },
      { name: "TypeScript", years: "3y", pct: 82 },
      { name: "Angular",    years: "1y", pct: 48 },
      { name: "Vue",        years: "1y", pct: 42 },
    ],
  },
  {
    group: "BACKEND", accentVar: A.green,
    skills: [
      { name: "Spring Boot", years: "4y", pct: 88 },
      { name: "Java",        years: "4y", pct: 86 },
      { name: "WebFlux",     years: "2y", pct: 70 },
      { name: "Node.js",     years: "2y", pct: 62 },
    ],
  },
  {
    group: "DATA + OPS", accentVar: A.pink,
    skills: [
      { name: "PostgreSQL", years: "4y", pct: 80 },
      { name: "MySQL",      years: "2y", pct: 66 },
      { name: "Redis",      years: "1y", pct: 50 },
      { name: "Jenkins",    years: "2y", pct: 55 },
    ],
  },
];

const STATS = [
  { num: "5+",  label: "PROJECTS"        },
  { num: "6",   label: "YRS EXP"         },
  { num: "2",   label: "COMPANIES"       },
];

// ── StatusChip ────────────────────────────────────────────────
function StatusChip({ status }: { status: Status }) {
  const color =
    status === "NDA" || status === "PRIVATE" ? "var(--pf-muted)"
    : status === "INTERNAL" ? "var(--pf-cyan)"
    : "var(--pf-green)";
  return (
    <span style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 9, letterSpacing: ".14em",
      border: `1px solid ${color}`, color,
      padding: "2px 7px", whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ── CaseStudy ─────────────────────────────────────────────────
function CaseStudy({ problem, whatIBuilt, result, accentVar }: {
  problem: string; whatIBuilt: string; result: string; accentVar: string;
}) {
  return (
    <div className="pf2-case" style={{ "--card-accent": accentVar } as React.CSSProperties}>
      {[
        { label: "// PROBLEM",      text: problem    },
        { label: "// WHAT I BUILT", text: whatIBuilt },
        { label: "// RESULT",       text: result     },
      ].map(({ label, text }) => (
        <div key={label} className="pf2-case-block">
          <div className="pf2-case-label">{label}</div>
          <div className="pf2-case-text">{text}</div>
        </div>
      ))}
    </div>
  );
}

// ── ProjectCard ───────────────────────────────────────────────
function ProjectCard({ p, open, onToggle }: {
  p: Project; open: boolean; onToggle: () => void;
}) {
  return (
    <div
      className={`pf2-card${open ? " open" : ""}`}
      style={{ "--card-accent": p.accentVar } as React.CSSProperties}
    >
      <div className="pf2-card-header" onClick={onToggle}>
        <span className="pf2-card-num">{p.id}</span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="pf2-card-title">{p.title}</span>
            <span className="pf2-card-tag">{p.tag}</span>
            <StatusChip status={p.status} />
          </div>
          {!open && (
            <span style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
              color: "var(--pf-muted)", marginTop: 2, display: "block",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 520,
            }}>
              {p.desc}
            </span>
          )}
        </div>
        <div className="pf2-card-links" onClick={(e) => e.stopPropagation()}>
          {p.githubUrl ? (
            <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="pf2-card-link">GH</a>
          ) : (
            <span className="pf2-card-link nda">{p.status === "NDA" ? "NDA" : "PRIVATE"}</span>
          )}
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="pf2-card-link">LIVE</a>
          )}
        </div>
        <span className="pf2-card-year">{p.year}</span>
        <span className="pf2-card-toggle">+</span>
      </div>

      {open && (
        <div style={{ paddingBottom: 24 }} onClick={(e) => e.stopPropagation()}>
          <p style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 13,
            color: "var(--pf-muted)", lineHeight: 1.75, marginBottom: 20,
          }}>
            {p.desc}
          </p>

          <CaseStudy
            problem={p.problem}
            whatIBuilt={p.whatIBuilt}
            result={p.result}
            accentVar={p.accentVar}
          />

          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 11,
              letterSpacing: ".22em", color: "var(--pf-muted)", marginBottom: 10,
            }}>
              ▸ TECH_STACK
            </div>
            <div className="pf2-tech-list">
              {p.techStack.map((t) => <span key={t} className="pf2-tech-tag">{t}</span>)}
            </div>
          </div>

          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 11,
              letterSpacing: ".22em", color: "var(--pf-muted)", marginBottom: 10,
            }}>
              ▸ MY_RESPONSIBILITIES
            </div>
            <ul className="pf2-resp">
              {p.responsibilities.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Portfolio ────────────────────────────────────────────
export default function Portfolio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const animRef   = useRef<number>(0);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Hide default cursor while on portfolio page
  useEffect(() => {
    document.body.classList.add("pf-active");
    return () => document.body.classList.remove("pf-active");
  }, []);

  // Diamond cursor — RAF-throttled
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;
    let rafId: number;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX - 11}px, ${e.clientY - 11}px) rotate(45deg)`;
      });
    };
    document.addEventListener("mousemove", onMove);
    return () => { document.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId); };
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const COLORS = isDark ? PARTICLE_COLORS_DARK : PARTICLE_COLORS_LIGHT;

    type Dot = { x: number; y: number; r: number; color: string; vx: number; vy: number };
    let dots: Dot[] = [];

    const init = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = Array.from({ length: 32 }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 5 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx:    (Math.random() - 0.5) * 0.18,
        vy:    -(Math.random() * 0.35 + 0.1),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const byColor: Record<string, Dot[]> = {};
      dots.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < -d.r) d.x = canvas.width + d.r;
        if (d.x > canvas.width + d.r) d.x = -d.r;
        if (d.y < -d.r) { d.y = canvas.height + d.r; d.x = Math.random() * canvas.width; }
        (byColor[d.color] ??= []).push(d);
      });
      Object.entries(byColor).forEach(([color, group]) => {
        ctx.strokeStyle = color; ctx.shadowColor = color;
        ctx.lineWidth = isDark ? 1.2 : 1.8;
        group.forEach((d) => {
          ctx.globalAlpha = isDark ? 0.5 : 0.75;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = isDark ? 0.8 : 0.95;
          ctx.beginPath(); ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
        });
      });
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(init, 150); };
    window.addEventListener("resize", onResize);
    init(); draw();
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animRef.current);
    };
  }, [isDark]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const toggleProject = (id: string) =>
    setOpenProject((prev) => (prev === id ? null : id));

  const updateForm = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submitForm = () => {
    if (!form.name.trim() || !form.message.trim()) return;
    const subject = encodeURIComponent(`Portfolio contact from ${form.name}`);
    const body    = encodeURIComponent(`Hi Thai,\n\n${form.message}\n\n— ${form.name}`);
    window.location.href = `mailto:thaimeo0210@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="pf-root">
      {/* Diamond cursor */}
      <div ref={cursorRef} className="pf-cursor" style={{ borderRadius: 0 }} />

      {/* Particle background */}
      <canvas ref={canvasRef} className="pf-canvas" />

      <div className="pf-page">
        {/* ── Nav ─────────────────────────────────────── */}
        <nav className="pf-nav">
          <div className="pf-nav-brand">
            <div className="pf-logo">▸ TQTHAI</div>
            <div className="pf2-avail">
              <span className="pf2-avail-dot" />
              AVAILABLE
            </div>
          </div>
          <div className="pf-nav-links">
            {(["work", "timeline", "about", "contact"] as const).map((s) => (
              <button key={s} className="pf-nav-link" onClick={() => scrollTo(s)}>
                {s.toUpperCase()}
              </button>
            ))}
            <a href="/cv-tqthai.pdf" download className="pf2-cv-btn">↓ CV</a>
            <button className="pf-nav-link" onClick={toggleTheme} title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────── */}
        <section className="pf-hero">
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
            <p>BUILDING RAW, FUNCTIONAL, UNAPOLOGETIC DIGITAL EXPERIENCES SINCE 2020.</p>
          </div>

          <div className="pf-hero-btns">
            <button className="pf-btn-primary" onClick={() => scrollTo("work")}>VIEW WORK ▸</button>
            <button className="pf-btn-outline" onClick={() => scrollTo("contact")}>CONTACT</button>
            <a href="/cv-tqthai.pdf" download className="pf2-cv-btn">↓ DOWNLOAD CV</a>
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
            <span>▸ SELECTED_WORK</span>
            <span>[{PROJECTS.length} PROJECTS]</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {PROJECTS.map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                open={openProject === p.id}
                onToggle={() => toggleProject(p.id)}
              />
            ))}
          </div>
        </section>

        {/* ── Timeline ────────────────────────────────── */}
        <section className="pf-section" id="timeline">
          <div className="pf-section-label">
            <span>▸ EXPERIENCE</span>
            <span>[{TIMELINE.length} POSITIONS]</span>
          </div>
          <div className="pf2-timeline">
            {TIMELINE.map((e) => (
              <div key={e.id} className="pf2-tl-entry">
                <div className="pf2-tl-dot" style={{ "--dot-color": e.accentVar } as React.CSSProperties} />
                <div className="pf2-tl-connector" style={{ "--dot-color": e.accentVar } as React.CSSProperties} />
                <div className="pf2-tl-header">
                  <span className="pf2-tl-company" style={{ color: e.accentVar }}>{e.company}</span>
                  <span className="pf2-tl-role">/ {e.role}</span>
                  <span className="pf2-tl-dates">{e.dates}</span>
                </div>
                <p className="pf2-tl-desc">{e.desc}</p>
                <div className="pf2-tl-tags">
                  {e.tags.map((t) => (
                    <span key={t} className="pf2-tl-tag" style={{ "--dot-color": e.accentVar } as React.CSSProperties}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Skills ──────────────────────────────────── */}
        <section className="pf-section" id="skills">
          <div className="pf-section-label"><span>▸ TECH_STACK</span></div>
          <div className="pf2-skills-groups">
            {SKILLS_GROUPED.map((g) => (
              <div
                key={g.group}
                className="pf2-skill-group"
                style={{ "--group-color": g.accentVar } as React.CSSProperties}
              >
                <div className="pf2-sg-label">{g.group}</div>
                {g.skills.map((s) => (
                  <div key={s.name} className="pf2-skill-row">
                    <div className="pf2-skill-meta">
                      <span className="pf2-skill-name">{s.name}</span>
                      <span className="pf2-skill-yrs">{s.years}</span>
                    </div>
                    <div className="pf2-skill-bar">
                      <div className="pf2-skill-fill" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── About ───────────────────────────────────── */}
        <section className="pf-section" id="about">
          <div className="pf-section-label"><span>▸ ABOUT_ME</span></div>
          <div className="pf-about-grid">
            <div className="pf-photo-frame">
              <img src={avatar} alt="Avatar" className="pf2-photo-img" />
              <div className="pf-photo-rec">● REC</div>
            </div>
            <div className="pf-about-text">
              <p>
                HEY — I'M THAI. A HANOI-BASED FULL-STACK DEVELOPER WHO BUILDS THINGS THAT REFUSE TO BLEND IN.<br /><br />
                I SPECIALIZE IN PERFORMANT WEB APPS, REACTIVE BACKENDS, AND INTERFACES THAT SCALE.
                FOUR YEARS IN THE INDUSTRY — SHIPPING AT BANKS, ROBOTICS COMPANIES, AND AI STARTUPS ACROSS VIETNAM.<br /><br />
                I'M CURRENTLY OPEN TO FULL-TIME AND CONTRACT WORK. IF YOUR PROJECT NEEDS TO STAND OUT — NOT JUST SHOW UP — LET'S TALK.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <div className="pf2-avail">
                  <span className="pf2-avail-dot" />
                  AVAILABLE · JUN 2026
                </div>
                <a href="/cv-tqthai.pdf" download className="pf2-cv-btn">↓ CV</a>
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

          <div className="pf2-contact-grid">
            {/* Info column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 11,
                  letterSpacing: ".28em", color: "var(--pf-muted)", marginBottom: 8,
                }}>EMAIL</div>
                <a href="mailto:thaimeo0210@gmail.com" className="pf-contact-email" style={{ fontSize: 14 }}>
                  THAIMEO0210@GMAIL.COM
                </a>
              </div>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 11,
                  letterSpacing: ".28em", color: "var(--pf-muted)", marginBottom: 8,
                }}>PHONE</div>
                <div className="pf-contact-phone">+84 916 320 407</div>
              </div>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 11,
                  letterSpacing: ".28em", color: "var(--pf-muted)", marginBottom: 12,
                }}>FIND ME</div>
                <div className="pf-social-links">
                  <a
                    href="https://github.com/paKymoK"
                    target="_blank" rel="noopener noreferrer"
                    className="pf-social-link"
                    style={{ color: "var(--pf-green)", borderColor: "var(--pf-green)" }}
                  >
                    <GithubOutlined />
                  </a>
                  <a
                    href="https://web.facebook.com/PsionicPlasma"
                    target="_blank" rel="noopener noreferrer"
                    className="pf-social-link"
                    style={{ color: "var(--pf-cyan)", borderColor: "var(--pf-cyan)" }}
                  >
                    <FacebookOutlined />
                  </a>
                </div>
              </div>
              <div className="pf2-avail" style={{ alignSelf: "flex-start" }}>
                <span className="pf2-avail-dot" />
                OPEN TO WORK · JUN 2026
              </div>
            </div>

            {/* Form column */}
            <div className="pf2-form">
              <div className="pf2-field-group">
                <label className="pf2-field-label">YOUR NAME</label>
                <input
                  className="pf2-field"
                  placeholder="John / Company"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </div>
              <div className="pf2-field-group">
                <label className="pf2-field-label">EMAIL</label>
                <input
                  className="pf2-field"
                  type="email"
                  placeholder="hello@company.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </div>
              <div className="pf2-field-group">
                <label className="pf2-field-label">MESSAGE</label>
                <textarea
                  className="pf2-field"
                  rows={5}
                  placeholder="Tell me about your project…"
                  value={form.message}
                  onChange={(e) => updateForm("message", e.target.value)}
                />
              </div>
              <button
                className="pf-btn-primary"
                onClick={submitForm}
                style={{
                  opacity: form.name.trim() && form.message.trim() ? 1 : 0.5,
                  alignSelf: "flex-start",
                }}
              >
                {sent ? "✓ OPENING MAIL CLIENT" : "SEND MESSAGE ▸"}
              </button>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10, color: "var(--pf-muted)",
              }}>
                // Opens your email client with message pre-filled
              </span>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="pf-footer">
          <span>©{new Date().getFullYear()} TQTHAI — ALL RIGHTS RESERVED</span>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, color: "var(--pf-muted)", letterSpacing: "2px",
          }}>
            SYS://BUILD_OK
          </span>
        </footer>

      </div>
    </div>
  );
}
