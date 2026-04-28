import { useEffect, useRef, type ReactNode } from "react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  parseJwtPayload,
  type TokenResponse,
} from "./pkce";
import { AuthContext } from "./AuthContext";
import { registerNavigate, navigate } from "../lib/navigate";
import { registerTokenSync, registerLogout } from "../lib/tokenSync";
import { refreshTokenIfPossible } from "../lib/refreshSingleton";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigateFn = useNavigate();
  useEffect(() => { registerNavigate(navigateFn); }, [navigateFn]);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleCallbackRef   = useRef<(code: string, cv: string) => Promise<void>>(async () => {});
  const setTokenResponseRef = useRef<(t: TokenResponse) => void>(() => {});

  const setTokenResponse = (tokenResponse: TokenResponse) => {
    setAccessToken(tokenResponse.access_token);
    sessionStorage.setItem("access_token", tokenResponse.access_token);

    if (tokenResponse.refresh_token) {
      sessionStorage.setItem("refresh_token", tokenResponse.refresh_token);
    }

    try {
      const claims = parseJwtPayload(tokenResponse.access_token);
      setUser(claims);
    } catch {
      // opaque token — no user claims available
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
            setAccessToken(storedToken);
            setUser(claims);
            setIsLoading(false);
            return;
          }
          sessionStorage.removeItem("access_token");
        } catch {
          setAccessToken(storedToken);
          setIsLoading(false);
          return;
        }
      }

      const newToken = await refreshTokenIfPossible();
      if (!newToken) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
      }

      setIsLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAuthError = () => setAuthError(null);

  const login = async (usePopup = false) => {
    setAuthError(null);
    let popup: Window | null = null;

    if (usePopup) {
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

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("pkce_code_verifier");
    sessionStorage.removeItem("pkce_state");
  }, []);

  handleCallbackRef.current   = handleCallback;
  setTokenResponseRef.current = setTokenResponse;

  useEffect(() => {
    registerTokenSync((t) => setTokenResponseRef.current(t));
    registerLogout(() => { logout(); navigate("/login"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
