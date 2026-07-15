type LogoutCallback = () => void;

let _onLogout: LogoutCallback | null = null;

export function registerLogout(fn: LogoutCallback) {
  _onLogout = fn;
}

export function notifyLogout() {
  _onLogout?.();
}
