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

export type SettingsSnapshot = {
  locale: Locale;
  hotkeys: Record<HotkeyAction, Combo>;
};

const DRAFT_KEY = 'phloem.settings.draft';

export function loadDraft(): SettingsSnapshot | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettingsSnapshot>;
    if (!parsed.locale || !parsed.hotkeys) return null;
    return parsed as SettingsSnapshot;
  } catch {
    return null;
  }
}

export function saveDraft(draft: SettingsSnapshot): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
