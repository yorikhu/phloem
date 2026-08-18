/**
 * Theme module — dual-palette tokens, CSS variable theming, AntD
 * theme config, React provider.
 *
 * - tokens.ts: dark/light palettes + shared tokens + ThemeMode
 * - global.css: --ph-* variables keyed by [data-theme]
 * - antd-theme.ts: buildAntdTheme(mode) for ConfigProvider
 * - ThemeProvider.tsx: committed mode state + persistence
 */

export {
  darkPalette,
  lightPalette,
  paletteFor,
  sharedTokens,
  type Palette,
  type ThemeMode,
} from './tokens.js';
export { antdTheme, buildAntdTheme } from './antd-theme.js';
export { ThemeProvider, useTheme } from './ThemeProvider.jsx';
