import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AddUserModal from "../components/settings/AddUserModal";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [clock, setClock] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    const update = () =>
      setClock(new Date().toTimeString().slice(0, 8) + " UTC");
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--black)] flex flex-col items-center justify-center overflow-hidden cursor-crosshair">
      {/* Background grid */}
      <div className="fixed inset-0 bg-neon-grid z-0 pointer-events-none" />

      {/* Diagonal slash accent */}
      <div className="login-slash-accent" />

      {/* Scanlines */}
      <div className="scanlines-overlay" />

      {/* Corner decorations */}
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />

      {/* Ticker tape */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-[var(--neon-yellow)] overflow-hidden flex items-center z-10">
        <div className="ticker-track flex whitespace-nowrap">
          <span className="font-bebas text-[14px] text-black tracking-[0.2em] pr-20">
            SYSTEM ACCESS ///  AUTHENTICATE NOW ///  SECURE CONNECTION ESTABLISHED ///  AUTHORIZED PERSONNEL ONLY ///  ENTER CREDENTIALS ///  SYSTEM ACCESS ///  AUTHENTICATE NOW ///  SECURE CONNECTION ESTABLISHED ///  AUTHORIZED PERSONNEL ONLY ///  ENTER CREDENTIALS ///
          </span>
          <span className="font-bebas text-[14px] text-black tracking-[0.2em] pr-20">
            SYSTEM ACCESS ///  AUTHENTICATE NOW ///  SECURE CONNECTION ESTABLISHED ///  AUTHORIZED PERSONNEL ONLY ///  ENTER CREDENTIALS ///  SYSTEM ACCESS ///  AUTHENTICATE NOW ///  SECURE CONNECTION ESTABLISHED ///  AUTHORIZED PERSONNEL ONLY ///  ENTER CREDENTIALS ///
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 slide-in grid grid-cols-1 md:grid-cols-2 w-[min(900px,95vw)] mt-8">

        {/* ── Left panel ───────────────────────────────── */}
        <div className="relative bg-[var(--neon-yellow)] px-10 py-12 flex flex-col justify-between overflow-hidden">
          {/* Circle decoration */}
          <div className="absolute -bottom-14 -right-14 w-48 h-48 border-[36px] border-black/10 rounded-full pointer-events-none" />

          <div>
            <span className="font-bebas text-[11px] tracking-[0.3em] text-black/50 border border-black/30 px-2.5 py-1 inline-block">
              ▲ SECURE PORTAL
            </span>
          </div>

          <div>
            <h1 className="font-bebas text-[clamp(64px,8vw,96px)] leading-[0.9] text-black tracking-[-0.02em] glitch-anim">
              LOGIN<br />GATE
            </h1>
            <p className="font-barlow text-[13px] font-bold tracking-[0.2em] text-black/60 uppercase mt-4">
              // OAuth2 Access Control v2
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "UPTIME",       value: "99.98%" },
              { label: "ACTIVE NODES", value: "4,291"  },
              { label: "ENCRYPTION",   value: "AES-256" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-baseline border-b border-black/15 pb-2">
                <span className="font-mono-tech text-[10px] text-black/50 tracking-[0.1em]">{label}</span>
                <span className="font-bebas text-[22px] text-black tracking-[0.05em]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────── */}
        <div className="bg-[var(--dark)] border-2 border-[var(--neon-yellow)] md:border-l-0 flex flex-col justify-center px-10 py-12">

          {/* Header */}
          <div className="mb-8">
            <p className="font-mono-tech text-[10px] text-[var(--neon-cyan)] tracking-[0.3em] uppercase mb-2">
              ▸ Terminal Login
            </p>
            <h2 className="font-bebas text-[40px] text-[var(--white)] tracking-[0.05em] leading-none">
              ENTER <span className="neon-text-yellow">ACCESS</span>
            </h2>
          </div>

          {/* Info block */}
          <div className="mb-8 border-l-2 border-[var(--neon-cyan)] pl-4 bg-[rgba(0,245,255,0.04)] py-3 pr-3">
            <p className="font-mono-tech text-[11px] text-[var(--neon-cyan)] tracking-[0.08em] leading-relaxed">
              ✓ STATUS // Authentication is managed via OAuth2.<br />
              You will be redirected to the identity provider.
            </p>
          </div>

          {/* OAuth2 button */}
          <button
            onClick={login}
            className="neon-btn w-full bg-[var(--neon-yellow)] text-black border-none py-4 font-bebas text-[22px] tracking-[0.25em]"
          >
            <span className="neon-btn-content">INITIATE ACCESS ⚡</span>
          </button>

          {/* Register button */}
          <button
            onClick={() => setRegisterOpen(true)}
            className="w-full mt-3 py-4 font-bebas text-[22px] tracking-[0.25em] bg-transparent border-2 border-[rgba(255,229,0,0.3)] text-[rgba(240,240,240,0.6)] hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] hover:shadow-[0_0_16px_rgba(0,245,255,0.2)] transition-all cursor-crosshair"
          >
            REGISTER ◈
          </button>

          {/* Portfolio button */}
          <button
            onClick={() => navigate("/portfolio")}
            className="w-full mt-3 py-4 font-bebas text-[22px] tracking-[0.25em] bg-transparent border-2 border-[rgba(255,229,0,0.3)] text-[rgba(240,240,240,0.6)] hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] hover:shadow-[0_0_16px_rgba(0,245,255,0.2)] transition-all cursor-crosshair"
          >
            PORTFOLIO ◈
          </button>

          {/* Footer note */}
          <p className="font-mono-tech text-[9px] tracking-[0.15em] text-[rgba(240,240,240,0.2)] uppercase mt-6 text-center">
            // Secure OAuth2 · PKCE Flow · Session Encrypted
          </p>
        </div>
      </div>

      <AddUserModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => setRegisterOpen(false)}
      />

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
