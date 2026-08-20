/**
 * SettingsLayout — settings center shell.
 *
 * Left nav lists every settings page; the active entry follows
 * the route and content renders via <Outlet />.
 */
import {
  UserOutlined,
  CloudServerOutlined,
  TeamOutlined,
  DatabaseOutlined,
  MessageOutlined,
  ApiOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from '@/src/router-shim';
import { useI18n } from '../i18n/index.js';

export default function SettingsLayout({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/settings/account', icon: <UserOutlined />, label: t('settings.nav.account') },
    { key: '/settings/models', icon: <CloudServerOutlined />, label: t('settings.nav.models') },
    { key: '/settings/team', icon: <TeamOutlined />, label: t('settings.nav.team') },
    { key: '/settings/sources', icon: <DatabaseOutlined />, label: t('settings.nav.sources') },
    { key: '/settings/channels', icon: <MessageOutlined />, label: t('settings.nav.channels') },
    { key: '/settings/mcp', icon: <ApiOutlined />, label: t('settings.nav.mcp') },
    { key: '/settings/apikeys', icon: <KeyOutlined />, label: t('settings.nav.apikeys') },
  ];

  const activeKey =
    items.find(
      (item) => location.pathname === item.key || location.pathname.startsWith(item.key + '/'),
    )?.key ?? '/settings/account';

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left nav */}
      <div
        style={{
          width: 208,
          flexShrink: 0,
          borderRight: '1px solid var(--ph-border-subtle)',
          background: 'var(--ph-bg-base)',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ph-text-tertiary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '0 12px 12px',
          }}
        >
          {t('settings.nav.title')}
        </div>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.key)}
              className="ph-settings-nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--ph-radius-lg)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                background: active ? 'var(--ph-accent-dim)' : 'transparent',
                color: active ? 'var(--ph-accent)' : 'var(--ph-text-secondary)',
                fontWeight: active ? 500 : 400,
                transition: 'all var(--ph-transition-fast)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--ph-bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 15, display: 'inline-flex' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          background: 'var(--ph-bg-base)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
