/**
 * DocumentDetail — chunk browser + manual editing (F1.4, F1.5, F1.6)
 * Route: /documents/:docId
 *
 * Accessible via Documents page table row click or CommandPalette.
 * Shows: document meta + chunk list + inline chunk editing + reparse.
 */
import { useState } from 'react';
import {
  Button,
  Tag,
  Typography,
  Space,
  Popconfirm,
  Modal,
  Input,
  message,
  Spin,
  Tooltip,
  Breadcrumb,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@/src/router-shim';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { Chunk } from '@phloem/shared';

const { Title, Text, Paragraph } = Typography;

export default function DocumentDetailPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { docId } = useParams<{ docId: string }>();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [reparseOpen, setReparseOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['chunks', docId],
    queryFn: () => api.chunks.list(docId!),
    enabled: !!docId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ chunkId, content }: { chunkId: string; content: string }) =>
      api.chunks.update(docId!, chunkId, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chunks', docId] });
      message.success('Chunk 已保存');
      setEditingId(null);
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (chunkId: string) => api.chunks.remove(docId!, chunkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chunks', docId] });
      message.success('Chunk 已删除');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const reparseMutation = useMutation({
    mutationFn: () => api.chunks.rebuild(docId!),
    onSuccess: () => {
      message.success('重新解析已启动，请稍后刷新页面查看结果');
      setReparseOpen(false);
      qc.invalidateQueries({ queryKey: ['chunks', docId] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const chunks: Chunk[] = data?.data ?? [];

  const startEdit = (chunk: Chunk) => {
    setEditingId(chunk.id);
    setEditContent(chunk.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ chunkId: editingId, content: editContent });
  };

  if (!docId) {
    return (
      <div style={{ padding: 40 }}>
        <Text style={{ color: 'var(--ph-text-tertiary)' }}>无效的文档 ID</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Breadcrumb + header */}
      <Breadcrumb
        style={{ marginBottom: 16, fontSize: 13 }}
        items={[
          { title: <a onClick={() => navigate('/documents')}>{t('nav.documents')}</a> },
          { title: docId },
        ]}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FileTextOutlined style={{ fontSize: 20, color: 'var(--ph-accent)' }} />
            <Title level={4} style={{ margin: 0 }}>
              {docId}
            </Title>
            <Tag>{chunks.length} chunks</Tag>
          </div>
          <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
            {t('retrieval.emptyIdle').includes('检索') ? '人工审核与修正文档切片质量' : ''}
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setReparseOpen(true)}>
            重新切片
          </Button>
          <Button onClick={() => navigate('/documents')}>返回文档列表</Button>
        </Space>
      </div>

      {/* Chunk list */}
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : chunks.length === 0 ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: 'var(--ph-text-tertiary)',
          }}
        >
          <Paragraph>{t('retrieval.emptyNone')}</Paragraph>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chunks.map((chunk) => (
            <div
              key={chunk.id}
              style={{
                background: 'var(--ph-bg-elevated)',
                border: '1px solid var(--ph-border-subtle)',
                borderRadius: 'var(--ph-radius)',
                overflow: 'hidden',
              }}
            >
              {/* Chunk header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--ph-border-subtle)',
                  background: 'var(--ph-bg-surface)',
                }}
              >
                <Space size={12}>
                  <Tag style={{ fontFamily: 'var(--ph-font-mono)', fontSize: 11 }}>
                    #{chunk.index}
                  </Tag>
                  {chunk.avgScore != null && (
                    <Tag
                      color={
                        chunk.avgScore > 0.9 ? 'green' : chunk.avgScore > 0.7 ? 'orange' : 'red'
                      }
                    >
                      相似度 {Math.round(chunk.avgScore * 100)}%
                    </Tag>
                  )}
                  {chunk.length != null && (
                    <Text style={{ fontSize: 12, color: 'var(--ph-text-tertiary)' }}>
                      {chunk.length} 字符
                    </Text>
                  )}
                </Space>

                {editingId === chunk.id ? (
                  <Space size={4}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={saveEdit}
                      loading={updateMutation.isPending}
                    >
                      保存
                    </Button>
                    <Button
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={cancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      取消
                    </Button>
                  </Space>
                ) : (
                  <Space size={4}>
                    <Tooltip title="编辑内容">
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => startEdit(chunk)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确认删除此 chunk？"
                      onConfirm={() => deleteMutation.mutate(chunk.id)}
                      okText={t('common.delete')}
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleteMutation.isPending}
                      />
                    </Popconfirm>
                  </Space>
                )}
              </div>

              {/* Chunk content */}
              <div style={{ padding: '12px 14px' }}>
                {editingId === chunk.id ? (
                  <Input.TextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    style={{ fontFamily: 'var(--ph-font-mono)', fontSize: 13 }}
                  />
                ) : (
                  <Paragraph
                    style={{
                      fontSize: 13,
                      lineHeight: 1.75,
                      color: 'var(--ph-text-primary)',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {chunk.content}
                  </Paragraph>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reparse modal */}
      <Modal
        title="重新切片"
        open={reparseOpen}
        onCancel={() => setReparseOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setReparseOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={reparseMutation.isPending}
              onClick={() => reparseMutation.mutate()}
            >
              确认重新切片
            </Button>
          </Space>
        }
      >
        <Paragraph style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
          重新切片将根据当前文档内容重新切分 chunk，当前的人工编辑内容将被覆盖。 此操作不可撤销。
        </Paragraph>
      </Modal>
    </div>
  );
}
