/* eslint-disable local/no-inline-styles */
import { useEffect, useRef, useState } from "react";
import "../portfolio-nttha.css";

/* ── Data ──────────────────────────────────────────────────────────────── */
const SKILLS = [
  { cat: "Infrastructure", items: ["Linux / Unix", "Docker", "Kubernetes", "VMware", "Nginx"] },
  { cat: "Cloud & IaC",    items: ["AWS", "GCP", "Terraform", "Ansible", "CloudFormation"] },
  { cat: "CI/CD & DevOps", items: ["GitLab CI", "Jenkins", "ArgoCD", "GitHub Actions", "Helm"] },
  { cat: "Monitoring",     items: ["Prometheus", "Grafana", "ELK Stack", "Zabbix", "Alertmanager"] },
  { cat: "Scripting",      items: ["Bash", "Python", "YAML", "SQL", "PowerShell"] },
  { cat: "Security",       items: ["CIS Benchmarks", "OpenSCAP", "SSL/TLS", "HashiCorp Vault", "RBAC"] },
];

const PROJECTS = [
  {
    title: "K8s Migration",
    tag: "Infrastructure",
    desc: "Migrated legacy monolith to containerized microservices on Kubernetes, cutting deployment time by 70%.",
    chips: ["Kubernetes", "Docker", "Helm"],
  },
  {
    title: "Automated CI/CD Pipeline",
    tag: "DevOps",
    desc: "Built end-to-end GitLab CI/CD pipeline with automated testing, security scanning, and blue-green deployments across 3 environments.",
    chips: ["GitLab CI", "ArgoCD", "Jenkins"],
  },
  {
    title: "Observability Platform",
    tag: "Monitoring",
    desc: "Deployed Prometheus + Grafana stack across 50+ servers with custom dashboards, SLO tracking and PagerDuty alerting.",
    chips: ["Prometheus", "Grafana", "ELK"],
  },
  {
    title: "Cloud Cost Reduction",
    tag: "Cloud",
    desc: "Cut AWS monthly spend by 40% through rightsizing, reserved instances, spot fleet strategies, and automated scheduling.",
    chips: ["AWS", "Terraform", "Cost Explorer"],
  },
  {
    title: "Security Hardening",
    tag: "Security",
    desc: "Achieved CIS benchmark compliance across 80+ Linux servers, reducing vulnerability surface by 85% and passing external audit.",
    chips: ["Linux", "OpenSCAP", "Vault"],
  },
  {
    title: "Disaster Recovery",
    tag: "Infrastructure",
    desc: "Designed multi-region DR plan achieving RPO of 15 min and RTO of 30 min for all critical production services.",
    chips: ["AWS", "Route53", "RDS"],
  },
];

const EXPERIENCE = [
  {
    period: "2023 – Present",
    role: "Senior DevOps Engineer",
    company: "Tech Solutions Vietnam",
    desc: "Leading cloud infrastructure modernization on AWS for 20+ microservices. Driving DevOps culture and automation adoption across engineering teams.",
  },
  {
    period: "2021 – 2023",
    role: "System Administrator",
    company: "Digital Agency Hanoi",
    desc: "Managed on-premise Linux fleet of 60+ servers. Implemented centralized monitoring, automated backup workflows, and CI/CD tooling.",
  },
  {
    period: "2019 – 2021",
    role: "Junior System Admin",
    company: "StartUp Vietnam",
    desc: "Supported daily IT operations, maintained 99.9% uptime SLA, and automated routine tasks with Bash and Python scripting.",
  },
];

/* animated background bubbles for hero */
const BUBBLES: React.CSSProperties[] = [
  { top: "8%",    right: "7%",   width: 220, height: 220, borderRadius: "50%", background: "oklch(91% 0.07 215)",          animation: "nth-float  7s ease-in-out infinite",       opacity: 0.7 },
  { bottom: "10%",left: "6%",   width: 150, height: 150, borderRadius: "50%", background: "oklch(88% 0.09 205)",          animation: "nth-float  9s ease-in-out infinite 2.5s",  opacity: 0.55 },
  { top: "42%",   left: "10%",  width:  64, height:  64, borderRadius: "50%", background: "transparent",                  animation: "nth-float  5.5s ease-in-out infinite 1s",  border: "2px solid rgba(126,200,227,0.55)" },
  { top: "22%",   right: "22%", width:  38, height:  38, borderRadius: "50%", background: "transparent",                  animation: "nth-bubble 6s ease-in infinite 0.5s",      border: "2px solid rgba(26,122,181,0.35)" },
  { bottom: "28%",right: "14%", width:  22, height:  22, borderRadius: "50%", background: "rgba(126,200,227,0.3)",         animation: "nth-bubble 8s ease-in infinite 2s" },
  { top: "60%",   right: "30%", width:  14, height:  14, borderRadius: "50%", background: "rgba(126,200,227,0.4)",         animation: "nth-bubble 5s ease-in infinite 4s" },
  { bottom: "40%",left: "20%",  width:  18, height:  18, borderRadius: "50%", background: "transparent",                  animation: "nth-bubble 7s ease-in infinite 1.5s",      border: "1.5px solid rgba(26,122,181,0.3)" },
  { top: "10%",   right: "8%",  width: 220, height: 220, borderRadius: "50%", background: "transparent",                  animation: "nth-ripple 4s ease-out infinite 1s",       border: "2px solid rgba(126,200,227,0.25)" },
];

/* ── Sub-components ────────────────────────────────────────────────────── */
function Wave({ from, to, path }: { from: string; to: string; path: string }) {
  return (
    <div aria-hidden style={{ overflow: "hidden", lineHeight: 0, background: from, marginTop: -1 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 60 }}>
        <path fill={to} d={path} />
      </svg>
    </div>
  );
}

function ContactLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="nth-contact-link">
      <div style={{
        width: 44, height: 44, borderRadius: "50%", background: "#1a7ab5",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <span>{label}</span>
    </a>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function PortfolioNttha() {
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /* nav scroll → frosted glass */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* fade-up on scroll via IntersectionObserver */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 },
    );
    rootRef.current?.querySelectorAll(".nth-fi").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const leftProjects  = PROJECTS.filter((_, i) => i % 2 === 0);
  const rightProjects = PROJECTS.filter((_, i) => i % 2 === 1);

  return (
    <div ref={rootRef} className="nth-root" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0d2b3e", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav className="nth-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 56px", height: 68,
        background: scrolled ? "rgba(238,246,251,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(126,200,227,0.25)" : "1px solid transparent",
        transition: "background 0.35s ease, border-color 0.35s ease",
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#0d2b3e", fontWeight: 600 }}>
          Thu Hà
        </span>
        <div className="nth-nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["about", "skills", "projects", "experience", "contact"].map((s) => (
            <a key={s} href={`#${s}`} className="nth-nav-link">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          ))}
        </div>
        <a href="#contact" className="nth-btn-contact">Contact</a>
      </nav>

      {/* ── Hero ── */}
      <section id="home" className="nth-hero nth-section" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "120px 48px 80px",
        background: "linear-gradient(150deg,#eef6fb 0%,#ffffff 55%,#e4f3fb 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* bubbles */}
        <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {BUBBLES.map((b, i) => <div key={i} style={{ position: "absolute", ...b }} />)}
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, animation: "nth-fadeUp 0.9s ease both" }}>
          <p style={{ fontSize: 13, letterSpacing: "0.18em", color: "#1a7ab5", textTransform: "uppercase", marginBottom: 20, fontWeight: 500 }}>
            DevOps · System Administration
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(52px,9vw,96px)", fontWeight: 700, color: "#0d2b3e", lineHeight: 1.05, marginBottom: 6 }}>
            Nguyễn Thị
          </h1>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(52px,9vw,96px)", fontWeight: 400, fontStyle: "italic", color: "#1a7ab5", lineHeight: 1.05, marginBottom: 28 }}>
            Thu Hà
          </h1>
          <p className="nth-hero-sub" style={{ fontSize: 18, color: "#4a7a96", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.75, fontWeight: 300 }}>
            Building reliable infrastructure and automating the path from code to production — with precision and care.
          </p>
          <div className="nth-hero-btns" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#projects" className="nth-btn-primary">View My Work</a>
            <a href="#contact"  className="nth-btn-outline">Get In Touch</a>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4, zIndex: 1 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4a7a96" }}>Scroll</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom,#7ec8e3,transparent)" }} />
        </div>
      </section>

      <Wave from="#eef6fb" to="#ffffff" path="M0,52 C240,78 480,18 720,52 C960,86 1200,18 1440,52 L1440,72 L0,72 Z" />

      {/* ── About ── */}
      <section id="about" className="nth-section" style={{ padding: "120px 10%", background: "#ffffff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="nth-about-grid">
          {/* text */}
          <div className="nth-fi">
            <p style={{ fontSize: 13, letterSpacing: "0.15em", color: "#7ec8e3", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>About Me</p>
            <h2 className="nth-h2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#0d2b3e", marginBottom: 24, lineHeight: 1.2 }}>
              Passionate about<br /><em style={{ color: "#1a7ab5", fontWeight: 400 }}>reliable systems</em>
            </h2>
            <p style={{ fontSize: 16, color: "#4a7a96", lineHeight: 1.8, marginBottom: 18 }}>
              I'm Thu Hà, a DevOps Engineer and System Administrator based in Vietnam. With 5+ years of experience, I specialize in building and automating scalable infrastructure that keeps services running smoothly — even under pressure.
            </p>
            <p style={{ fontSize: 16, color: "#4a7a96", lineHeight: 1.8, marginBottom: 40 }}>
              I care deeply about monitoring, observability, and security — turning complex systems into reliable, self-healing environments.
            </p>
            <div className="nth-stats" style={{ display: "flex", gap: 40 }}>
              {[
                { num: "5+",    label: "Years Experience" },
                { num: "30+",   label: "Projects Delivered" },
                { num: "99.9%", label: "Uptime SLA" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="nth-stat-num" style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: "#1a7ab5", lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 13, color: "#4a7a96", marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* blob + avatar placeholder */}
          <div className="nth-fi nth-about-blob" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 340, height: 340, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "66% 34% 72% 28% / 45% 61% 39% 55%", background: "linear-gradient(135deg,#daeefa,#7ec8e3)", opacity: 0.7 }} />
              <div style={{ position: "absolute", inset: 24, borderRadius: "38% 62% 27% 73% / 57% 38% 62% 43%", background: "linear-gradient(135deg,#ddf0f9,rgba(255,133,161,0.15))" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{
                  width: 120, height: 120, borderRadius: "50%",
                  background: "repeating-linear-gradient(45deg,rgba(126,200,227,0.25) 0,rgba(126,200,227,0.25) 2px,rgba(220,241,252,0.6) 2px,rgba(220,241,252,0.6) 9px)",
                  border: "2px dashed rgba(126,200,227,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 11, color: "#4a7a96", textAlign: "center", fontStyle: "italic", lineHeight: 1.5 }}>photo<br />here</span>
                </div>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#0d2b3e", fontWeight: 600, marginTop: 6 }}>Thu Hà</span>
                <span style={{ fontSize: 12, color: "#4a7a96", letterSpacing: "0.07em" }}>Hanoi, Vietnam</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Wave from="#ffffff" to="#eef6fb" path="M0,20 C360,58 1080,0 1440,20 L1440,60 L0,60 Z" />

      {/* ── Skills ── */}
      <section id="skills" className="nth-section" style={{ padding: "100px 10%", background: "#eef6fb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="nth-fi" style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 13, letterSpacing: "0.15em", color: "#7ec8e3", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>My Expertise</p>
            <h2 className="nth-h2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#0d2b3e" }}>Skills &amp; Tools</h2>
          </div>
          <div className="nth-skills-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {SKILLS.map((skill) => (
              <div key={skill.cat} className="nth-fi nth-skill-card">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#0d2b3e", marginBottom: 18 }}>{skill.cat}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {skill.items.map((item) => (
                    <span key={item} style={{ fontSize: 13, color: "#4a7a96", background: "#eef6fb", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(126,200,227,0.45)" }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#eef6fb" to="#ffffff" path="M0,40 C360,10 720,65 1080,35 C1260,20 1380,58 1440,40 L1440,60 L0,60 Z" />

      {/* ── Projects ── */}
      <section id="projects" className="nth-section" style={{ padding: "100px 10%", background: "#ffffff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="nth-fi" style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 13, letterSpacing: "0.15em", color: "#7ec8e3", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>My Work</p>
            <h2 className="nth-h2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#0d2b3e" }}>Featured Projects</h2>
          </div>
          <div className="nth-projects-grid" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* left column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
              {leftProjects.map((p) => (
                <div key={p.title} className="nth-fi nth-proj-card">
                  <span style={{ display: "inline-block", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1a7ab5", background: "rgba(26,122,181,0.1)", padding: "5px 12px", borderRadius: 100, marginBottom: 16, fontWeight: 500 }}>{p.tag}</span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#0d2b3e", marginBottom: 12 }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: "#4a7a96", lineHeight: 1.75, marginBottom: 20 }}>{p.desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {p.chips.map((c) => (
                      <span key={c} style={{ fontSize: 12, color: "#0d2b3e", background: "#fff", padding: "5px 12px", borderRadius: 100, border: "1px solid rgba(126,200,227,0.5)" }}>{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* right column — offset by 48px on desktop */}
            <div className="nth-projects-right" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, marginTop: 48 }}>
              {rightProjects.map((p) => (
                <div key={p.title} className="nth-fi nth-proj-card">
                  <span style={{ display: "inline-block", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1a7ab5", background: "rgba(26,122,181,0.1)", padding: "5px 12px", borderRadius: 100, marginBottom: 16, fontWeight: 500 }}>{p.tag}</span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#0d2b3e", marginBottom: 12 }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: "#4a7a96", lineHeight: 1.75, marginBottom: 20 }}>{p.desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {p.chips.map((c) => (
                      <span key={c} style={{ fontSize: 12, color: "#0d2b3e", background: "#fff", padding: "5px 12px", borderRadius: 100, border: "1px solid rgba(126,200,227,0.5)" }}>{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Wave from="#ffffff" to="#eef6fb" path="M0,18 C480,55 960,0 1440,18 L1440,60 L0,60 Z" />

      {/* ── Experience ── */}
      <section id="experience" className="nth-section" style={{ padding: "100px 10%", background: "#eef6fb" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div className="nth-fi" style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 13, letterSpacing: "0.15em", color: "#7ec8e3", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>Career Path</p>
            <h2 className="nth-h2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#0d2b3e" }}>Experience</h2>
          </div>
          <div className="nth-timeline" style={{ position: "relative", paddingLeft: 44 }}>
            {/* vertical line */}
            <div aria-hidden style={{ position: "absolute", left: 18, top: 8, bottom: 0, width: 1, background: "linear-gradient(to bottom,#7ec8e3,rgba(126,200,227,0.05))" }} />
            {EXPERIENCE.map((exp) => (
              <div key={exp.role} className="nth-fi" style={{ position: "relative", marginBottom: 52 }}>
                <div className="nth-tl-dot" style={{ position: "absolute", left: -34, top: 7, width: 14, height: 14, borderRadius: "50%", background: "#1a7ab5", boxShadow: "0 0 0 5px rgba(26,122,181,0.14)" }} />
                <span style={{ fontSize: 13, color: "#1a7ab5", fontWeight: 500, letterSpacing: "0.04em" }}>{exp.period}</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#0d2b3e", margin: "8px 0 4px" }}>{exp.role}</h3>
                <p style={{ fontSize: 14, color: "#4a7a96", fontWeight: 500, marginBottom: 12 }}>{exp.company}</p>
                <p style={{ fontSize: 15, color: "#4a7a96", lineHeight: 1.75 }}>{exp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#eef6fb" to="#ffffff" path="M0,42 C240,10 480,62 720,34 C960,8 1200,56 1440,42 L1440,60 L0,60 Z" />

      {/* ── Contact ── */}
      <section id="contact" className="nth-section" style={{ padding: "100px 10%", background: "#ffffff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div className="nth-fi">
            <p style={{ fontSize: 13, letterSpacing: "0.15em", color: "#7ec8e3", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>Say Hello</p>
            <h2 className="nth-h2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: "#0d2b3e", marginBottom: 16 }}>Let's Work Together</h2>
            <p style={{ fontSize: 16, color: "#4a7a96", lineHeight: 1.8, marginBottom: 52 }}>
              Have an infrastructure challenge or want to collaborate? I'd love to hear from you.
            </p>
          </div>
          <div className="nth-fi" style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, margin: "0 auto" }}>
            <ContactLink
              href="mailto:thuha@email.com"
              label="thuha@email.com"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                </svg>
              }
            />
            <ContactLink
              href="https://linkedin.com/in/thuha"
              label="linkedin.com/in/thuha"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
                </svg>
              }
            />
            <ContactLink
              href="https://github.com/thuha"
              label="github.com/thuha"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      <Wave from="#ffffff" to="#0d2b3e" path="M0,28 C360,62 1080,0 1440,28 L1440,60 L0,60 Z" />

      {/* ── Footer ── */}
      <footer className="nth-footer" style={{ padding: "48px 10%", background: "#0d2b3e", textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff", fontWeight: 400, fontStyle: "italic", marginBottom: 10 }}>
          Nguyễn Thị Thu Hà
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
          © {new Date().getFullYear()} · DevOps &amp; System Administration · Hanoi, Vietnam
        </p>
      </footer>
    </div>
  );
}
