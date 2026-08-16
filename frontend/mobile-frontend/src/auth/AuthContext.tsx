import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { authorize } from 'react-native-app-auth';

import { authConfig } from './authConfig';
import { parseJwtPayload, type AccessTokenClaims } from './jwt';
import { clearTokens, loadTokens, saveTokens } from './tokenStorage';
import { registerLogout } from './tokenSync';
import { runBiometricGate } from './biometricGate';
import * as refreshTokenCache from './refreshTokenCache';
import * as refreshTokenVault from './refreshTokenVault';
import { unregisterDeviceToken } from '@/src/api/notificationsApi';
import { getLastFcmToken, setLastFcmToken } from '@/src/notifications/tokenStore';

// Backgrounding for less than this is treated as an app-switcher blip, not a real
// exit — no re-lock. A real banking app would likely re-lock every time for
// compliance; this is a proportionate default for a training project.
const RELOCK_AFTER_BACKGROUND_MS = 30_000;

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
  isLocked: boolean;
  error: string | null;
  user: AccessTokenClaims | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  unlock: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AccessTokenClaims | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const gateResult = await runBiometricGate();

      if (gateResult === 'unlocked') {
        const tokens = await loadTokens();
        setIsAuthenticated(!!tokens?.accessToken);
        setUser(tokens?.accessToken ? decodeUser(tokens.accessToken) : null);
        setIsLoading(false);
        return;
      }

      if (gateResult === 'no-session') {
        // Legacy path: either first-ever login on this device, or a device that
        // logged in before the biometric vault existed. Trust the plain access
        // token as-is, same as before this feature — the vault gets populated
        // next time login() runs, no migration step needed.
        const tokens = await loadTokens();
        setIsAuthenticated(!!tokens?.accessToken);
        setUser(tokens?.accessToken ? decodeUser(tokens.accessToken) : null);
        setIsLoading(false);
        return;
      }

      // 'failed': prompt cancelled/failed. Don't wipe anything — just show the
      // login screen; the stored vault/tokens are untouched.
      setIsAuthenticated(false);
      setIsLoading(false);
    })();
  }, []);

  // Re-lock (clear the in-memory refresh token cache) after a meaningful stretch
  // in the background, so returning to the app requires a fresh biometric prompt
  // instead of trusting a stale in-memory cache indefinitely.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background') {
        backgroundedAtRef.current = Date.now();
        return;
      }

      if (next === 'active' && backgroundedAtRef.current !== null) {
        const backgroundedMs = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (backgroundedMs >= RELOCK_AFTER_BACKGROUND_MS && refreshTokenCache.get()) {
          refreshTokenCache.clear();
          setIsLocked(true);
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const unlock = async () => {
    const gateResult = await runBiometricGate();
    if (gateResult === 'unlocked') {
      setIsLocked(false);
    }
    // 'failed'/'no-session' (vault cleared out from under us, e.g. logout on
    // another path): leave the overlay up so the user can retry.
  };

  const login = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const result = await authorize(authConfig);
      if (__DEV__ && !result.refreshToken) {
        console.warn('[auth] authorize() returned no refreshToken — future 401s will not be recoverable this session');
      }
      await saveTokens({ accessToken: result.accessToken, idToken: result.idToken });
      if (result.refreshToken) {
        refreshTokenCache.set(result.refreshToken);
        await refreshTokenVault.saveRefreshToken(result.refreshToken).catch((err) => {
          // Device may lack biometrics/passcode entirely — degrade gracefully to
          // "no gate on this device" rather than failing the whole login.
          if (__DEV__) {
            console.warn('[auth] could not persist refresh token to biometric vault', String(err));
          }
        });
      }
      setUser(decodeUser(result.accessToken));
      setIsAuthenticated(true);
      setIsLocked(false);
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
    await refreshTokenVault.clearRefreshToken();
    refreshTokenCache.clear();
    setUser(null);
    setIsAuthenticated(false);
    setIsLocked(false);
  };

  useEffect(() => {
    registerLogout(() => { logout(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, isAuthenticating, isLocked, error, user, login, logout, unlock }),
    [isAuthenticated, isLoading, isAuthenticating, isLocked, error, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
