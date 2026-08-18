/**
 * HotkeysProvider — React binding for the hotkeys core.
 *
 * Holds the action→combo map, persists re-records, exposes a global
 * keydown listener that dispatches registered handlers.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  HOTKEY_STORAGE_KEY,
  DEFAULT_HOTKEYS,
  matchesCombo,
  parseStoredHotkeys,
  type Combo,
  type HotkeyAction,
} from './core.js';

export interface HotkeysContextValue {
  /** Current action → combo map (live, includes unsaved recordings). */
  hotkeys: Record<HotkeyAction, Combo>;
  /** Register a handler; returns an unregister fn. */
  useHandler: (action: HotkeyAction, handler: () => void) => void;
  /** Persist a new combo for an action. Returns false on conflict. */
  setCombo: (action: HotkeyAction, combo: Combo) => boolean;
  /** Detect conflicts: returns the action currently owning the combo. */
  findConflict: (combo: Combo, exclude: HotkeyAction) => HotkeyAction | null;
  /** Reset all combos to defaults. */
  reset: () => void;
}

const HotkeysContext = createContext<HotkeysContextValue | null>(null);

type Handler = () => void;

export function HotkeysProvider({ children }: { children: React.ReactNode }) {
  const [hotkeys, setHotkeys] = useState(() =>
    parseStoredHotkeys(localStorage.getItem(HOTKEY_STORAGE_KEY)),
  );
  const handlersRef = useRef(new Map<HotkeyAction, Set<Handler>>());

  const register = useCallback((action: HotkeyAction, handler: Handler) => {
    let set = handlersRef.current.get(action);
    if (!set) {
      set = new Set();
      handlersRef.current.set(action, set);
    }
    set.add(handler);
    return () => set.delete(handler);
  }, []);

  // Global dispatch
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const [action, combo] of Object.entries(hotkeys) as [HotkeyAction, Combo][]) {
        if (matchesCombo(e, combo)) {
          const handlers = handlersRef.current.get(action);
          if (handlers && handlers.size > 0) {
            e.preventDefault();
            handlers.forEach((h) => h());
            return;
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkeys]);

  const findConflict = useCallback(
    (combo: Combo, exclude: HotkeyAction): HotkeyAction | null => {
      for (const [action, c] of Object.entries(hotkeys) as [HotkeyAction, Combo][]) {
        if (action !== exclude && c === combo) return action;
      }
      return null;
    },
    [hotkeys],
  );

  const setCombo = useCallback(
    (action: HotkeyAction, combo: Combo): boolean => {
      if (findConflict(combo, action)) return false;
      setHotkeys((prev) => {
        const next = { ...prev, [action]: combo };
        localStorage.setItem(HOTKEY_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return true;
    },
    [findConflict],
  );

  const reset = useCallback(() => {
    setHotkeys({ ...DEFAULT_HOTKEYS });
    localStorage.removeItem(HOTKEY_STORAGE_KEY);
  }, []);

  const value = useMemo<HotkeysContextValue>(
    () => ({ hotkeys, useHandler: register, setCombo, findConflict, reset }),
    [hotkeys, register, setCombo, findConflict, reset],
  );

  return <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>;
}

/**
 * Subscribe a handler to a hotkey action. Must be called inside
 * HotkeysProvider; the handler ref stays fresh across renders.
 */
export function useHotkey(action: HotkeyAction, handler: () => void): void {
  const ctx = useContext(HotkeysContext);
  if (!ctx) throw new Error('useHotkey must be used within HotkeysProvider');
  const { useHandler } = ctx;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const wrapped = () => handlerRef.current();
    return useHandler(action, wrapped);
  }, [action, useHandler]);
}

export function useHotkeys(): HotkeysContextValue {
  const ctx = useContext(HotkeysContext);
  if (!ctx) throw new Error('useHotkeys must be used within HotkeysProvider');
  return ctx;
}
