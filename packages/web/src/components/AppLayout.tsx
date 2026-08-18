/**
 * App layout — Codex-style sidebar + content area.
 *
 * Minimal sidebar with icon+text nav, no decoration.
 * Content area is centered with generous whitespace.
 */

import { useState } from 'react';
import { Layout, Menu, Tooltip } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  SearchOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DatabaseOutlined />, label: 'Datasets' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documents' },
  { key: '/retrieval', icon: <SearchOutlined />, label: 'Retrieval' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const activeKey =
    menuItems.find(
      (item) =>
        location.pathname === item.key ||
        (item.key !== '/' && location.pathname.startsWith(item.key)),
    )?.key ?? '/';

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--ph-bg-base)' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={56}
        trigger={null}
        style={{
          background: 'var(--ph-bg-base)',
          borderRight: '1px solid var(--ph-border-subtle)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: collapsed ? 16 : 20,
            gap: 8,
            borderBottom: '1px solid var(--ph-border-subtle)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: 'var(--ph-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#0d0d0d',
              flexShrink: 0,
            }}
          >
            P
          </div>
          {!collapsed && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ph-text-primary)',
                letterSpacing: '0.02em',
              }}
            >
              Phloem
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: 8,
          }}
          theme="dark"
        />

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: collapsed ? '12px 0' : '12px 20px',
            borderTop: '1px solid var(--ph-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Tooltip title="GitHub" placement="right">
            <a
              href="https://github.com/phytul/phloem"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ph-text-tertiary)', fontSize: 18 }}
            >
              <GithubOutlined />
            </a>
          </Tooltip>
          {!collapsed && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 12,
                color: 'var(--ph-text-tertiary)',
                fontFamily: 'var(--ph-font-mono)',
              }}
            >
              v0.1.0
            </span>
          )}
        </div>
      </Sider>

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
