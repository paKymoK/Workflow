import { refresh } from 'react-native-app-auth';

import { authConfig } from './authConfig';
import { saveTokens } from './tokenStorage';
import * as refreshTokenCache from './refreshTokenCache';
import * as refreshTokenVault from './refreshTokenVault';
import { notifyLogout } from './tokenSync';

let refreshPromise: Promise<string | null> | null = null;

// Only ever reads the in-memory cache — never the biometric-gated vault directly.
// A null return here can mean "the gate hasn't unlocked yet" or "session is
// locked", not "the session is dead" — callers (axios.ts) must not treat null as
// a reason to force logout. The one case that IS a dead session — refresh()
// actually rejected by the auth server — is handled below by calling
// notifyLogout() directly, since that's the only place that can tell the
// difference.
export async function refreshTokenIfPossible(): Promise<string | null> {
  const cachedRefreshToken = refreshTokenCache.get();
  if (!cachedRefreshToken) {
    if (__DEV__) {
      console.warn('[auth] refreshTokenIfPossible: no refresh token cached, skipping refresh call');
    }
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refresh(authConfig, { refreshToken: cachedRefreshToken })
      .then(async (result) => {
        await saveTokens({ accessToken: result.accessToken, idToken: result.idToken });
        if (result.refreshToken && result.refreshToken !== cachedRefreshToken) {
          refreshTokenCache.set(result.refreshToken);
          await refreshTokenVault.saveRefreshToken(result.refreshToken).catch((err) => {
            if (__DEV__) {
              console.warn('[auth] failed to persist rotated refresh token to vault', String(err));
            }
          });
        }
        return result.accessToken;
      })
      .catch((err) => {
        if (__DEV__) {
          console.warn('[auth] refresh() call was made but failed — refresh token is dead, logging out', String(err));
        }
        refreshTokenCache.clear();
        notifyLogout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
