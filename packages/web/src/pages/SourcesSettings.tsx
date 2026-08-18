/**
 * SourcesSettings — external data source connections (F8.2)
 * Route: /settings/sources
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
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { DataSourceConnection, SourceStatus, SourceType } from '@phloem/shared';

const { Text } = Typography;

const TYPE_LABELS: Record<SourceType, string> = {
  s3: 'S3',
  webdav: 'WebDAV',
  notion: 'Notion',
  github: 'GitHub',
  rss: 'RSS',
};

const STATUS_COLORS: Record<SourceStatus, string> = {
  connected: 'var(--ph-success)',
  error: 'var(--ph-error)',
  disabled: 'var(--ph-text-tertiary)',
};

const STATUS_TEXT: Record<SourceStatus, string> = {
  connected: 'Connected',
  error: 'Error',
  disabled: 'Disabled',
};

export default function SourcesSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form] = Form.useForm<{
    name?: string;
    type?: SourceType;
    endpoint?: string;
    authType?: 'none' | 'token' | 'basic';
    credential?: string;
  }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.sources.list(),
  });

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.sources.create>[0]) => api.sources.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
      message.success(t('settings.sources.add') + ' ✓');
      setModalOpen(false);
      form.resetFields();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.sources.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.sources.test(id),
    onSuccess: (result) => {
      setTestingId(null);
      if (result.ok) {
        message.success(t('settings.sources.testSuccess', { ms: String(result.latencyMs ?? 0) }));
      } else {
        message.error(t('settings.sources.testFail', { error: result.error ?? 'Unknown' }));
      }
    },
    onError: (err: Error) => {
      setTestingId(null);
      message.error(t('settings.sources.testFail', { error: err.message }));
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.sources.sync(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
      message.success(t('settings.sources.syncSuccess'));
    },
    onError: (err: Error) => message.error(err.message),
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 940 }}>
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
            {t('settings.sources.title')}
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('settings.sources.subtitle')}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('settings.sources.add')}
        </Button>
      </div>

      <Table<DataSourceConnection>
        dataSource={sources ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        columns={[
          {
            title: t('settings.sources.colSource'),
            dataIndex: 'name',
            key: 'source',
            render: (name: string, s: DataSourceConnection) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                  <Tag style={{ fontSize: 11 }}>{TYPE_LABELS[s.type]}</Tag>
                </div>
                <Text
                  style={{
                    fontSize: 12,
                    color: 'var(--ph-text-tertiary)',
                    fontFamily: 'var(--ph-font-mono)',
                  }}
                  ellipsis={{ tooltip: s.endpoint }}
                >
                  {s.endpoint}
                </Text>
              </div>
            ),
          },
          {
            title: t('settings.sources.colStatus'),
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: SourceStatus) => (
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
                  {STATUS_TEXT[status]}
                </Text>
              </span>
            ),
          },
          {
            title: t('settings.sources.colDocs'),
            dataIndex: 'documentCount',
            key: 'documentCount',
            width: 90,
            render: (v: number) => (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--ph-font-mono)',
                  color: 'var(--ph-text-secondary)',
                }}
              >
                {v}
              </Text>
            ),
          },
          {
            title: t('settings.sources.colSync'),
            dataIndex: 'lastSyncAt',
            key: 'lastSyncAt',
            width: 130,
            render: (v?: string) => (
              <Text
                style={{
                  fontSize: 12,
                  color: 'var(--ph-text-tertiary)',
                  fontFamily: 'var(--ph-font-mono)',
                }}
              >
                {v ? v.slice(0, 16).replace('T', ' ') : t('settings.sources.never')}
              </Text>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 190,
            render: (_: unknown, s: DataSourceConnection) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <Button
                  size="small"
                  type="text"
                  loading={testingId === s.id}
                  onClick={() => {
                    setTestingId(s.id);
                    testMutation.mutate(s.id);
                  }}
                >
                  {t('settings.sources.test')}
                </Button>
                <Button
                  size="small"
                  type="text"
                  icon={<SyncOutlined />}
                  loading={syncMutation.isPending && syncMutation.variables === s.id}
                  onClick={() => syncMutation.mutate(s.id)}
                >
                  {t('settings.sources.sync')}
                </Button>
                <Popconfirm
                  title={t('settings.sources.confirmRemove', { name: s.name })}
                  onConfirm={() => deleteMutation.mutate(s.id)}
                  okText={t('common.delete')}
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />

      {/* Add modal */}
      <Modal
        title={t('settings.sources.add')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            createMutation.mutate({
              name: values.name ?? '',
              type: values.type ?? 'webdav',
              endpoint: values.endpoint ?? '',
              ...(values.authType !== undefined ? { authType: values.authType } : {}),
              ...(values.credential !== undefined ? { credential: values.credential } : {}),
            })
          }
          initialValues={{ type: 'webdav', authType: 'none' }}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label={t('settings.sources.sourceName')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input placeholder="例如：产品文档桶" />
          </Form.Item>
          <Form.Item name="type" label={t('settings.sources.colType')}>
            <Select
              options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item
            name="endpoint"
            label={t('settings.sources.endpoint')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input placeholder="s3://bucket/prefix 或 https://..." />
          </Form.Item>
          <Form.Item name="authType" label={t('settings.sources.authType')}>
            <Select
              options={[
                { value: 'none', label: 'None' },
                { value: 'token', label: 'Token' },
                { value: 'basic', label: 'Basic Auth' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.authType !== cur.authType}>
            {({ getFieldValue }) =>
              getFieldValue('authType') !== 'none' ? (
                <Form.Item name="credential" label={t('settings.sources.credential')}>
                  <Input.Password placeholder="Access Key / Token / 密码" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {t('common.save')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
