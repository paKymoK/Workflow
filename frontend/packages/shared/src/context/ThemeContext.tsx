import { createContext, useEffect, type ReactNode } from "react";
import { useState } from "react";

export type AccentScheme = "ice" | "amber" | "phosphor" | "magenta";

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  accentScheme: AccentScheme;
  setAccentScheme: (scheme: AccentScheme) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  accentScheme: "ice",
  setAccentScheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const [accentScheme, setAccentSchemeState] = useState<AccentScheme>(
    () => (localStorage.getItem("accentScheme") as AccentScheme) ?? "ice",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("accentScheme", accentScheme);
    const el = document.documentElement;
    el.classList.remove("scheme-amber", "scheme-phosphor", "scheme-magenta");
    if (accentScheme !== "ice") el.classList.add(`scheme-${accentScheme}`);
  }, [accentScheme]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setAccentScheme = (scheme: AccentScheme) => setAccentSchemeState(scheme);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, accentScheme, setAccentScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
