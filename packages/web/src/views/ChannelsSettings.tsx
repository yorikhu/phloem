/**
 * ChannelsSettings — chat channel configuration (F8.3)
 * Route: /settings/channels
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
  Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { ChannelType, ChatChannel, Dataset } from '@phloem/shared';

const { Text } = Typography;

const CHANNEL_ICONS: Record<ChannelType, string> = {
  webchat: '💬',
  wechat: '💚',
  dingtalk: '🔵',
  feishu: '🔷',
  api: '🔌',
};

interface EditingChannel {
  id?: string;
  name?: string;
  type?: ChannelType;
  webhookUrl?: string;
  boundDatasetIds?: string[];
}

export default function ChannelsSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form] = Form.useForm<EditingChannel>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingChannel | null>(null);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => api.channels.list(),
  });

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.datasets.list(),
  });
  const datasets: Dataset[] = datasetsData?.data ?? [];
  const datasetName = (id: string) => datasets.find((d) => d.id === id)?.name ?? id;

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof api.channels.create>[0]) => api.channels.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] });
      message.success(t('settings.channels.add') + ' ✓');
      setModalOpen(false);
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.channels.update>[1] }) =>
      api.channels.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] });
      setModalOpen(false);
    },
    onError: (err: Error) => message.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.channels.update(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.channels.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels'] }),
    onError: (err: Error) => message.error(err.message),
  });

  const typeOptions = (['webchat', 'wechat', 'dingtalk', 'feishu', 'api'] as const).map((v) => ({
    value: v,
    label: t(`settings.channels.type.${v}`),
  }));

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (c: ChatChannel) => {
    setEditing(c);
    const values: EditingChannel = {
      name: c.name,
      type: c.type,
      boundDatasetIds: c.boundDatasetIds,
    };
    if (c.webhookUrl !== undefined) values.webhookUrl = c.webhookUrl;
    form.setFieldsValue(values);
    setModalOpen(true);
  };

  const handleFinish = (values: EditingChannel) => {
    if (editing?.id) {
      const body: Parameters<typeof api.channels.update>[1] = {
        boundDatasetIds: values.boundDatasetIds ?? [],
      };
      if (values.name !== undefined) body.name = values.name;
      if (values.webhookUrl !== undefined) body.webhookUrl = values.webhookUrl;
      updateMutation.mutate({ id: editing.id, body });
    } else {
      const body: Parameters<typeof api.channels.create>[0] = {
        name: values.name ?? '',
        type: values.type ?? 'webchat',
        boundDatasetIds: values.boundDatasetIds ?? [],
      };
      if (values.webhookUrl) body.webhookUrl = values.webhookUrl;
      createMutation.mutate(body);
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
            {t('settings.channels.title')}
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('settings.channels.subtitle')}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {t('settings.channels.add')}
        </Button>
      </div>

      <Table<ChatChannel>
        dataSource={channels ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        columns={[
          {
            title: t('settings.channels.colChannel'),
            dataIndex: 'name',
            key: 'channel',
            render: (name: string, c: ChatChannel) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--ph-radius-lg)',
                    background: 'var(--ph-bg-elevated)',
                    border: '1px solid var(--ph-border-subtle)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {CHANNEL_ICONS[c.type]}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: '20px' }}>{name}</div>
                  <Text
                    style={{ fontSize: 12, color: 'var(--ph-text-tertiary)', lineHeight: '16px' }}
                  >
                    {t(`settings.channels.type.${c.type}`)}
                  </Text>
                </div>
              </div>
            ),
          },
          {
            title: t('settings.channels.colDatasets'),
            dataIndex: 'boundDatasetIds',
            key: 'datasets',
            render: (ids: string[]) =>
              ids.length === 0 ? (
                <Text style={{ fontSize: 12, color: 'var(--ph-text-tertiary)' }}>—</Text>
              ) : ids.length <= 2 ? (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {ids.map((id) => (
                    <Tag key={id} style={{ fontSize: 11 }}>
                      {datasetName(id)}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Tooltip title={ids.map((id) => datasetName(id)).join(' · ')}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag style={{ fontSize: 11 }}>{datasetName(ids[0] ?? '')}</Tag>
                    <Tag style={{ fontSize: 11 }}>+{ids.length - 1}</Tag>
                  </div>
                </Tooltip>
              ),
          },
          {
            title: t('settings.channels.colMessages'),
            dataIndex: 'messageCount',
            key: 'messageCount',
            width: 100,
            render: (v: number) => (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--ph-font-mono)',
                  color: 'var(--ph-text-secondary)',
                }}
              >
                {v.toLocaleString()}
              </Text>
            ),
          },
          {
            title: '',
            key: 'enabled',
            width: 64,
            render: (_: unknown, c: ChatChannel) => (
              <Switch
                size="small"
                checked={c.enabled}
                onChange={(checked) => toggleMutation.mutate({ id: c.id, enabled: checked })}
              />
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, c: ChatChannel) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="small" type="text" onClick={() => openEdit(c)}>
                  {t('common.edit')}
                </Button>
                <Popconfirm
                  title={t('settings.channels.confirmRemove', { name: c.name })}
                  onConfirm={() => deleteMutation.mutate(c.id)}
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
        title={editing?.id ? t('common.edit') : t('settings.channels.add')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ type: 'webchat' }}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label={t('settings.channels.channelName')}
            rules={[{ required: true, message: '必填' }]}
          >
            <Input placeholder="例如：官网客服" />
          </Form.Item>
          <Form.Item name="type" label={t('settings.channels.colType')}>
            <Select options={typeOptions} disabled={!!editing?.id} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') !== 'webchat' && getFieldValue('type') !== 'api' ? (
                <Form.Item name="webhookUrl" label={t('settings.channels.webhookUrl')}>
                  <Input placeholder="https://..." />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="boundDatasetIds" label={t('settings.channels.boundDatasets')}>
            <Select
              mode="multiple"
              allowClear
              placeholder={t('settings.channels.boundDatasets')}
              options={datasets.map((d) => ({ value: d.id, label: d.name }))}
              optionFilterProp="label"
            />
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
