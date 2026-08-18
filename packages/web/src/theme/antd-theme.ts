/**
 * AntD 5 theme configuration — mapped to Phloem design tokens.
 */

import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: '#6b8cff',
    colorBgBase: '#0d0d0d',
    colorBgContainer: '#161616',
    colorBgElevated: '#1e1e1e',
    colorBgLayout: '#0d0d0d',
    colorText: '#e8e8e8',
    colorTextSecondary: '#a0a0a0',
    colorTextTertiary: '#666666',
    colorTextQuaternary: '#555555',
    colorBorder: '#333333',
    colorBorderSecondary: '#2a2a2a',
    colorBgTextHover: '#262626',
    colorBgTextActive: '#333333',

    // Status
    colorSuccess: '#5ec891',
    colorWarning: '#e8a838',
    colorError: '#e85a5a',

    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
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
      siderBg: '#0d0d0d',
      headerBg: '#161616',
      bodyBg: '#0d0d0d',
      triggerBg: '#1e1e1e',
    },
    Menu: {
      darkItemBg: '#0d0d0d',
      darkSubMenuItemBg: '#0d0d0d',
      darkItemSelectedBg: 'rgba(107, 140, 255, 0.12)',
      darkItemHoverBg: '#262626',
      darkItemColor: '#a0a0a0',
      darkItemSelectedColor: '#e8e8e8',
      itemBorderRadius: 6,
      itemMarginInline: 8,
    },
    Table: {
      headerBg: '#161616',
      headerColor: '#a0a0a0',
      rowHoverBg: '#1e1e1e',
      borderColor: '#2a2a2a',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Card: {
      colorBgContainer: '#161616',
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
      colorBgContainer: '#1e1e1e',
      activeBorderColor: '#6b8cff',
      hoverBorderColor: '#404040',
    },
    Modal: {
      contentBg: '#161616',
      headerBg: '#161616',
      titleColor: '#e8e8e8',
    },
    Tag: {
      defaultBg: '#1e1e1e',
      defaultColor: '#a0a0a0',
    },
    Tooltip: {
      colorBgSpotlight: '#333333',
      colorTextLightSolid: '#e8e8e8',
    },
    Spin: {
      colorPrimary: '#6b8cff',
    },
    Empty: {
      colorText: '#666666',
      colorTextDisabled: '#555555',
    },
    Progress: {
      defaultColor: '#6b8cff',
    },
    Upload: {
      colorBgContainer: '#161616',
    },
    Divider: {
      colorSplit: '#2a2a2a',
    },
    Pagination: {
      itemBg: 'transparent',
      itemActiveBg: 'rgba(107, 140, 255, 0.12)',
    },
    Tabs: {
      cardBg: 'transparent',
      itemColor: '#a0a0a0',
      itemSelectedColor: '#e8e8e8',
      inkBarColor: '#6b8cff',
    },
  },
};
