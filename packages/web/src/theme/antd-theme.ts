/**
 * AntD 5 theme configuration — derived from Phloem palettes.
 *
 * buildAntdTheme(mode) maps every color slot to paletteFor(mode);
 * the sidebar Menu stays on light-style tokens in both modes (it
 * reads --ph-* variables at runtime via its transparent background).
 */

import type { ThemeConfig } from 'antd';
import { paletteFor, sharedTokens, type ThemeMode } from './tokens.js';

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  const p = paletteFor(mode);

  return {
    token: {
      // Colors
      colorPrimary: p.accent,
      colorBgBase: p.bgBase,
      colorBgContainer: p.bgSurface,
      colorBgElevated: p.bgElevated,
      colorBgLayout: p.bgBase,
      colorText: p.textPrimary,
      colorTextSecondary: p.textSecondary,
      colorTextTertiary: p.textTertiary,
      colorTextQuaternary: p.textTertiary,
      colorBorder: p.borderDefault,
      colorBorderSecondary: p.borderSubtle,
      colorBgTextHover: p.bgHover,
      colorBgTextActive: p.borderDefault,

      // Status
      colorSuccess: p.success,
      colorWarning: p.warning,
      colorError: p.error,

      // Typography
      fontFamily: sharedTokens.fontSans,
      fontSize: 14,
      fontSizeHeading1: 24,
      fontSizeHeading2: 20,
      fontSizeHeading3: 18,
      fontSizeHeading4: 16,
      lineHeight: 1.6,

      // Shape
      borderRadius: 6,
      borderRadiusSM: 4,

      // Spacing
      controlHeight: 32,
      controlHeightLG: 40,

      // Misc
      wireframe: false,
    },
    components: {
      Layout: {
        siderBg: p.bgBase,
        headerBg: p.bgSurface,
        bodyBg: p.bgBase,
        triggerBg: p.bgElevated,
      },
      Menu: {
        itemBg: p.bgBase,
        subMenuItemBg: p.bgBase,
        itemSelectedBg: p.accentDim,
        itemHoverBg: p.bgHover,
        itemColor: p.textSecondary,
        itemSelectedColor: p.textPrimary,
        itemBorderRadius: 6,
        itemMarginInline: 8,
      },
      Dropdown: {
        controlItemBgHover: p.bgHover,
        controlItemBgActive: p.bgHover,
      },
      Table: {
        headerBg: p.bgSurface,
        headerColor: p.textSecondary,
        rowHoverBg: p.bgElevated,
        borderColor: p.borderSubtle,
        cellPaddingBlock: 12,
        cellPaddingInline: 16,
      },
      Card: {
        colorBgContainer: p.bgSurface,
        headerBg: 'transparent',
        headerFontSize: 16,
      },
      Button: {
        primaryShadow: 'none',
        defaultShadow: 'none',
        borderRadius: 6,
        controlHeight: 32,
        controlHeightLG: 40,
      },
      Input: {
        colorBgContainer: p.bgElevated,
        activeBorderColor: p.accent,
        hoverBorderColor: p.borderStrong,
      },
      Modal: {
        contentBg: p.bgSurface,
        headerBg: p.bgSurface,
        titleColor: p.textPrimary,
      },
      Tag: {
        defaultBg: p.bgElevated,
        defaultColor: p.textSecondary,
      },
      Tooltip: {
        colorBgSpotlight: p.borderStrong,
        colorTextLightSolid: p.bgBase,
      },
      Spin: {
        colorPrimary: p.accent,
      },
      Empty: {
        colorText: p.textTertiary,
        colorTextDisabled: p.textTertiary,
      },
      Progress: {
        defaultColor: p.accent,
      },
      Upload: {
        colorBgContainer: p.bgSurface,
      },
      Divider: {
        colorSplit: p.borderSubtle,
      },
      Pagination: {
        itemBg: 'transparent',
        itemActiveBg: p.accentDim,
      },
      Tabs: {
        cardBg: 'transparent',
        itemColor: p.textSecondary,
        itemSelectedColor: p.textPrimary,
        inkBarColor: p.accent,
      },
    },
  };
}

/** Back-compat export: the dark theme as a constant. */
export const antdTheme = buildAntdTheme('dark');
