/**
 * Root layout — provider stack ported from main.tsx:
 * QueryClient → Theme → I18n → Hotkeys → AntD ConfigProvider.
 */

'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { buildAntdTheme } from '@/src/theme/antd-theme.js';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider.js';
import { I18nProvider, useI18n } from '@/src/i18n/index.js';
import { HotkeysProvider } from '@/src/hotkeys/index.js';
import AppLayout from '@/src/components/AppLayout.js';
import '@/src/theme/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** AntD locale + theme follow app settings. */
function LocaleThemeProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const { theme } = useTheme();
  return (
    <ConfigProvider theme={buildAntdTheme(theme)} locale={locale === 'zh' ? zhCN : enUS}>
      {children}
    </ConfigProvider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18nProvider>
              <HotkeysProvider>
                <LocaleThemeProvider>
                  <AppLayout>{children}</AppLayout>
                </LocaleThemeProvider>
              </HotkeysProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
