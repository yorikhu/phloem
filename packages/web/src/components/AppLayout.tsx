/**
 * App layout — sidebar + content area.
 *
 * Pure layout shell: composition only, no visual details.
 * Sidebar details live in AppSider.
 */

import { Layout } from 'antd';
import AppSider from './AppSider';

const { Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--ph-bg-base)' }}>
      <AppSider />

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
    </Layout>
  );
}
