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
import { api } from '../api/client.js';

const { Text } = Typography;

export default function DatasetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.listDatasets(),
  });

  const createMutation = useMutation({
    mutationFn: api.createDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDataset,
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
            Datasets
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {datasets.length} {datasets.length === 1 ? 'dataset' : 'datasets'}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Dataset
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search datasets..."
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
              {search ? 'No matching datasets' : 'No datasets yet'}
            </span>
          }
        >
          {!search && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Create your first dataset
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
                  title="Delete this dataset?"
                  description="This action cannot be undone."
                  onConfirm={() => deleteMutation.mutate(ds.id)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Delete">
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
                <span>{ds.documentCount} docs</span>
                <span>{ds.chunkCount} chunks</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        title="New Dataset"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g. Product Documentation" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional description..." rows={3} maxLength={512} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
