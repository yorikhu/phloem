/**
 * Hotkeys core — combo normalization, matching, formatting.
 *
 * A combo is stored as "mod+k" form: mod = Cmd on macOS, Ctrl elsewhere.
 * Framework-free; React binding in HotkeysProvider.tsx.
 */

import { isMac } from './platform.js';

export type HotkeyAction = 'openSearch';

export interface HotkeyDef {
  action: HotkeyAction;
  /** True when the user cannot re-record this combo. */
  locked?: boolean;
}

/** Canonical, serializable combo representation. */
export type Combo = string; // e.g. "mod+k", "mod+shift+p"

export const DEFAULT_HOTKEYS: Record<HotkeyAction, Combo> = {
  openSearch: 'mod+k',
};

export const HOTKEY_STORAGE_KEY = 'phloem.hotkeys';

export function isHotkeyAction(v: unknown): v is HotkeyAction {
  return v === 'openSearch';
}

/** Normalize a key label: letters lowercase, digits kept. */
function normKey(key: string): string | null {
  if (key.length === 1 && /[a-z0-9]/i.test(key)) return key.toLowerCase();
  // Arrow keys / F-keys etc. could be added here when needed
  return null;
}

/**
 * Build a combo from a keyboard event. Returns null when the event
 * does not form a valid combo (e.g. bare modifier press).
 */
export function comboFromEvent(e: KeyboardEvent): Combo | null {
  const key = normKey(e.key);
  if (!key) return null;
  if (!(e.metaKey || e.ctrlKey)) return null; // require mod for now
  const parts: string[] = [];
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  parts.push('mod', key);
  return parts.join('+');
}

/** True when a keyboard event matches a combo. */
export function matchesCombo(e: KeyboardEvent, combo: Combo): boolean {
  const parts = combo.split('+');
  const key = parts[parts.length - 1];
  const needMod = parts.includes('mod');
  const needShift = parts.includes('shift');
  const needAlt = parts.includes('alt');
  const mod = e.metaKey || e.ctrlKey;
  if (mod !== needMod) return false;
  if (e.shiftKey !== needShift) return false;
  if (e.altKey !== needAlt) return false;
  return e.key.toLowerCase() === key;
}

/** Human-readable combo: ⌘K / Ctrl+Shift+K etc. */
export function formatCombo(combo: Combo): string {
  const parts = combo.split('+');
  const key = parts.pop()!;
  const label = key === 'arrowup' ? '↑' : key === 'arrowdown' ? '↓' : key.toUpperCase();
  const bits: string[] = [];
  for (const p of parts) {
    if (p === 'mod') bits.push(isMac ? '⌘' : 'Ctrl');
    else if (p === 'shift') bits.push(isMac ? '⇧' : 'Shift');
    else if (p === 'alt') bits.push(isMac ? '⌥' : 'Alt');
  }
  // ⌘K glued; textual modifiers joined with +
  if (isMac) {
    return `${bits.join('')}${label}`;
  }
  return [...bits, label].join('+');
}

/** Parse persisted hotkey map with validation. */
export function parseStoredHotkeys(raw: string | null): Record<HotkeyAction, Combo> {
  const result = { ...DEFAULT_HOTKEYS };
  if (!raw) return result;
  try {
    const obj = JSON.parse(raw) as Record<string, string>;
    for (const [action, combo] of Object.entries(obj)) {
      if (isHotkeyAction(action) && typeof combo === 'string' && combo.includes('+')) {
        result[action] = combo;
      }
    }
  } catch {
    // corrupted storage → defaults
  }
  return result;
}
