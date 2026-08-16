// In-memory-only holder for the refresh token, populated once per "session-worthy"
// event (login, or a successful biometric gate) so refreshSingleton.ts can silently
// refresh on every 401 without re-prompting biometrics each time. Never persisted —
// cleared on logout, on re-lock after backgrounding, and implicitly on app kill.
let cachedRefreshToken: string | null = null;

export function get(): string | null {
  return cachedRefreshToken;
}

export function set(token: string): void {
  cachedRefreshToken = token;
}

export function clear(): void {
  cachedRefreshToken = null;
}
