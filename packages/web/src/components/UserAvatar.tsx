/**
 * UserAvatar — single source of truth for the user avatar.
 *
 * Renders initials on a gradient deep-accent background; used both in
 * the sidebar footer and the account dropdown so they always match.
 * Falls back to a person icon when the name is unavailable.
 */

import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { CurrentUser } from '@phloem/shared';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0] ?? '';
  const last = parts.length === 1 ? first : (parts[parts.length - 1] ?? '');
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function UserAvatar({
  user,
  size = 26,
}: {
  user?: CurrentUser | undefined;
  size?: number;
}) {
  const text = user?.name ? initials(user.name) : '';
  return (
    <Avatar
      size={size}
      icon={!text && <UserOutlined />}
      style={{
        background: 'var(--ph-accent-deep)',
        color: 'var(--ph-accent-light)',
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {text}
    </Avatar>
  );
}
