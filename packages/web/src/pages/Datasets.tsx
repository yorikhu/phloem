/**
 * Datasets page — card grid view.
 *
 * Style: minimal cards, generous spacing, monospace for metadata.
 */

import { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  Empty,
  Spin,
  Tooltip,
  Popconfirm,
  Typography,
} from 'antd';
import { PlusOutlined, DatabaseOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';

const { Text } = Typography;

export default function DatasetsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.datasets.list(),
  });

  const createMutation = useMutation({
    mutationFn: api.datasets.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.datasets.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['datasets'] }),
  });

  const datasets = data?.data ?? [];
  const filtered = datasets.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              marginBottom: 4,
            }}
          >
            {t('datasets.title')}
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('datasets.count', { count: datasets.length })}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('datasets.new')}
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder={t('datasets.searchPlaceholder')}
        prefix={<SearchOutlined style={{ color: 'var(--ph-text-tertiary)' }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          marginBottom: 24,
          maxWidth: 320,
          background: 'var(--ph-bg-elevated)',
        }}
        allowClear
      />

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: 'var(--ph-text-tertiary)' }}>
              {search ? t('datasets.emptyFiltered') : t('datasets.empty')}
            </span>
          }
        >
          {!search && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('datasets.createFirst')}
            </Button>
          )}
        </Empty>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((ds) => (
            <Card
              key={ds.id}
              hoverable
              onClick={() => navigate(`/documents?datasetId=${ds.id}`)}
              style={{
                background: 'var(--ph-bg-surface)',
                borderColor: 'var(--ph-border-subtle)',
                cursor: 'pointer',
              }}
              styles={{
                body: { padding: 20 },
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <DatabaseOutlined style={{ fontSize: 20, color: 'var(--ph-accent)' }} />
                <Popconfirm
                  title={t('datasets.deleteTitle')}
                  description={t('datasets.deleteDesc')}
                  onConfirm={() => deleteMutation.mutate(ds.id)}
                  okText={t('common.delete')}
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title={t('datasets.deleteTooltip')}>
                    <DeleteOutlined
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: 'var(--ph-text-tertiary)',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>

              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 6,
                  lineHeight: 1.4,
                }}
              >
                {ds.name}
              </h3>

              {ds.description && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--ph-text-secondary)',
                    marginBottom: 16,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ds.description}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 12,
                  fontFamily: 'var(--ph-font-mono)',
                  color: 'var(--ph-text-tertiary)',
                }}
              >
                <span>{t('datasets.metaDocs', { count: ds.documentCount })}</span>
                <span>{t('datasets.metaChunks', { count: ds.chunkCount })}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        title={t('datasets.modalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item
            name="name"
            label={t('datasets.fieldName')}
            rules={[{ required: true, message: t('datasets.fieldNameRequired') }]}
          >
            <Input placeholder={t('datasets.fieldNamePlaceholder')} autoFocus />
          </Form.Item>
          <Form.Item name="description" label={t('datasets.fieldDesc')}>
            <Input.TextArea
              placeholder={t('datasets.fieldDescPlaceholder')}
              rows={3}
              maxLength={512}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
