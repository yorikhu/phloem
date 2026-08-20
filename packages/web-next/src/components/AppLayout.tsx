/**
 * App layout — sidebar + content area + global layers.
 *
 * Owns the command palette and settings modal state; the ⌘K binding
 * goes through the hotkeys module so users can re-record it.
 */

import { useState } from 'react';
import { Layout } from 'antd';
import { useLocation } from '@/src/router-shim';
import AppSider from './AppSider';
import CommandPalette from './CommandPalette';
import SettingsModal from './SettingsModal';
import { useHotkey } from '../hotkeys/index.js';

const { Content } = Layout;

/** Routes that render edge-to-edge (no content padding, full height). */
function isFullBleed(pathname: string): boolean {
  return pathname.startsWith('/chat') || pathname.startsWith('/settings');
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  useHotkey('openSearch', () => setSearchOpen((v) => !v));

  const fullBleed = isFullBleed(location.pathname);

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--ph-bg-base)' }}>
      <AppSider
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Layout style={{ background: 'var(--ph-bg-base)' }}>
        <Content
          style={
            fullBleed
              ? { width: '100%', height: '100vh', overflow: 'hidden' }
              : {
                  padding: '48px 48px',
                  maxWidth: 1200,
                  width: '100%',
                  margin: '0 auto',
                }
          }
        >
          {children}
        </Content>
      </Layout>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Layout>
  );
}
