/**
 * ThemeProvider — theme mode state, persistence, DOM attribute.
 *
 * Committed mode only (mirrors I18nProvider's single-layer design):
 * data-theme on <html> + localStorage phloem.theme. The settings
 * draft previews theme inside the modal; nothing applies globally
 * before Save.
 *
 * index.html runs a tiny inline script that sets data-theme before
 * first paint to avoid a flash of the wrong theme.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeMode } from './tokens.js';

const THEME_STORAGE_KEY = 'phloem.theme';

type ThemeContextValue = {
  /** Committed theme mode. */
  theme: ThemeMode;
  /** Commit a mode and persist it. */
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function detectTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return 'dark';
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const mode = detectTheme();
    applyTheme(mode);
    return mode;
  });

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
