import { useEffect, useRef, type ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  parseJwtPayload,
  refreshAccessToken,
  type TokenResponse,
} from "./pkce";
import { AuthContext } from "./AuthContext";
import { registerNavigate, navigate } from "../lib/navigate";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigateFn = useNavigate();
  useEffect(() => { registerNavigate(navigateFn); }, [navigateFn]);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always points to the latest closure — safe to call from a timer or message handler
  const doRefreshRef      = useRef<() => Promise<void>>(async () => {});
  const handleCallbackRef = useRef<(code: string, cv: string) => Promise<void>>(async () => {});

  const scheduleRefresh = (expiresInSeconds: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresInSeconds - 60) * 1000, 0);
    refreshTimerRef.current = setTimeout(() => doRefreshRef.current(), delay);
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
    const storedToken = sessionStorage.getItem("access_token");
    if (storedToken) {
      try {
        const claims = parseJwtPayload(storedToken);
        const exp = claims["exp"] as number | undefined;
        if (exp && Date.now() / 1000 >= exp) {
          sessionStorage.removeItem("access_token");
        } else {
          setAccessToken(storedToken);
          setUser(claims);
          if (exp) {
            scheduleRefresh(exp - Date.now() / 1000);
          }
        }
      } catch {
        // opaque token or parse failure — trust it, no user claims
        setAccessToken(storedToken);
      }
    }
    setIsLoading(false);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const login = async (usePopup = false) => {
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
    const { exchangeCodeForToken } = await import("./pkce");
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    setTokenResponse(tokenResponse);
  };

  // Keep ref current so the message listener always calls the latest version
  handleCallbackRef.current = handleCallback;

  // Listen for the code posted back by the popup's Callback page
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string })?.type !== "auth-callback") return;

      const { code, state } = event.data as { code: string; state: string };
      const savedState   = sessionStorage.getItem("pkce_state");
      const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
      if (state !== savedState || !codeVerifier) return;

      try {
        await handleCallbackRef.current(code, codeVerifier);
        sessionStorage.removeItem("pkce_code_verifier");
        sessionStorage.removeItem("pkce_state");
        navigate("/");
      } catch {
        navigate("/login");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        login,
        logout,
        handleCallback,
        setTokenResponse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
