// src/context/ThemeContext.tsx
import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const darkTokens = `
  --bg-base:        #0d0d1a;
  --bg-surface:     #13131f;
  --bg-elevated:    #1e1e2e;
  --bg-overlay:     #000000aa;

  --border-subtle:  #ffffff0f;
  --border-default: #ffffff14;
  --border-strong:  #ffffff22;

  --text-primary:   #e8e8f0;
  --text-secondary: #aaaabc;
  --text-muted:     #666680;
  --text-inverse:   #0d0d1a;

  --accent-blue:    #5A8FE8;
  --accent-green:   #5AB88A;
  --accent-red:     #E85A7A;
  --accent-orange:  #E8845A;
  --accent-purple:  #A85AE8;
  --accent-yellow:  #E8C45A;

  --shadow-sm:      0 1px 3px #00000040;
  --shadow-md:      0 4px 16px #00000060;
  --shadow-lg:      0 8px 32px #00000080;

  --radius-sm:      6px;
  --radius-md:      10px;
  --radius-lg:      16px;
  --radius-xl:      20px;
  --radius-full:    9999px;
`;

const lightTokens = `
  --bg-base:        #f0f2f8;
  --bg-surface:     #ffffff;
  --bg-elevated:    #f8f9fc;
  --bg-overlay:     #00000066;

  --border-subtle:  #e8eaf0;
  --border-default: #d8dce8;
  --border-strong:  #c0c4d0;

  --text-primary:   #1a1a2e;
  --text-secondary: #4a4a6a;
  --text-muted:     #8888aa;
  --text-inverse:   #ffffff;

  --accent-blue:    #3a6fd8;
  --accent-green:   #2a9870;
  --accent-red:     #d83a5a;
  --accent-orange:  #d86430;
  --accent-purple:  #8830d8;
  --accent-yellow:  #c89430;

  --shadow-sm:      0 1px 3px #0000001a;
  --shadow-md:      0 4px 16px #0000001a;
  --shadow-lg:      0 8px 32px #0000002a;

  --radius-sm:      6px;
  --radius-md:      10px;
  --radius-lg:      16px;
  --radius-xl:      20px;
  --radius-full:    9999px;
`;

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
    background: var(--bg-base);
    color: var(--text-primary);
    transition: background 0.2s, color 0.2s;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: var(--radius-full); }

  select option { background: var(--bg-elevated); color: var(--text-primary); }

  input[type="month"]::-webkit-calendar-picker-indicator,
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
    cursor: pointer;
  }

  @media (max-width: 768px) {
    html { font-size: 15px; }
  }
`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("fintrack_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("fintrack_theme", theme);

    // Injeta CSS variables no :root
    let styleEl = document.getElementById("theme-tokens");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-tokens";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root { ${theme === "dark" ? darkTokens : lightTokens} }`;

    // Injeta estilos globais uma vez
    if (!document.getElementById("global-styles")) {
      const globalEl = document.createElement("style");
      globalEl.id = "global-styles";
      globalEl.textContent = globalStyles;
      document.head.appendChild(globalEl);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}