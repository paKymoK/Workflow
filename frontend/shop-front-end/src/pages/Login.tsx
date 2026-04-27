import { useEffect, useState } from "react";
import { useAuth, useTheme, useFont, BubbleBackground } from "@takypok/shared";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";

type AuthHealth = "checking" | "up" | "down";

async function fetchAuthHealth(): Promise<AuthHealth> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/health/auth-service`,
      { signal: AbortSignal.timeout(4000) }
    );
    const data = await res.json();
    return data?.status === "UP" ? "up" : "down";
  } catch {
    return "down";
  }
}

export default function Login() {
  const { login } = useAuth();
  const [clock, setClock] = useState("");
  const { isDark, toggleTheme } = useTheme();
  const { isCustomFont, toggleFont } = useFont();
  const [authHealth, setAuthHealth] = useState<AuthHealth>("checking");

  useEffect(() => {
    fetchAuthHealth().then(setAuthHealth);
    const id = setInterval(() => fetchAuthHealth().then(setAuthHealth), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () =>
      setClock(new Date().toTimeString().slice(0, 8) + " UTC");
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--black)] flex flex-col items-center justify-center overflow-hidden cursor-crosshair">
      <BubbleBackground />
      <div className="login-slash-accent" />

      {/* Font + Theme toggles */}
      <div className="fixed top-4 right-4 z-20 flex gap-2">
        <button
          onClick={toggleFont}
          title={isCustomFont ? "Switch to Default Font" : "Switch to Custom Font"}
          className="w-9 h-9 flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--darker)] text-[var(--neon-yellow)] hover:border-[var(--neon-yellow)] hover:bg-[var(--border-subtle)] transition-all text-xs font-bold tracking-wider"
        >
          Aa
        </button>
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-9 h-9 flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--darker)] text-[var(--neon-yellow)] hover:border-[var(--neon-yellow)] hover:bg-[var(--border-subtle)] transition-all"
        >
          {isDark ? <SunOutlined /> : <MoonOutlined />}
        </button>
      </div>

      {/* Main card */}
      <div className="relative z-10 slide-in grid grid-cols-1 md:grid-cols-2 w-[min(900px,95vw)] mt-8">

        {/* ── Left panel ───────────────────────────────── */}
        <div className="login-left-panel relative bg-[var(--neon-yellow)] px-10 py-12 flex flex-col justify-between overflow-hidden">
          <div className="absolute -bottom-14 -right-14 w-48 h-48 border-[36px] border-current rounded-full pointer-events-none opacity-10" />

          <div>
            <span className="panel-muted font-bebas text-[11px] tracking-[0.3em] border border-current px-2.5 py-1 inline-block opacity-60">
              ▲ SECURE PORTAL
            </span>
          </div>

          <div>
            <h1 className="font-bebas text-[clamp(64px,8vw,96px)] leading-[0.9] tracking-[-0.02em] glitch-anim">
              SHOP<br />GATE
            </h1>
            <p className="panel-muted font-barlow text-[13px] font-bold tracking-[0.2em] uppercase mt-4">
              // OAuth2 Access Control v2
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "UPTIME",       value: "99.98%" },
              { label: "ACTIVE NODES", value: "4,291"  },
              { label: "ENCRYPTION",   value: "AES-256" },
            ].map(({ label, value }) => (
              <div key={label} className="panel-stat-border flex justify-between items-baseline border-b pb-2">
                <span className="panel-muted font-mono-tech text-[10px] tracking-[0.1em]">{label}</span>
                <span className="font-bebas text-[22px] tracking-[0.05em]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────── */}
        <div className="bg-[var(--dark)] border-2 border-[var(--neon-yellow)] md:border-l-0 flex flex-col justify-center px-10 py-12">
          <div className="mb-8">
            <p className="font-mono-tech text-[10px] text-[var(--neon-cyan)] tracking-[0.3em] uppercase mb-2">
              ▸ Terminal Login
            </p>
            <h2 className="font-bebas text-[40px] text-[var(--white)] tracking-[0.05em] leading-none">
              ENTER <span className="neon-text-yellow">ACCESS</span>
            </h2>
          </div>

          <div className="mb-6 border-l-2 border-[var(--neon-cyan)] pl-4 bg-[rgba(0,245,255,0.04)] py-3 pr-3">
            <p className="font-mono-tech text-[11px] text-[var(--neon-cyan)] tracking-[0.08em] leading-relaxed">
              ✓ STATUS // Authentication is managed via OAuth2.<br />
              You will be redirected to the identity provider.
            </p>
          </div>

          {authHealth === "down" && (
            <div className="mb-6 border border-[var(--neon-pink)] bg-[rgba(255,45,107,0.07)] px-4 py-3 auth-down-pulse">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center justify-center w-4 h-4 border border-[var(--neon-pink)] rounded-full text-[9px] text-[var(--neon-pink)] auth-icon-spin shrink-0">
                  !
                </span>
                <span className="font-bebas text-[14px] text-[var(--neon-pink)] tracking-[0.25em]">
                  AUTH SERVICE DEGRADED
                </span>
              </div>
              <p className="font-mono-tech text-[10px] text-[rgba(255,45,107,0.7)] tracking-[0.08em] leading-relaxed">
                Authentication system is currently unavailable.<br />
                Access has been disabled until the service recovers.
              </p>
              <span className="inline-block mt-2 bg-[rgba(255,45,107,0.15)] text-[var(--neon-pink)] font-mono-tech text-[9px] px-2 py-0.5 tracking-[0.05em]">
                ERR // AUTH_SERVICE_UNAVAILABLE
              </span>
            </div>
          )}

          <button
            onClick={() => login()}
            disabled={authHealth !== "up"}
            className={`neon-btn w-full py-4 font-bebas text-[22px] tracking-[0.25em] border-none transition-all ${
              authHealth === "up"
                ? "bg-[var(--neon-yellow)] text-[var(--dark)] cursor-crosshair"
                : authHealth === "checking"
                ? "bg-[rgba(255,229,0,0.15)] text-[rgba(255,229,0,0.4)] cursor-not-allowed"
                : "bg-[rgba(255,45,107,0.12)] text-[var(--neon-pink)] border border-[var(--neon-pink)] cursor-not-allowed opacity-70"
            }`}
          >
            <span className="neon-btn-content">
              {authHealth === "checking"
                ? "CHECKING SERVICE..."
                : authHealth === "down"
                ? "// SERVICE OFFLINE //"
                : "ENTER SHOP ⚡"}
            </span>
          </button>

          <p className="font-mono-tech text-[9px] tracking-[0.15em] text-[var(--text-muted)] uppercase mt-6 text-center">
            // Secure OAuth2 · PKCE Flow · Session Encrypted
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 h-7 bg-[var(--neon-pink)] flex items-center px-4 gap-6 z-10">
        <span className="font-bebas text-[12px] text-black tracking-[0.15em] flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-black blink" />
          LIVE
        </span>
        <span className="font-bebas text-[12px] text-black tracking-[0.15em]">SYS: NOMINAL</span>
        <span className="font-bebas text-[12px] text-black tracking-[0.15em]">LOC: 127.0.0.1</span>
        <span className="font-bebas text-[12px] text-black tracking-[0.15em] ml-auto">{clock}</span>
      </div>
    </div>
  );
}
