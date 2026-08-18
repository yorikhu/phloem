/**
 * Design tokens for Phloem's minimal dark theme.
 *
 * Principles: dark, minimal, generous whitespace, restrained color,
 * monospace accents for data/metadata.
 *
 * All colors as CSS custom properties for easy theming / white-label override.
 */

export const tokens = {
  // ── Background layers (darkest → lightest) ──
  bgBase: '#0d0d0d',
  bgSurface: '#161616',
  bgElevated: '#1e1e1e',
  bgHover: '#262626',

  // ── Borders ──
  borderSubtle: '#2a2a2a',
  borderDefault: '#333333',
  borderStrong: '#404040',

  // ── Text ──
  textPrimary: '#e8e8e8',
  textSecondary: '#a0a0a0',
  textTertiary: '#666666',

  // ── Accent (restrained, only for primary actions) ──
  accent: '#6b8cff',
  accentHover: '#8aa3ff',
  accentDim: 'rgba(107, 140, 255, 0.12)',

  // ── Status (muted) ──
  success: '#5ec891',
  warning: '#e8a838',
  error: '#e85a5a',

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

export type ThemeTokens = typeof tokens;
