"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const THEMES = ["dark", "light", "scrub-green"] as const;
type Theme = (typeof THEMES)[number];

const ThemeContext = createContext<{
  theme: Theme;
  cycleTheme: () => void;
}>({ theme: "dark", cycleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sassh-theme") as Theme | null;
    if (stored && THEMES.includes(stored)) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
    setMounted(true);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev);
      const next = THEMES[(idx + 1) % THEMES.length];
      localStorage.setItem("sassh-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
