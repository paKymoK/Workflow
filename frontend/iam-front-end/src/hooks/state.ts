import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlState<T>(
  key: string,
  defaultValue: T,
): [T, (update: T | ((prev: T) => T)) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo((): T => {
    const raw = searchParams.get(key);
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, key]);

  const setValue = useCallback(
    (update: T | ((prev: T) => T)) => {
      setSearchParams(
        (prev) => {
          const rawCurrent = prev.get(key);
          const current: T =
            rawCurrent !== null
              ? (() => { try { return JSON.parse(rawCurrent) as T; } catch { return defaultValue; } })()
              : defaultValue;
          const next = typeof update === "function" ? (update as (prev: T) => T)(current) : update;
          const p = new URLSearchParams(prev);
          if (JSON.stringify(next) === JSON.stringify(defaultValue)) {
            p.delete(key);
          } else {
            p.set(key, JSON.stringify(next));
          }
          return p;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setSearchParams],
  );

  return [value, setValue] as const;
}
