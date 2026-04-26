import type { NavigateFunction } from "react-router-dom";

let _navigate: NavigateFunction | null = null;

export function registerNavigate(fn: NavigateFunction) {
  _navigate = fn;
}

export function navigate(to: string) {
  _navigate?.(to);
}
