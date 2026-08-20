/**
 * hotkeys module — user-configurable keyboard shortcuts.
 *
 * - core.ts: combo parse/match/format, storage validation
 * - HotkeysProvider.tsx: context, persistence, global dispatch
 *
 * Usage:
 *   useHotkey('openSearch', open);        // bind
 *   const { hotkeys, setCombo } = useHotkeys(); // read/config
 */

export {
  DEFAULT_HOTKEYS,
  HOTKEY_STORAGE_KEY,
  comboFromEvent,
  formatCombo,
  isHotkeyAction,
  matchesCombo,
  parseStoredHotkeys,
  type Combo,
  type HotkeyAction,
} from './core.js';
export { HotkeysProvider, useHotkey, useHotkeys } from './HotkeysProvider.jsx';
export { isMac } from './platform.js';
