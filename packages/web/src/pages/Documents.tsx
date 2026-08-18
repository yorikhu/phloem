/**
 * Documents page — table view with upload.
 *
 * Style: clean table, monospace for file metadata,
 * inline status badges, drag-drop upload zone.
 */

import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Upload,
  Tag,
  Tooltip,
  Popconfirm,
  Typography,
  Segmented,
  message,
} from 'antd';
import { DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { Document, DocumentStatus } from '@phloem/shared';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.js';

const { Text } = Typography;
const { Dragger } = Upload;

const statusColors: Record<DocumentStatus, string> = {
  ready: 'var(--ph-success)',
  parsing: 'var(--ph-warning)',
  pending: 'var(--ph-text-tertiary)',
  error: 'var(--ph-error)',
};

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const datasetId = searchParams.get('datasetId') ?? '';
  const [view, setView] = useState<'table' | 'upload'>('table');

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.listDatasets(),
  });

  const datasets = datasetsData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['documents', datasetId],
    queryFn: () => api.listDocuments(datasetId),
    enabled: !!datasetId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => api.uploadDocument(datasetId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      message.success(t('documents.uploaded'));
    },
    onError: () => message.error(t('documents.uploadFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.deleteDocument(datasetId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      message.success(t('documents.deleted'));
    },
  });

  const documents = data?.data ?? [];

  const columns = useMemo(
    () => [
      {
        title: t('documents.colName'),
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (name: string) => <span style={{ fontSize: 13 }}>{name}</span>,
      },
      {
        title: t('documents.colStatus'),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: DocumentStatus) => (
          <Tag
            style={{
              background: 'transparent',
              border: `1px solid ${statusColors[status]}`,
              color: statusColors[status],
              fontSize: 11,
              fontFamily: 'var(--ph-font-mono)',
            }}
          >
            {status}
          </Tag>
        ),
      },
      {
        title: t('documents.colSize'),
        dataIndex: 'size',
        key: 'size',
        width: 90,
        render: (size: number) => (
          <span
            style={{
              fontFamily: 'var(--ph-font-mono)',
              fontSize: 12,
              color: 'var(--ph-text-secondary)',
            }}
          >
            {formatSize(size)}
          </span>
        ),
      },
      {
        title: t('documents.colChunks'),
        dataIndex: 'chunkCount',
        key: 'chunkCount',
        width: 80,
        render: (count: number) => (
          <span
            style={{
              fontFamily: 'var(--ph-font-mono)',
              fontSize: 12,
              color: 'var(--ph-text-secondary)',
            }}
          >
            {count ?? '—'}
          </span>
        ),
      },
      {
        title: '',
        key: 'actions',
        width: 48,
        render: (_: unknown, record: Document) => (
          <Popconfirm
            title={t('datasets.deleteTitle')}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t('common.delete')}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t('datasets.deleteTooltip')}>
              <DeleteOutlined
                style={{
                  color: 'var(--ph-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              />
            </Tooltip>
          </Popconfirm>
        ),
      },
    ],
    [deleteMutation],
  );

  if (!datasetId) {
    return (
      <div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            marginBottom: 32,
          }}
        >
          {t('documents.title')}
        </h1>
        <div style={{ marginBottom: 24 }}>
          {datasets.map((ds) => (
            <Button
              key={ds.id}
              onClick={() => setSearchParams({ datasetId: ds.id })}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {ds.name}
            </Button>
          ))}
        </div>
        <Text style={{ color: 'var(--ph-text-tertiary)', fontSize: 13 }}>
          {t('documents.selectDataset')}
        </Text>
      </div>
    );
  }

  const currentDataset = datasets.find((d) => d.id === datasetId);

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
            {currentDataset?.name ?? 'Documents'}
          </h1>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('documents.count', { count: documents.length })}
          </Text>
        </div>
        <Segmented
          options={[
            { label: t('documents.viewTable'), value: 'table' },
            { label: t('documents.viewUpload'), value: 'upload' },
          ]}
          value={view}
          onChange={(v) => setView(v as 'table' | 'upload')}
        />
      </div>

      {/* Dataset selector */}
      <div style={{ marginBottom: 24 }}>
        {datasets.map((ds) => (
          <Button
            key={ds.id}
            size="small"
            type={ds.id === datasetId ? 'primary' : 'default'}
            onClick={() => setSearchParams({ datasetId: ds.id })}
            style={{ marginRight: 8, marginBottom: 8 }}
          >
            {ds.name}
          </Button>
        ))}
      </div>

      {view === 'upload' ? (
        <Dragger
          multiple
          showUploadList={false}
          customRequest={({ file }) => {
            uploadMutation.mutate({ file: file as File });
          }}
          style={{
            background: 'var(--ph-bg-surface)',
            borderColor: 'var(--ph-border-default)',
            borderRadius: 'var(--ph-radius)',
            padding: '40px 20px',
          }}
        >
          <p className="ant-upload-drag-icon" style={{ marginBottom: 16 }}>
            <InboxOutlined style={{ fontSize: 40, color: 'var(--ph-accent)' }} />
          </p>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ph-text-primary)',
              marginBottom: 4,
            }}
          >
            {t('documents.dropTitle')}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ph-text-tertiary)' }}>
            {t('documents.dropHint')}
          </p>
        </Dragger>
      ) : (
        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="middle"
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            simple: true,
          }}
          locale={{
            emptyText: (
              <span style={{ color: 'var(--ph-text-tertiary)' }}>{t('documents.empty')}</span>
            ),
          }}
        />
      )}
    </div>
  );
}
