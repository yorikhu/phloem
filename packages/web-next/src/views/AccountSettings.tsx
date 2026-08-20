/**
 * AccountSettings — profile editing (F5.5)
 * Route: /settings/account
 */
import { useState } from 'react';
import { Form, Input, Button, Avatar, Typography, message, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { CurrentUser } from '@phloem/shared';

const { Title, Text } = Typography;

const ROLE_LABEL: Record<string, { text: string; color: string }> = {
  owner: { text: '所有者', color: 'gold' },
  admin: { text: '管理员', color: 'purple' },
  member: { text: '成员', color: 'blue' },
  readonly: { text: '只读', color: 'default' },
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AccountSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form] = Form.useForm<{ name: string; avatarUrl: string }>();
  const [saving, setSaving] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['account'],
    queryFn: api.account.get,
  });

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.account.update>[0]) => api.account.update(body),
    onSuccess: (updated: CurrentUser) => {
      qc.setQueryData(['account'], updated);
      message.success(t('settings.account.saveSuccess'));
      setSaving(false);
    },
    onError: (err: Error) => {
      message.error(err.message);
      setSaving(false);
    },
  });

  const handleFinish = (values: { name: string; avatarUrl: string }) => {
    setSaving(true);
    updateMutation.mutate(values);
  };

  const u: CurrentUser | undefined = user;

  return (
    <div style={{ padding: '32px 40px' }}>
      <Title level={4} style={{ marginBottom: 28 }}>
        {t('settings.account.title')}
      </Title>

      {isLoading ? null : u ? (
        <>
          {/* Avatar + role summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
              padding: '20px 24px',
              background: 'var(--ph-bg-elevated)',
              borderRadius: 'var(--ph-radius)',
              border: '1px solid var(--ph-border-subtle)',
            }}
          >
            <Avatar
              size={56}
              src={u.avatarUrl}
              icon={<UserOutlined />}
              style={{ background: 'var(--ph-accent)', flexShrink: 0 }}
            >
              {initials(u.name)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{u.name}</div>
              <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>{u.email}</Text>
              {u.role && (
                <div style={{ marginTop: 6 }}>
                  <Tag color={ROLE_LABEL[u.role]?.color ?? 'default'}>
                    {ROLE_LABEL[u.role]?.text ?? u.role}
                  </Tag>
                </div>
              )}
            </div>
          </div>

          {/* Edit form */}
          <Form
            form={form}
            layout="vertical"
            initialValues={{ name: u.name, avatarUrl: u.avatarUrl ?? '' }}
            onFinish={handleFinish}
          >
            <Form.Item
              name="name"
              label={t('settings.account.name')}
              rules={[
                { required: true, message: '用户名不能为空' },
                { min: 2, message: '至少 2 个字符' },
                { max: 32, message: '最多 32 个字符' },
              ]}
            >
              <Input placeholder="输入用户名" />
            </Form.Item>

            <Form.Item
              name="avatarUrl"
              label={t('settings.account.avatar')}
              extra="填入头像图片 URL，留空使用默认首字母头像"
            >
              <Input placeholder="https://example.com/avatar.jpg" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t('common.save')}
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <Text style={{ color: 'var(--ph-text-tertiary)' }}>加载中...</Text>
      )}
    </div>
  );
}
