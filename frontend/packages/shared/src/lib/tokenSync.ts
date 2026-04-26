import type { TokenResponse } from "../auth/pkce";

type TokenSyncCallback = (tokenResponse: TokenResponse) => void;

let _onTokenRefreshed: TokenSyncCallback | null = null;

export function registerTokenSync(fn: TokenSyncCallback) {
  _onTokenRefreshed = fn;
}

export function notifyTokenRefreshed(tokenResponse: TokenResponse) {
  _onTokenRefreshed?.(tokenResponse);
}
