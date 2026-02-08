import { createContext } from "react";
import type { TokenResponse } from "./pkce";

export interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: Record<string, unknown> | null;
  login: () => Promise<void>;
  logout: () => void;
  handleCallback: (code: string, codeVerifier: string) => Promise<void>;
  setTokenResponse: (tokenResponse: TokenResponse) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
