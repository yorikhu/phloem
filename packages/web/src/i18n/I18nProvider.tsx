/**
 * I18nProvider — React binding for the i18n core.
 *
 * Single committed locale, persisted on setLocale. Language preview
 * inside the settings modal is local to that component (it renders
 * its own labels via translate()) — switching system language is a
 * save-scoped action, nothing applies globally before Save.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { DictKey, Locale } from './dictionaries.js';
import { detectLocale, localeToHtmlLang, persistLocale, translate } from './core.js';

type I18nContextValue = {
  /** Committed locale — the single source of truth app-wide. */
  locale: Locale;
  /** Commit a locale choice and persist it. */
  setLocale: (locale: Locale) => void;
  t: (key: DictKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  const t = useCallback(
    (key: DictKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
