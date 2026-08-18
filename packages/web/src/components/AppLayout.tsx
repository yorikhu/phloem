/**
 * App layout — sidebar + content area + global search layer.
 *
 * Layout owns the CommandPalette state: sidebar triggers open,
 * ⌘K / Ctrl+K toggles from anywhere.
 */

import { useEffect, useState } from 'react';
import { Layout } from 'antd';
import AppSider from './AppSider';
import CommandPalette from './CommandPalette';

const { Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--ph-bg-base)' }}>
      <AppSider onOpenSearch={() => setSearchOpen(true)} />

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
    </Layout>
  );
}
