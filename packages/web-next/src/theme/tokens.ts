/**
 * Design tokens for Phloem's minimal theme system.
 *
 * Two palettes (dark default, light) share the same semantic slots.
 * Every consumer reads semantic tokens — never raw hex — through CSS
 * custom properties (global.css) or buildAntdTheme(). Typography,
 * sizing, and motion tokens are mode-independent.
 *
 * Principles: minimal, generous whitespace, restrained color,
 * monospace accents for data/metadata.
 */

export type ThemeMode = 'dark' | 'light';

/** Semantic color slots — the complete palette contract. */
export type Palette = {
  // ── Background layers ──
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  bgHover: string;

  // ── Borders ──
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;

  // ── Text ──
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // ── Accent (restrained, only for primary actions) ──
  accent: string;
  accentHover: string;
  accentLight: string;
  accentDeep: string;
  accentDim: string;

  // ── Status (muted) ──
  success: string;
  warning: string;
  error: string;

  // ── Overlays ──
  scrim: string;
  shadowPopup: string;
};

export const darkPalette: Palette = {
  bgBase: '#0d0d0d',
  bgSurface: '#161616',
  bgElevated: '#1e1e1e',
  bgHover: '#262626',

  borderSubtle: '#2a2a2a',
  borderDefault: '#333333',
  borderStrong: '#404040',

  textPrimary: '#e8e8e8',
  textSecondary: '#a0a0a0',
  textTertiary: '#666666',

  accent: '#6b8cff',
  accentHover: '#8aa3ff',
  accentLight: '#a3b8ff',
  accentDeep: '#3d5199',
  accentDim: 'rgba(107, 140, 255, 0.12)',

  success: '#5ec891',
  warning: '#e8a838',
  error: '#e85a5a',

  scrim: 'rgba(0, 0, 0, 0.6)',
  shadowPopup: '0 16px 48px rgba(0, 0, 0, 0.5)',
};

export const lightPalette: Palette = {
  bgBase: '#f7f7f8',
  bgSurface: '#ffffff',
  bgElevated: '#ffffff',
  bgHover: '#f0f0f2',

  borderSubtle: '#ebebef',
  borderDefault: '#e0e0e5',
  borderStrong: '#cfcfd6',

  textPrimary: '#1c1c22',
  textSecondary: '#55555e',
  textTertiary: '#8f8f99',

  accent: '#4c6af0',
  accentHover: '#3d5ad9',
  accentLight: '#93a7ff',
  accentDeep: '#3d5199',
  accentDim: 'rgba(76, 106, 240, 0.10)',

  success: '#2e9963',
  warning: '#c07d17',
  error: '#d64545',

  scrim: 'rgba(20, 20, 28, 0.35)',
  shadowPopup: '0 16px 48px rgba(24, 24, 32, 0.18)',
};

export function paletteFor(mode: ThemeMode): Palette {
  return mode === 'dark' ? darkPalette : lightPalette;
}

/** Mode-independent tokens. */
export const sharedTokens = {
  // ── Typography ──
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
  fontMono: '"SF Mono", "JetBrains Mono", "Fira Code", "Cascadia Code", monospace',

  // ── Sizing ──
  sidebarWidth: '220px',
  contentMaxWidth: '960px',
  radius: '6px',
  radiusSmall: '4px',

  // ── Transitions ──
  transitionFast: '120ms ease',
  transition: '200ms ease',
} as const;
