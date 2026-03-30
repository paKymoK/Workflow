import { createContext, useEffect, useState, type ReactNode } from "react";

export interface FontContextType {
  isCustomFont: boolean;
  toggleFont: () => void;
}

export const FontContext = createContext<FontContextType>({
  isCustomFont: false,
  toggleFont: () => {},
});

export function FontProvider({ children }: { children: ReactNode }) {
  const [isCustomFont, setIsCustomFont] = useState(() => {
    return localStorage.getItem("font") === "custom";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-font", isCustomFont ? "custom" : "default");
    localStorage.setItem("font", isCustomFont ? "custom" : "default");
  }, [isCustomFont]);

  const toggleFont = () => setIsCustomFont((prev) => !prev);

  return (
    <FontContext.Provider value={{ isCustomFont, toggleFont }}>
      {children}
    </FontContext.Provider>
  );
}
