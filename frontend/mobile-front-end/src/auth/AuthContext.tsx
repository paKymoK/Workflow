import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authorize, type AuthConfiguration } from 'react-native-app-auth';

import { AUTH_SERVER, CLIENT_ID, REDIRECT_URI, SCOPES } from '@env';

import { clearTokens, loadTokens, saveTokens } from './tokenStorage';

const authConfig: AuthConfiguration = {
  clientId: CLIENT_ID,
  redirectUrl: REDIRECT_URI,
  scopes: (SCOPES ?? 'openid profile offline_access').split(' '),
  usePKCE: true,
  serviceConfiguration: {
    authorizationEndpoint: `${AUTH_SERVER}/oauth2/authorize`,
    tokenEndpoint: `${AUTH_SERVER}/oauth2/token`,
    revocationEndpoint: `${AUTH_SERVER}/oauth2/revoke`,
  },
};

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTokens().then((tokens) => {
      setIsAuthenticated(!!tokens?.accessToken);
      setIsLoading(false);
    });
  }, []);

  const login = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const result = await authorize(authConfig);
      await saveTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
      });
      setIsAuthenticated(true);
    } catch {
      setError('Could not complete sign-in. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    await clearTokens();
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, isAuthenticating, error, login, logout }),
    [isAuthenticated, isLoading, isAuthenticating, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
