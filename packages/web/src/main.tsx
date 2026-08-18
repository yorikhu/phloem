import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import App from './App.js';
import { antdTheme } from './theme/antd-theme.js';
import { I18nProvider, useI18n } from './i18n/index.js';
import { HotkeysProvider } from './hotkeys/index.js';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import './theme/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** AntD locale follows the app locale. */
function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return (
    <ConfigProvider theme={antdTheme} locale={locale === 'zh' ? zhCN : enUS}>
      {children}
    </ConfigProvider>
  );
}

const isMockMode = import.meta.env.VITE_API_MODE === 'mock';

async function bootstrap() {
  // Enable MSW in mock mode
  if (isMockMode) {
    const { worker } = await import('./mocks/browser.js');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <HotkeysProvider>
            <BrowserRouter>
              <LocaleProvider>
                <App />
              </LocaleProvider>
            </BrowserRouter>
          </HotkeysProvider>
        </I18nProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

bootstrap();
