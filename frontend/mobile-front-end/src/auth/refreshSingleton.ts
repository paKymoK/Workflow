import { refresh } from 'react-native-app-auth';

import { authConfig } from './authConfig';
import { loadTokens, saveTokens } from './tokenStorage';

let refreshPromise: Promise<string | null> | null = null;

export async function refreshTokenIfPossible(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens?.refreshToken) {
    if (__DEV__) {
      console.warn('[auth] refreshTokenIfPossible: no refreshToken in Keychain, skipping refresh call', {
        hasAccessToken: !!tokens?.accessToken,
      });
    }
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refresh(authConfig, { refreshToken: tokens.refreshToken })
      .then(async (result) => {
        await saveTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken ?? tokens.refreshToken,
          idToken: result.idToken,
        });
        return result.accessToken;
      })
      .catch((err) => {
        if (__DEV__) {
          console.warn('[auth] refresh() call was made but failed', String(err));
        }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
