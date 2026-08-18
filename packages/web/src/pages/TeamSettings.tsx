/**
 * TeamSettings — member management (F5.4)
 * Route: /settings/team
 */
import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Typography,
  Popconfirm,
  Avatar,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { MemberRole, MemberStatus, TeamMember } from '@phloem/shared';

const { Text } = Typography;

const ROLE_COLORS: Record<MemberRole, string> = {
  owner: 'gold',
  admin: 'purple',
  member: 'blue',
  readonly: 'default',
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: 'var(--ph-success)',
  invited: 'var(--ph-warning)',
  suspended: 'var(--ph-text-tertiary)',
};

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}

export default function TeamSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form] = Form.useForm<{ email: string; role: Exclude<MemberRole, 'owner'> }>();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.team.list(),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.team.invite>[0]) => api.team.invite(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      message.success(t('settings.team.inviteSuccess'));
      setInviteOpen(false);
      form.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: MemberRole }) =>
      api.team.updateRole(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      message.success(t('settings.team.roleUpdated'));
    },
    onError: (err: Error) => message.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.team.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const roleOptions = (['admin', 'member', 'readonly'] as const).map((r) => ({
    value: r,
    label: t(`settings.team.role.${r}`),
  }));

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px' }}
          >
            {t('settings.team.title')}
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('settings.team.subtitle')}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setInviteOpen(true)}>
          {t('settings.team.invite')}
        </Button>
      </div>

      <Table<TeamMember>
        dataSource={members ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        columns={[
          {
            title: t('settings.team.colMember'),
            dataIndex: 'name',
            key: 'member',
            render: (name: string, m: TeamMember) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar
                  size={30}
                  src={m.avatarUrl}
                  style={{ background: 'var(--ph-accent-deep)', flexShrink: 0 }}
                >
                  {initials(name)}
                </Avatar>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: '20px' }}>{name}</div>
                  <Text
                    style={{ fontSize: 12, color: 'var(--ph-text-tertiary)', lineHeight: '16px' }}
                    ellipsis
                  >
                    {m.email}
                  </Text>
                </div>
              </div>
            ),
          },
          {
            title: t('settings.team.colRole'),
            dataIndex: 'role',
            key: 'role',
            width: 160,
            render: (role: MemberRole, m: TeamMember) =>
              m.role === 'owner' ? (
                <Tag color={ROLE_COLORS[role]} style={{ fontSize: 12 }}>
                  {t('settings.team.role.owner')}
                </Tag>
              ) : (
                <Select
                  size="small"
                  variant="borderless"
                  value={role}
                  options={roleOptions}
                  onChange={(r) => roleMutation.mutate({ id: m.id, role: r })}
                  style={{ width: 120 }}
                />
              ),
          },
          {
            title: t('settings.team.colStatus'),
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: MemberStatus) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: STATUS_COLORS[status],
                  }}
                />
                <Text style={{ fontSize: 12, color: 'var(--ph-text-secondary)' }}>
                  {t(`settings.team.status.${status}`)}
                </Text>
              </span>
            ),
          },
          {
            title: t('settings.team.colJoined'),
            dataIndex: 'joinedAt',
            key: 'joinedAt',
            width: 120,
            render: (v: string) => (
              <Text
                style={{
                  fontSize: 12,
                  color: 'var(--ph-text-tertiary)',
                  fontFamily: 'var(--ph-font-mono)',
                }}
              >
                {v.slice(0, 10)}
              </Text>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 56,
            render: (_: unknown, m: TeamMember) =>
              m.role === 'owner' ? null : (
                <Popconfirm
                  title={t('settings.team.confirmRemove', { name: m.name })}
                  onConfirm={() => removeMutation.mutate(m.id)}
                  okText={t('common.delete')}
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
          },
        ]}
      />

      {/* Invite modal */}
      <Modal
        title={t('settings.team.invite')}
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        width={440}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => inviteMutation.mutate(values)}
          initialValues={{ role: 'member' }}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="email"
            label={t('settings.team.email')}
            rules={[
              { required: true, message: '必填' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="teammate@example.com" />
          </Form.Item>
          <Form.Item name="role" label={t('settings.team.colRole')}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setInviteOpen(false)}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={inviteMutation.isPending}>
                {t('settings.team.invite')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
