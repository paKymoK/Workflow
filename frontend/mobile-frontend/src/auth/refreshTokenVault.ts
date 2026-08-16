import * as Keychain from 'react-native-keychain';

// Separate Keychain item from tokenStorage.ts, on purpose: this one carries an
// accessControl so reading it triggers Face ID/Touch ID/BiometricPrompt. It must
// only ever be read from a deliberate "unlock" step (biometricGate.ts), never
// from a hot path like the axios interceptor — otherwise every API call would
// prompt for biometrics.
const SERVICE = 'com.takypok.workflow.auth.refresh-vault';

const WRITE_OPTIONS: Keychain.SetOptions = {
  service: SERVICE,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveRefreshToken(refreshToken: string): Promise<void> {
  await Keychain.setGenericPassword('refresh-token', refreshToken, WRITE_OPTIONS);
}

// Throws (does not resolve to null) when the OS prompt is cancelled, fails, or the
// item was invalidated (e.g. biometric re-enrollment). Callers must distinguish
// "nothing stored" (resolves null) from "prompt failed" (throws) — see biometricGate.ts.
export async function loadRefreshToken(prompt: {
  title: string;
  cancel?: string;
}): Promise<string | null> {
  const result = await Keychain.getGenericPassword({
    service: SERVICE,
    authenticationPrompt: prompt,
  });
  if (!result) return null;
  return result.password;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
