import { useState, useEffect, type ReactNode } from "react";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  parseJwtPayload,
  type TokenResponse,
} from "./pkce";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("access_token");
    if (storedToken) {
      setAccessToken(storedToken);
      try {
        setUser(parseJwtPayload(storedToken));
      } catch {
        sessionStorage.removeItem("access_token");
      }
    }
    setIsLoading(false);
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

    try {
      const claims = parseJwtPayload(tokenResponse.access_token);
      setUser(claims);
    } catch {
      // opaque token — no user claims available
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem("access_token");
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
