import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * URL-synced state. Reads from and writes to a single search param `key`.
 * Values are JSON-encoded so numbers, booleans, and objects round-trip correctly.
 * The param is removed when the value equals `defaultValue` (keeps URLs clean).
 * Always uses `replace: true` to avoid polluting browser history.
 */
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
    // defaultValue intentionally omitted — callers often pass inline literals and
    // we don't want every render to re-derive the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, key]);

  const setValue = useCallback(
    (update: T | ((prev: T) => T)) => {
      setSearchParams(
        (prev) => {
          const rawCurrent = prev.get(key);
          const current: T =
            rawCurrent !== null
              ? (() => {
                  try {
                    return JSON.parse(rawCurrent) as T;
                  } catch {
                    return defaultValue;
                  }
                })()
              : defaultValue;

          const next =
            typeof update === "function"
              ? (update as (prev: T) => T)(current)
              : update;

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
    // defaultValue included here so the setter always captures the latest default
    // for the equality check, but the value memo above keeps a stable reference.
    [key, defaultValue, setSearchParams],
  );

  return [value, setValue] as const;
}
