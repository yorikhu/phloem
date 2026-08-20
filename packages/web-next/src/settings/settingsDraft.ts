/**
 * Settings draft — persist unsaved settings edits as a snapshot.
 *
 * The settings modal edits a draft instead of applying changes
 * immediately. The draft survives accidental closes (Esc, mask click)
 * and page reloads; it is cleared only on Save (applied) or explicit
 * Cancel (discarded).
 */

import type { Locale } from '../i18n/index.js';
import type { Combo, HotkeyAction } from '../hotkeys/index.js';
import type { ThemeMode } from '../theme/index.js';

export type SettingsSnapshot = {
  locale: Locale;
  theme: ThemeMode;
  hotkeys: Record<HotkeyAction, Combo>;
};

const DRAFT_KEY = 'phloem.settings.draft';

export function loadDraft(fallbackTheme: ThemeMode): SettingsSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettingsSnapshot>;
    if (!parsed.locale || !parsed.hotkeys) return null;
    // Drafts saved before the theme field existed inherit the
    // committed theme.
    const theme: ThemeMode =
      parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : fallbackTheme;
    return { locale: parsed.locale, theme, hotkeys: parsed.hotkeys };
  } catch {
    return null;
  }
}

export function saveDraft(draft: SettingsSnapshot): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}
