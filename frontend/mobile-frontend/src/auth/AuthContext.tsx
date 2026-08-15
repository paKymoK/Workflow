import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authorize } from 'react-native-app-auth';

import { authConfig } from './authConfig';
import { parseJwtPayload, type AccessTokenClaims } from './jwt';
import { clearTokens, loadTokens, saveTokens } from './tokenStorage';
import { registerLogout } from './tokenSync';
import { unregisterDeviceToken } from '@/src/api/notificationsApi';
import { getLastFcmToken, setLastFcmToken } from '@/src/notifications/tokenStore';

function decodeUser(accessToken: string): AccessTokenClaims | null {
  try {
    return parseJwtPayload(accessToken);
  } catch {
    return null;
  }
}

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  user: AccessTokenClaims | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AccessTokenClaims | null>(null);

  useEffect(() => {
    loadTokens().then((tokens) => {
      setIsAuthenticated(!!tokens?.accessToken);
      setUser(tokens?.accessToken ? decodeUser(tokens.accessToken) : null);
      setIsLoading(false);
    });
  }, []);

  const login = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const result = await authorize(authConfig);
      if (__DEV__ && !result.refreshToken) {
        console.warn('[auth] authorize() returned no refreshToken — future 401s will not be recoverable this session');
      }
      await saveTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
      });
      setUser(decodeUser(result.accessToken));
      setIsAuthenticated(true);
    } catch {
      setError('Could not complete sign-in. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    const fcmToken = getLastFcmToken();
    if (fcmToken) {
      unregisterDeviceToken(fcmToken).catch(() => {});
      setLastFcmToken(null);
    }
    await clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    registerLogout(() => { logout(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, isAuthenticating, error, user, login, logout }),
    [isAuthenticated, isLoading, isAuthenticating, error, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
