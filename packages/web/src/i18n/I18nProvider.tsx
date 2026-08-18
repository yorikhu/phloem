/**
 * I18nProvider — React binding for the i18n core.
 *
 * Holds committed locale state (persisted on setLocale) plus an
 * optional preview overlay used by the settings draft. Effective
 * locale = preview ?? committed; clearing the preview restores the
 * committed choice without re-detection.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { DictKey, Locale } from './dictionaries.js';
import { detectLocale, localeToHtmlLang, persistLocale, translate } from './core.js';

type I18nContextValue = {
  /** Effective locale (preview ?? committed). */
  locale: Locale;
  /** Committed locale — what would survive a reload. */
  savedLocale: Locale;
  /** Commit a locale choice and persist it. Clears any preview. */
  setLocale: (locale: Locale) => void;
  /** Show a locale temporarily; null restores the committed one. */
  previewLocale: (locale: Locale | null) => void;
  t: (key: DictKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [committed, setCommitted] = useState<Locale>(() => detectLocale());
  const [preview, setPreview] = useState<Locale | null>(null);

  const locale = preview ?? committed;

  const setLocale = useCallback((next: Locale) => {
    setCommitted(next);
    setPreview(null);
    persistLocale(next);
  }, []);

  const previewLocale = useCallback((next: Locale | null) => {
    setPreview(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  const t = useCallback(
    (key: DictKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, savedLocale: committed, setLocale, previewLocale, t }),
    [locale, committed, setLocale, previewLocale, t],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
