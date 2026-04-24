import { useEffect, useRef, type ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  parseJwtPayload,
  refreshAccessToken,
  type TokenResponse,
} from "./pkce";
import { AuthContext } from "./AuthContext";
import { registerNavigate, navigate } from "../lib/navigate";
import { registerTokenSync } from "../lib/tokenSync";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigateFn = useNavigate();
  useEffect(() => { registerNavigate(navigateFn); }, [navigateFn]);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always points to the latest closure — safe to call from a timer or message handler
  const doRefreshRef        = useRef<() => Promise<void>>(async () => {});
  const handleCallbackRef   = useRef<(code: string, cv: string) => Promise<void>>(async () => {});
  const setTokenResponseRef = useRef<(t: import("./pkce").TokenResponse) => void>(() => {});

  const scheduleRefresh = (expiresInSeconds: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresInSeconds - 60) * 1000, 0);
    refreshTimerRef.current = setTimeout(() => doRefreshRef.current(), delay);
  };

  const setTokenResponse = (tokenResponse: TokenResponse) => {
    setAccessToken(tokenResponse.access_token);
    sessionStorage.setItem("access_token", tokenResponse.access_token);

    if (tokenResponse.refresh_token) {
      sessionStorage.setItem("refresh_token", tokenResponse.refresh_token);
    }
    if (tokenResponse.expires_in) {
      scheduleRefresh(tokenResponse.expires_in);
    }

    try {
      const claims = parseJwtPayload(tokenResponse.access_token);
      setUser(claims);
    } catch {
      // opaque token — no user claims available
    }
  };

  // Reassigned on every render so the timer always calls up-to-date functions
  doRefreshRef.current = async () => {
    const storedRefreshToken = sessionStorage.getItem("refresh_token");
    if (!storedRefreshToken) {
      logout();
      navigate("/login");
      return;
    }
    try {
      const tokenResponse = await refreshAccessToken(storedRefreshToken);
      setTokenResponse(tokenResponse);
    } catch {
      logout();
      navigate("/login");
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = sessionStorage.getItem("access_token");

      if (storedToken) {
        try {
          const claims = parseJwtPayload(storedToken);
          const exp = claims["exp"] as number | undefined;
          if (!exp || Date.now() / 1000 < exp) {
            // Token still valid — use it immediately
            setAccessToken(storedToken);
            setUser(claims);
            if (exp) scheduleRefresh(exp - Date.now() / 1000);
            setIsLoading(false);
            return;
          }
          // Expired — clear it and fall through to refresh attempt
          sessionStorage.removeItem("access_token");
        } catch {
          // Opaque token — trust it as-is, no user claims
          setAccessToken(storedToken);
          setIsLoading(false);
          return;
        }
      }

      // No valid access token — attempt a silent refresh
      const storedRefreshToken = sessionStorage.getItem("refresh_token");
      if (storedRefreshToken) {
        try {
          const tokenResponse = await refreshAccessToken(storedRefreshToken);
          setTokenResponse(tokenResponse);
        } catch {
          // Refresh token expired/invalid — force a fresh login
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
        }
      }

      setIsLoading(false);
    };

    init();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAuthError = () => setAuthError(null);

  const login = async (usePopup = false) => {
    setAuthError(null);
    let popup: Window | null = null;

    if (usePopup) {
      // Open about:blank synchronously (before any await) so the browser
      // treats it as a direct user-gesture — prevents the popup blocker.
      const w    = 500;
      const h    = 650;
      const left = Math.round(window.screenX + (window.outerWidth  - w) / 2);
      const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
      popup = window.open(
        "about:blank",
        "auth-popup",
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
      );
    }

    const codeVerifier  = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state         = generateState();

    sessionStorage.setItem("pkce_code_verifier", codeVerifier);
    sessionStorage.setItem("pkce_state", state);

    const authUrl = buildAuthorizationUrl(codeChallenge, state);

    if (usePopup && popup) {
      popup.location.href = authUrl;
    } else {
      window.location.href = authUrl;
    }
  };

  const handleCallback = async (code: string, codeVerifier: string) => {
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    setTokenResponse(tokenResponse);
  };

  // Keep refs current so timers/listeners always call the latest closure
  handleCallbackRef.current   = handleCallback;
  setTokenResponseRef.current = setTokenResponse;
  registerTokenSync((t) => setTokenResponseRef.current(t));

  // Listen for the code posted back by the popup's Callback page
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data as { type?: string; code?: string; state?: string; message?: string };

      if (msg?.type === "auth-error") {
        setAuthError(msg.message ?? "Authentication failed");
        return;
      }

      if (msg?.type !== "auth-callback") return;

      const { code, state } = msg as { code: string; state: string };
      const savedState   = sessionStorage.getItem("pkce_state");
      const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
      if (state !== savedState || !codeVerifier) return;

      try {
        await handleCallbackRef.current(code, codeVerifier);
        sessionStorage.removeItem("pkce_code_verifier");
        sessionStorage.removeItem("pkce_state");
        navigate("/");
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Token exchange failed");
        navigate("/login");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("pkce_code_verifier");
    sessionStorage.removeItem("pkce_state");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!accessToken,
        isLoading,
        accessToken,
        user,
        authError,
        login,
        logout,
        handleCallback,
        setTokenResponse,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
