import { useState, useEffect, useRef, type ReactNode } from "react";
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

  // Always points to the latest closure — safe to call from a timer
  const doRefreshRef = useRef<() => Promise<void>>(async () => {});

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

  const login = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    sessionStorage.setItem("pkce_code_verifier", codeVerifier);
    sessionStorage.setItem("pkce_state", state);

    const authUrl = buildAuthorizationUrl(codeChallenge, state);
    window.location.href = authUrl;
  };

  const handleCallback = async (code: string, codeVerifier: string) => {
    const { exchangeCodeForToken } = await import("./pkce");
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    setTokenResponse(tokenResponse);
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
