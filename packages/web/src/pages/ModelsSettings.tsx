/**
 * ModelsSettings — LLM Provider configuration (F8.1)
 *
 * Full page at /settings/models
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
  Space,
  Typography,
  Popconfirm,
  message,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { LLMProvider, ProviderType } from '@phloem/shared';

const { Text } = Typography;

const PROVIDER_TYPE_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'openai_compatible', label: 'OpenAI 兼容' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: '自定义', label: '自定义' },
];

type EditingProvider = Partial<LLMProvider> & { id?: string };

export default function ModelsSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form] = Form.useForm<EditingProvider>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingProvider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.providers.list({ pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.providers.create>[0]) => api.providers.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      message.success(t('settings.models.save') + ' ✓');
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.providers.update>[1] }) =>
      api.providers.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      message.success(t('settings.models.save') + ' ✓');
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.providers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      message.success(t('common.delete') + ' ✓');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.providers.test(id),
    onSuccess: (result, _id) => {
      setTestingId(null);
      if (result.ok) {
        message.success(t('settings.models.testSuccess', { ms: String(result.latencyMs) }));
      } else {
        message.error(t('settings.models.testFail', { error: result.error ?? 'Unknown error' }));
      }
    },
    onError: (err: Error, id) => {
      setTestingId(null);
      void id;
      message.error(t('settings.models.testFail', { error: err.message }));
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.providers.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (p: LLMProvider) => {
    setEditing(p);
    form.setFieldsValue(p);
    setModalOpen(true);
  };

  const handleFinish = (values: EditingProvider) => {
    if (editing?.id) {
      updateMutation.mutate({ id: editing.id, body: values });
    } else {
      createMutation.mutate(values as Parameters<typeof api.providers.create>[0]);
    }
  };

  const providers: LLMProvider[] = data?.data ?? [];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                margin: '0 0 6px',
              }}
            >
              {t('settings.models.title')}
            </h1>
            <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
              {t('settings.models.subtitle')}
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            {t('settings.models.add')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table<LLMProvider>
        dataSource={providers}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        style={{ '--ant-table-radius': 'var(--ph-radius)' } as React.CSSProperties}
        columns={[
          {
            title: t('settings.models.providerName'),
            dataIndex: 'name',
            key: 'name',
            render: (name: string, p: LLMProvider) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{name}</span>
                {p.isDefault && (
                  <Tag
                    color="processing"
                    style={{ fontSize: 11, padding: '0 6px', lineHeight: '18px' }}
                  >
                    {t('settings.models.defaultBadge')}
                  </Tag>
                )}
              </div>
            ),
          },
          {
            title: t('settings.models.providerType'),
            dataIndex: 'type',
            key: 'type',
            render: (type: ProviderType) => (
              <Tag style={{ fontSize: 12 }}>
                {PROVIDER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}
              </Tag>
            ),
          },
          {
            title: t('settings.models.baseUrl'),
            dataIndex: 'baseUrl',
            key: 'baseUrl',
            render: (url: string) => (
              <Text
                style={{
                  fontSize: 12,
                  color: 'var(--ph-text-tertiary)',
                  fontFamily: 'var(--ph-font-mono)',
                }}
                ellipsis={{ tooltip: url }}
              >
                {url}
              </Text>
            ),
          },
          {
            title: t('settings.models.models'),
            dataIndex: 'models',
            key: 'models',
            render: (models: string[]) => (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {models.slice(0, 2).map((m) => (
                  <Tag key={m} style={{ fontSize: 11 }}>
                    {m}
                  </Tag>
                ))}
                {models.length > 2 && (
                  <Tooltip title={models.slice(2).join(' · ')}>
                    <Tag style={{ fontSize: 11 }}>+{models.length - 2}</Tag>
                  </Tooltip>
                )}
              </div>
            ),
          },
          {
            title: t('settings.models.test'),
            key: 'test',
            width: 120,
            render: (_: unknown, p: LLMProvider) => (
              <Button
                size="small"
                type="text"
                icon={
                  p.enabled ? (
                    <CheckCircleOutlined style={{ color: 'var(--ph-success, #52c41a)' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: 'var(--ph-text-tertiary)' }} />
                  )
                }
                onClick={() => {
                  setTestingId(p.id);
                  testMutation.mutate(p.id);
                }}
                loading={testingId === p.id}
              >
                {t('settings.models.test')}
              </Button>
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 120,
            render: (_: unknown, p: LLMProvider) => (
              <Space size={4}>
                {!p.isDefault && (
                  <Button size="small" type="text" onClick={() => setDefaultMutation.mutate(p.id)}>
                    {t('settings.models.setDefault')}
                  </Button>
                )}
                <Button size="small" type="text" onClick={() => openEdit(p)}>
                  {t('common.edit')}
                </Button>
                <Popconfirm
                  title={t('settings.models.confirmDelete', { name: p.name })}
                  onConfirm={() => deleteMutation.mutate(p.id)}
                  okText={t('common.delete')}
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      {/* Add/Edit modal */}
      <Modal
        title={editing?.id ? t('common.edit') : t('settings.models.add')}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ type: 'openai_compatible', enabled: true }}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label={t('settings.models.providerName')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input placeholder="例如：硅基流动" />
          </Form.Item>

          <Form.Item name="type" label={t('settings.models.providerType')}>
            <Select options={PROVIDER_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label={t('settings.models.baseUrl')}
            rules={[{ required: true, type: 'url', message: '请输入有效 URL' }]}
          >
            <Input prefix={<GlobalOutlined />} placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={t('settings.models.apiKey')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            name="models"
            label={t('settings.models.models')}
            rules={[{ required: true, message: '请至少填入一个模型名称' }]}
          >
            <Select
              mode="tags"
              placeholder="输入模型名称后回车，如 gpt-4o-mini"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item name="defaultModel" label={t('settings.models.defaultModel')}>
            <Select
              placeholder="留空则使用列表第一个"
              allowClear
              options={((form.getFieldValue('models') as string[]) ?? []).map((m) => ({
                value: m,
                label: m,
              }))}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
              >
                {t('settings.models.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {t('settings.models.save')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
