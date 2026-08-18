/**
 * App sidebar — logo, search trigger, primary nav, user footer.
 *
 * Extracted from AppLayout for independent maintenance.
 * Self-contained: navigation, active-state, collapse state.
 * Footer shows the signed-in account; header pairs logo with a
 * global search trigger (⌘K).
 */

import { useState } from 'react';
import { Menu, Tooltip, Avatar, Dropdown } from 'antd';
import { Layout } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  SearchOutlined,
  GithubOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PixelSprout from './PixelSprout';
import { api } from '../api/client.js';

const { Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DatabaseOutlined />, label: 'Datasets' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documents' },
  { key: '/retrieval', icon: <SearchOutlined />, label: 'Retrieval' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export default function AppSider({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    staleTime: 5 * 60_000,
  });

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
      {/* Logo + global search */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 12px 0 20px',
          gap: 10,
          borderBottom: '1px solid var(--ph-border-subtle)',
        }}
      >
        <PixelSprout size={24} />
        {!collapsed && (
          <>
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
            {/* Search pill */}
            <button
              type="button"
              onClick={onOpenSearch}
              title="Search (⌘K)"
              aria-label="Open global search"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 26,
                padding: '0 8px',
                background: 'var(--ph-bg-surface)',
                border: '1px solid var(--ph-border-subtle)',
                borderRadius: 13,
                cursor: 'pointer',
                color: 'var(--ph-text-tertiary)',
                fontFamily: 'inherit',
                transition: 'all var(--ph-transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--ph-border-strong)';
                e.currentTarget.style.color = 'var(--ph-text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--ph-border-subtle)';
                e.currentTarget.style.color = 'var(--ph-text-tertiary)';
              }}
            >
              <SearchOutlined style={{ fontSize: 11 }} />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--ph-font-mono)',
                  lineHeight: 1,
                }}
              >
                {isMac ? '⌘K' : 'Ctrl K'}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Collapsed-state search icon replaces the pill */}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <Tooltip title="Search (⌘K)" placement="right">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Open global search"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--ph-bg-surface)',
                border: '1px solid var(--ph-border-subtle)',
                borderRadius: 16,
                cursor: 'pointer',
                color: 'var(--ph-text-tertiary)',
              }}
            >
              <SearchOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
        </div>
      )}

      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        onClick={({ key }) => navigate(key)}
        items={menuItems}
        style={{
          background: 'transparent',
          border: 'none',
          marginTop: collapsed ? 0 : 8,
        }}
        theme="dark"
      />

      {/* Footer: signed-in account */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: collapsed ? '10px 0' : '10px 12px',
          borderTop: '1px solid var(--ph-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {collapsed ? (
          <Tooltip title={user ? `${user.name} · ${user.email}` : 'Account'} placement="right">
            <Avatar
              size={26}
              icon={<UserOutlined />}
              style={{ background: 'var(--ph-accent-deep)' }}
            />
          </Tooltip>
        ) : (
          <Dropdown
            trigger={['click']}
            placement="topLeft"
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: (
                    <span>
                      <div style={{ fontSize: 13, color: 'var(--ph-text-primary)' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ph-text-tertiary)' }}>
                        {user?.email}
                      </div>
                    </span>
                  ),
                  disabled: true,
                },
                { type: 'divider' },
                { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out' },
              ],
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 6px 4px 4px',
                borderRadius: 'var(--ph-radius-small)',
                cursor: 'pointer',
                width: '100%',
                transition: 'background var(--ph-transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ph-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar
                size={26}
                icon={<UserOutlined />}
                style={{ background: 'var(--ph-accent-deep)' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--ph-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name ?? '—'}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ph-text-tertiary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email ?? ''}
                </div>
              </div>
              <a
                href="https://github.com/phytul/phloem"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--ph-text-tertiary)', fontSize: 15, lineHeight: 1 }}
                aria-label="GitHub repository"
              >
                <GithubOutlined />
              </a>
            </div>
          </Dropdown>
        )}
      </div>
    </Sider>
  );
}
