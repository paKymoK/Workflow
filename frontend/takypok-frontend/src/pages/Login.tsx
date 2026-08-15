import { useEffect, useState } from "react";
import { useAuth, useTheme, BubbleBackground } from "@takypok/shared";
import AddUserModal from "../components/settings/AddUserModal";
import { Icon } from "../components/ui/Icon";
import { dynamicStyle } from "../utils/dynamicStyle";

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
  const { login, authError, clearAuthError } = useAuth();
  const [clock, setClock] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
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

  const ssoDisabled = authHealth !== "up";
  const ssoLabel =
    authHealth === "checking"
      ? "Checking service…"
      : authHealth === "down"
      ? "Service unavailable"
      : "Continue with SSO";

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={dynamicStyle({ background: "radial-gradient(circle at 50% 0%, var(--accent-soft) 0%, var(--bg) 55%)" })}
    >
      <BubbleBackground />

      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="fixed top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] hover:bg-[var(--hover)] transition-all cursor-pointer"
      >
        <Icon name={isDark ? "sun" : "moon"} size={15} stroke={2} />
      </button>

      <div className="relative z-10 flex flex-col items-center gap-7 w-[min(400px,88vw)] fade-up">
        {/* Brand lockup */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold text-[19px]"
            style={dynamicStyle({ boxShadow: "0 6px 18px color-mix(in oklab, var(--accent) 35%, transparent)" })}
          >
            T
          </div>
          <span className="text-[17px] font-bold text-[var(--text)]">TAKYPOK</span>
        </div>

        {/* Card */}
        <div
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-[30px] py-8 box-border"
          style={dynamicStyle({ boxShadow: "0 12px 36px rgba(30,42,58,0.08)" })}
        >
          <div className="text-center mb-[22px]">
            <h2 className="text-[21px] font-bold text-[var(--text)] mb-1.5">Sign in to your workspace</h2>
            <p className="text-[12.5px] text-[var(--text-faint)]">Use your organization account to continue</p>
          </div>

          {authHealth === "down" && (
            <div
              className="mb-4 rounded-[10px] border border-[var(--red)] px-4 py-3"
              style={dynamicStyle({ background: "color-mix(in oklab, var(--red) 8%, transparent)" })}
            >
              <span className="text-[13px] font-semibold text-[var(--red)]">Authentication unavailable</span>
              <p className="text-[11.5px] text-[var(--text-dim)] leading-relaxed mt-1 mb-0">
                The authentication service is currently unavailable. Access is disabled until it recovers.
              </p>
            </div>
          )}

          {authError && (
            <div
              className="mb-4 rounded-[10px] border border-[var(--red)] px-4 py-3"
              style={dynamicStyle({ background: "color-mix(in oklab, var(--red) 8%, transparent)" })}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--red)]">Authentication error</span>
                <button
                  onClick={clearAuthError}
                  className="text-[var(--red)] opacity-60 hover:opacity-100 text-[13px] leading-none bg-transparent border-none cursor-pointer p-0"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11.5px] text-[var(--text-dim)] leading-relaxed break-words mt-1 mb-0">{authError}</p>
            </div>
          )}

          <button
            onClick={() => login(true)}
            disabled={ssoDisabled}
            className="w-full py-3 rounded-[10px] border-none bg-[var(--accent)] text-white text-sm font-bold cursor-pointer mb-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="shield" size={15} stroke={2.2} />
            {ssoLabel}
          </button>
          <button
            onClick={() => setRegisterOpen(true)}
            className="w-full py-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] text-sm font-semibold cursor-pointer mb-[18px] hover:bg-[var(--hover)]"
          >
            Request access
          </button>

          <div className="flex items-center gap-2.5 mb-[18px]">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[10.5px] text-[var(--text-faint)] uppercase tracking-[.05em]">Secured</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="flex items-center justify-center gap-[18px]">
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
              <Icon name="lock" size={12} stroke={2} /> OAuth2 · PKCE
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
              <Icon name="shield" size={12} stroke={2} /> Session encrypted
            </span>
          </div>
        </div>

        <span className="text-[11px] text-[var(--text-faint)]">
          Need help? <a href="#" className="text-[var(--accent)] no-underline font-semibold">Contact your admin</a>
        </span>
      </div>

      <AddUserModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => setRegisterOpen(false)}
      />

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 h-7 bg-[var(--accent)] flex items-center px-[18px] gap-5 text-white text-[11px] font-semibold z-10">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white blink" />
          LIVE
        </span>
        <span className="ml-auto tabular-nums">{clock}</span>
      </div>
    </div>
  );
}
