/**
 * McpSettings — MCP server management (F4.4)
 * Route: /settings/mcp
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
  Switch,
  Typography,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ApiOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { McpServer, McpStatus, McpTransport } from '@phloem/shared';

const { Text } = Typography;

const TRANSPORT_LABELS: Record<McpTransport, string> = {
  sse: 'SSE',
  streamable_http: 'Streamable HTTP',
  stdio: 'STDIO',
};

const STATUS_COLORS: Record<McpStatus, string> = {
  connected: 'var(--ph-success)',
  disconnected: 'var(--ph-text-tertiary)',
  error: 'var(--ph-error)',
};

interface EditingServer {
  id?: string;
  name?: string;
  transport?: McpTransport;
  url?: string;
}

export default function McpSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form] = Form.useForm<EditingServer>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingServer | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: servers, isLoading } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: () => api.mcp.list(),
  });

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.mcp.create>[0]) => api.mcp.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-servers'] });
      message.success(t('settings.mcp.add') + ' ✓');
      setModalOpen(false);
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.mcp.update>[1] }) =>
      api.mcp.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.mcp.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.mcp.test(id),
    onSuccess: (result) => {
      setTestingId(null);
      if (result.ok) {
        message.success(
          t('settings.mcp.testSuccess', {
            count: String(result.toolCount ?? 0),
            ms: String(result.latencyMs ?? 0),
          }),
        );
      } else {
        message.error(t('settings.mcp.testFail', { error: result.error ?? 'Unknown' }));
      }
    },
    onError: (err: Error) => {
      setTestingId(null);
      message.error(t('settings.mcp.testFail', { error: err.message }));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.mcp.update(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (s: McpServer) => {
    setEditing(s);
    form.setFieldsValue({ name: s.name, transport: s.transport, url: s.url });
    setModalOpen(true);
  };

  const handleFinish = (values: EditingServer) => {
    if (editing?.id) {
      const body: Parameters<typeof api.mcp.update>[1] = {};
      if (values.name !== undefined) body.name = values.name;
      if (values.url !== undefined) body.url = values.url;
      updateMutation.mutate({ id: editing.id, body });
      setModalOpen(false);
    } else {
      createMutation.mutate({
        name: values.name ?? '',
        transport: values.transport ?? 'streamable_http',
        url: values.url ?? '',
      });
    }
  };

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
            {t('settings.mcp.title')}
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('settings.mcp.subtitle')}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {t('settings.mcp.add')}
        </Button>
      </div>

      <Table<McpServer>
        dataSource={servers ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        columns={[
          {
            title: t('settings.mcp.colServer'),
            dataIndex: 'name',
            key: 'server',
            render: (name: string, s: McpServer) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ApiOutlined style={{ color: 'var(--ph-accent)', fontSize: 14 }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                </div>
                <Text
                  style={{
                    fontSize: 12,
                    color: 'var(--ph-text-tertiary)',
                    fontFamily: 'var(--ph-font-mono)',
                  }}
                  ellipsis={{ tooltip: s.url }}
                >
                  {s.url}
                </Text>
              </div>
            ),
          },
          {
            title: t('settings.mcp.colTransport'),
            dataIndex: 'transport',
            key: 'transport',
            width: 150,
            render: (v: McpTransport) => <Tag style={{ fontSize: 12 }}>{TRANSPORT_LABELS[v]}</Tag>,
          },
          {
            title: t('settings.mcp.colStatus'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: McpStatus, s: McpServer) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: s.enabled ? STATUS_COLORS[status] : 'var(--ph-text-tertiary)',
                  }}
                />
                <Text style={{ fontSize: 12, color: 'var(--ph-text-secondary)' }}>
                  {s.enabled
                    ? status === 'connected'
                      ? 'Connected'
                      : status === 'error'
                        ? 'Error'
                        : 'Disconnected'
                    : 'Disabled'}
                </Text>
              </span>
            ),
          },
          {
            title: t('settings.mcp.colTools'),
            dataIndex: 'toolCount',
            key: 'toolCount',
            width: 80,
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
            title: '',
            key: 'enabled',
            width: 64,
            render: (_: unknown, s: McpServer) => (
              <Switch
                size="small"
                checked={s.enabled}
                onChange={(checked) => toggleMutation.mutate({ id: s.id, enabled: checked })}
              />
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 150,
            render: (_: unknown, s: McpServer) => (
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
                  {t('settings.mcp.test')}
                </Button>
                <Button size="small" type="text" onClick={() => openEdit(s)}>
                  {t('common.edit')}
                </Button>
                <Popconfirm
                  title={t('settings.mcp.confirmRemove', { name: s.name })}
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

      {/* Add/Edit modal */}
      <Modal
        title={editing?.id ? t('common.edit') : t('settings.mcp.add')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ transport: 'streamable_http' }}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label={t('settings.mcp.serverName')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input placeholder="例如：web-search" />
          </Form.Item>
          <Form.Item name="transport" label={t('settings.mcp.colTransport')}>
            <Select
              options={Object.entries(TRANSPORT_LABELS).map(([value, label]) => ({ value, label }))}
              disabled={!!editing?.id}
            />
          </Form.Item>
          <Form.Item
            name="url"
            label={t('settings.mcp.serverUrl')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input placeholder="http://localhost:9380/mcp" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {t('common.save')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
