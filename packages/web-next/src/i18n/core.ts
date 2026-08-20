/**
 * i18n core — locale state, persistence, dictionary lookup, ICU-lite
 * placeholder interpolation ({count}, {query}, ...).
 *
 * React binding lives in I18nProvider.tsx; this module stays
 * framework-free so it can be unit-tested and used outside React.
 */

import { dictionaries, type Dict, type DictKey, type Locale } from './dictionaries.js';

export const LOCALE_STORAGE_KEY = 'phloem.locale';

/** Persisted-preference → navigator → en, in order. */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved === 'en' || saved === 'zh') return saved;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

/** Replace {placeholders} in a template string. */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * ICU-lite plural: `{count, plural, =1 {dataset} other {datasets}}`.
 * Only `=1` and `other` forms — enough for this app, no ICU dependency.
 */
function plural(value: string, count: number): string {
  const m = value.match(/\{count,\s*plural,\s*=1\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/);
  if (!m || !m[1] || !m[2]) return value;
  const [, one, other] = m;
  return count === 1 ? one : other;
}

export function translate(
  locale: Locale,
  key: DictKey,
  params?: Record<string, string | number>,
): string {
  const dict: Dict = dictionaries[locale];
  let value: string = dict[key] ?? dictionaries.en[key] ?? key;
  if (params && 'count' in params && value.includes('plural')) {
    value = plural(value, Number(params.count));
  }
  return interpolate(value, params);
}

/** For <html lang>. */
export function localeToHtmlLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en';
}
