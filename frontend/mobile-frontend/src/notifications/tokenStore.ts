// Module-level (not React state) so AuthContext's logout() can read the current FCM token
// without needing it prop-drilled from wherever useFcmRegistration is mounted.
let lastFcmToken: string | null = null;

export function setLastFcmToken(token: string | null) {
  lastFcmToken = token;
}

export function getLastFcmToken(): string | null {
  return lastFcmToken;
}
