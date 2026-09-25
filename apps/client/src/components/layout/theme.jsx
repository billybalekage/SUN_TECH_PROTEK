import { useEffect, useState } from "react";
import { ThemeContext, themeOptions } from "./theme-context";

const THEME_STORAGE_KEY = "sun-tech-protek-theme";

function getStoredTheme() {
  if (typeof window === "undefined") return "system";

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return themeOptions.some((theme) => theme.value === storedTheme)
    ? storedTheme
    : "system";
}

function getResolvedTheme(theme) {
  if (theme !== "system") return theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      root.classList.toggle("dark", getResolvedTheme(theme) === "dark");
      root.style.colorScheme = getResolvedTheme(theme);
    };

    applyTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme !== "system") return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function Theme({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {children}
    </div>
  );
}
