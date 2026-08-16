import * as refreshTokenCache from './refreshTokenCache';
import * as refreshTokenVault from './refreshTokenVault';
import { refreshTokenIfPossible } from './refreshSingleton';

export type GateResult = 'unlocked' | 'no-session' | 'failed';

// Runs the biometric/passcode prompt against the gated refresh-token vault, and on
// success primes the in-memory cache and does one silent refresh so the caller gets
// back a live access token, not just an unlocked vault.
//
// - 'no-session': vault is empty (first-ever login on this device, or before this
//   feature shipped) — reading an absent Keychain item does not trigger the OS
//   prompt on either platform, so this resolves without ever showing biometrics.
// - 'failed': prompt was cancelled/failed, item was invalidated (e.g. biometric
//   re-enrollment), or the silent refresh itself failed. Callers must NOT treat
//   this as "wipe everything" — it just means try again or log in interactively.
export async function runBiometricGate(): Promise<GateResult> {
  let refreshToken: string | null;
  try {
    refreshToken = await refreshTokenVault.loadRefreshToken({
      title: 'Unlock Workflow',
      cancel: 'Cancel',
    });
  } catch (err) {
    if (__DEV__) {
      console.warn('[auth] biometric gate failed/cancelled', String(err));
    }
    return 'failed';
  }

  if (!refreshToken) return 'no-session';

  refreshTokenCache.set(refreshToken);
  const newAccessToken = await refreshTokenIfPossible();
  return newAccessToken ? 'unlocked' : 'failed';
}
