/**
 * App sidebar — logo, icon actions, primary nav, user footer.
 *
 * Header pairs the logo with search & settings icon buttons.
 * Footer shows the signed-in account (hover = row background) and a
 * GitHub link (hover = accent color, no background) as separate
 * interactive zones.
 */

import { useState } from 'react';
import { Menu, Tooltip, Dropdown } from 'antd';
import { Layout } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  SearchOutlined,
  GithubOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PixelSprout from './PixelSprout';
import UserAvatar from './UserAvatar';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.js';
import { formatCombo, useHotkeys } from '../hotkeys/index.js';

const { Sider } = Layout;

export default function AppSider({
  onOpenSearch,
  onOpenSettings,
}: {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { hotkeys } = useHotkeys();
  const [collapsed, setCollapsed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    staleTime: 5 * 60_000,
  });

  const activeKey =
    menuItems(t).find(
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
      {/* Logo + icon actions */}
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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
              <IconButton
                icon={<SearchOutlined />}
                title={`${t('sidebar.search')} (${formatCombo(hotkeys.openSearch)})`}
                onClick={onOpenSearch}
              />
              <IconButton
                icon={<SettingOutlined />}
                title={t('common.settings')}
                onClick={onOpenSettings}
              />
            </div>
          </>
        )}
      </div>

      {/* Collapsed-state actions under the logo */}
      {collapsed && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '10px 0',
          }}
        >
          <IconButton
            icon={<SearchOutlined />}
            title={t('sidebar.search')}
            onClick={onOpenSearch}
          />
          <IconButton
            icon={<SettingOutlined />}
            title={t('common.settings')}
            onClick={onOpenSettings}
          />
        </div>
      )}

      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        onClick={({ key }) => navigate(key)}
        items={menuItems(t)}
        style={{
          background: 'transparent',
          border: 'none',
          marginTop: collapsed ? 0 : 8,
        }}
        theme="dark"
      />

      {/* Footer: account row + GitHub as separate zones */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: collapsed ? '10px 0' : '8px 12px',
          borderTop: '1px solid var(--ph-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 4,
        }}
      >
        {collapsed ? (
          <Dropdown
            trigger={['click']}
            placement="topRight"
            menu={{
              items: dropdownItems(t, user?.name, user?.email),
            }}
          >
            <div style={{ cursor: 'pointer', padding: 4, borderRadius: 6 }}>
              <UserAvatar user={user} size={26} />
            </div>
          </Dropdown>
        ) : (
          <>
            <Dropdown
              trigger={['click']}
              placement="topLeft"
              menu={{ items: dropdownItems(t, user?.name, user?.email) }}
            >
              {/* Account row — hover paints the row background */}
              <div
                className="ph-user-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 6px 4px 4px',
                  borderRadius: 'var(--ph-radius-small)',
                  cursor: 'pointer',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <UserAvatar user={user} size={26} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ph-user-name">{user?.name ?? '—'}</div>
                  <div className="ph-user-email">{user?.email ?? ''}</div>
                </div>
              </div>
            </Dropdown>
            {/* GitHub — hover tints the icon only */}
            <a
              href="https://github.com/phytul/phloem"
              target="_blank"
              rel="noopener noreferrer"
              className="ph-github-link"
              aria-label={t('sidebar.github')}
            >
              <GithubOutlined />
            </a>
          </>
        )}
      </div>
    </Sider>
  );
}

/** Small square icon button used in the sidebar header. */
function IconButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <Tooltip title={title} placement="right">
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        style={{
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--ph-text-tertiary)',
          fontSize: 15,
          transition: 'all var(--ph-transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--ph-bg-hover)';
          e.currentTarget.style.color = 'var(--ph-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--ph-text-tertiary)';
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

function menuItems(t: (key: never) => string) {
  return [
    { key: '/', icon: <DatabaseOutlined />, label: t('nav.datasets' as never) },
    { key: '/documents', icon: <FileTextOutlined />, label: t('nav.documents' as never) },
    { key: '/retrieval', icon: <SearchOutlined />, label: t('nav.retrieval' as never) },
  ];
}

function dropdownItems(t: ReturnType<typeof useI18n>['t'], name?: string, email?: string) {
  return [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--ph-text-primary)', fontWeight: 500 }}>
            {name ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ph-text-tertiary)' }}>{email ?? ''}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('user.settings'),
    },
    { key: 'logout', icon: <LogoutOutlined />, label: t('user.signOut') },
  ];
}
