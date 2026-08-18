/** Platform helpers — cached on load, SSR-safe. */

export const isMac: boolean =
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
