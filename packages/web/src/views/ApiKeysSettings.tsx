/**
 * ApiKeysSettings — API Key management (F5.6)
 * Route: /settings/apikeys
 */
import { useState } from 'react';
import { Table, Button, Input, Typography, Popconfirm, message, Modal, Form } from 'antd';
import { KeyOutlined, DeleteOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apikeyApi, type ApiKey, type ApiKeyCreated } from '../api/modules/apikey.js';
import { useI18n } from '../i18n/index.js';

const { Title, Text } = Typography;

export default function ApiKeysSettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [form] = Form.useForm<{ name: string }>();

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['apikeys'],
    queryFn: apikeyApi.list,
  });

  const revoke = useMutation({
    mutationFn: apikeyApi.revoke,
    onSuccess: () => {
      message.success(t('settings.apikeys.revoked'));
      qc.invalidateQueries({ queryKey: ['apikeys'] });
    },
    onError: () => message.error(t('settings.apikeys.revoke_failed')),
  });

  const create = useMutation({
    mutationFn: (name: string) => apikeyApi.create(name),
    onSuccess: (data) => {
      setNewKey(data);
      qc.invalidateQueries({ queryKey: ['apikeys'] });
    },
    onError: () => message.error(t('settings.apikeys.create_failed')),
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => message.success(t('settings.apikeys.copied')));
  };

  const columns = [
    {
      title: t('settings.apikeys.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('settings.apikeys.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ApiKey) => (
        <Popconfirm
          title={t('settings.apikeys.confirm_revoke')}
          onConfirm={() => revoke.mutate(record.api_key_id)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} loading={revoke.isPending} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('settings.apikeys.title')}
          </Title>
          <Text type="secondary">{t('settings.apikeys.description')}</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setNewKey(null);
            setCreateModalOpen(true);
            form.resetFields();
          }}
        >
          {t('settings.apikeys.create')}
        </Button>
      </div>

      {keys.length === 0 && !isLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
          <KeyOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>{t('settings.apikeys.empty')}</div>
        </div>
      ) : (
        <Table
          dataSource={keys}
          columns={columns}
          rowKey="api_key_id"
          loading={isLoading}
          pagination={false}
        />
      )}

      <Modal
        title={t('settings.apikeys.create_title')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          setNewKey(null);
        }}
        footer={null}
      >
        {newKey ? (
          <div>
            <Text type="secondary">{t('settings.apikeys.new_key_notice')}</Text>
            <div
              style={{
                marginTop: 16,
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                wordBreak: 'break-all',
              }}
            >
              <Text copyable={{ text: newKey.api_key }} style={{ fontFamily: 'monospace' }}>
                {newKey.api_key}
              </Text>
            </div>
            <Button
              block
              style={{ marginTop: 16 }}
              icon={<CopyOutlined />}
              onClick={() => copyKey(newKey.api_key)}
            >
              {t('settings.apikeys.copy')}
            </Button>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={(values) => create.mutate(values.name)}>
            <Form.Item
              name="name"
              label={t('settings.apikeys.key_name')}
              rules={[{ required: true, message: t('settings.apikeys.name_required') }]}
            >
              <Input placeholder={t('settings.apikeys.name_placeholder')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={create.isPending}>
              {t('settings.apikeys.generate')}
            </Button>
          </Form>
        )}
      </Modal>
    </div>
  );
}
