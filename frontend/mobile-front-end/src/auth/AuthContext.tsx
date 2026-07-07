import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const AUTH_SERVER = process.env.EXPO_PUBLIC_AUTH_SERVER!;
const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID!;
const REDIRECT_URI = process.env.EXPO_PUBLIC_REDIRECT_URI!;
const SCOPES = (process.env.EXPO_PUBLIC_SCOPES ?? 'openid profile offline_access').split(' ');

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `${AUTH_SERVER}/oauth2/authorize`,
  tokenEndpoint: `${AUTH_SERVER}/oauth2/token`,
  revocationEndpoint: `${AUTH_SERVER}/oauth2/revoke`,
};

async function storeTokens(tokens: AuthSession.TokenResponse) {
  await SecureStore.setItemAsync('access_token', tokens.accessToken);
  if (tokens.refreshToken) await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
  if (tokens.idToken) await SecureStore.setItemAsync('id_token', tokens.idToken);
}

async function clearTokens() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  await SecureStore.deleteItemAsync('id_token');
}

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

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: SCOPES,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  useEffect(() => {
    SecureStore.getItemAsync('access_token').then((token) => {
      setIsAuthenticated(!!token);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!response || !request) return;

    if (response.type === 'error') {
      setError(response.error?.message ?? 'Login failed');
      setIsAuthenticating(false);
      return;
    }
    if (response.type !== 'success') {
      setIsAuthenticating(false);
      return;
    }

    (async () => {
      try {
        const tokens = await AuthSession.exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code: response.params.code,
            redirectUri: REDIRECT_URI,
            extraParams: { code_verifier: request.codeVerifier ?? '' },
          },
          discovery,
        );
        await storeTokens(tokens);
        setError(null);
        setIsAuthenticated(true);
      } catch {
        setError('Could not complete sign-in. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    })();
  }, [response, request]);

  const login = async () => {
    setError(null);
    setIsAuthenticating(true);
    const result = await promptAsync();
    if (result.type !== 'success') {
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
