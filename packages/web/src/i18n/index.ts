/**
 * i18n module — lightweight, type-safe, zero-dependency.
 *
 * - dictionaries.ts: zh/en flat dictionaries, compile-time key checks
 * - core.ts: locale detection, persistence, interpolation, plural
 * - I18nProvider.tsx: React context + useI18n hook
 *
 * Usage: const { t, locale, setLocale } = useI18n();
 */

export { dictionaries, locales, type Dict, type DictKey, type Locale } from './dictionaries.js';
export {
  LOCALE_STORAGE_KEY,
  detectLocale,
  interpolate,
  localeToHtmlLang,
  persistLocale,
  translate,
} from './core.js';
export { I18nProvider, useI18n } from './I18nProvider.jsx';
