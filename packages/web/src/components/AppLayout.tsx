/**
 * App layout — sidebar + content area + global layers.
 *
 * Owns the command palette and settings modal state; the ⌘K binding
 * goes through the hotkeys module so users can re-record it.
 */

import { useState } from 'react';
import { Layout } from 'antd';
import AppSider from './AppSider';
import CommandPalette from './CommandPalette';
import SettingsModal from './SettingsModal';
import { useHotkey } from '../hotkeys/index.js';

const { Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useHotkey('openSearch', () => setSearchOpen((v) => !v));

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--ph-bg-base)' }}>
      <AppSider
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Layout style={{ background: 'var(--ph-bg-base)' }}>
        <Content
          style={{
            padding: '48px 48px',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Layout>
  );
}
