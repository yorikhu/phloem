/**
 * App sidebar — logo, primary nav, footer links.
 *
 * Extracted from AppLayout for independent maintenance.
 * Self-contained: navigation, active-state, collapse state.
 */

import { useState } from 'react';
import { Menu, Tooltip } from 'antd';
import { Layout } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  SearchOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import PixelSprout from './PixelSprout';

const { Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DatabaseOutlined />, label: 'Datasets' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documents' },
  { key: '/retrieval', icon: <SearchOutlined />, label: 'Retrieval' },
];

export default function AppSider() {
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
        <PixelSprout size={24} />
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
  );
}
