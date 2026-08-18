/**
 * ChatPage — knowledge base Q&A with streaming (F2.2, F2.4)
 * Route: /chat
 *
 * Layout: session rail (left) + conversation column.
 * All colors run through --ph-* tokens; chat-specific classes
 * (.ph-chat-*) live in theme/global.css.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Typography, Spin, Empty, Dropdown, Modal, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { chatStream } from '../api/modules/chat.js';
import { useI18n } from '../i18n/index.js';
import ChatComposer from '../components/ChatComposer.js';
import type { ChatSession, ChatMessage } from '@phloem/shared';

const { Text } = Typography;

/** Conversation column max width — keeps line lengths readable. */
const COLUMN_WIDTH = 760;

/** Compact time for session meta / message timestamps. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return hm;
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${hm}`;
}

export default function ChatPage() {
  const { t } = useI18n();
  const qc = useQueryClient();

  // ── Session list ──
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => api.chat.listSessions({ pageSize: 50 }),
  });
  const sessions: ChatSession[] = sessionsData?.data ?? [];

  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessions[0]?.id ?? null);

  const createSession = useMutation({
    mutationFn: () => api.chat.createSession({}),
    onSuccess: (s: ChatSession) => {
      qc.invalidateQueries({ queryKey: ['chat-sessions'] });
      setActiveSessionId(s.id);
    },
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.chat.deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-sessions'] });
      setActiveSessionId((prev) =>
        prev ? (sessions.find((s) => s.id !== prev)?.id ?? null) : null,
      );
    },
  });

  const renameSession = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.chat.renameSession(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions'] }),
  });

  // ── Messages ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { data: msgsData, isLoading: msgsLoading } = useQuery({
    queryKey: ['chat-messages', activeSessionId],
    queryFn: () => api.chat.listMessages(activeSessionId!),
    enabled: !!activeSessionId,
  });

  useEffect(() => {
    setMessages(msgsData?.data ?? []);
  }, [msgsData]);

  // ── Datasets for scope selector ──
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.datasets.list(),
  });
  const datasets = datasetsData?.data ?? [];
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);

  // ── Composer ──
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !activeSessionId) return;
    const q = input.trim();
    setInput('');
    setStreamingContent('');
    setIsStreaming(true);

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sessionId: activeSessionId,
      role: 'user',
      content: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let assistantContent = '';
      let sessionId = activeSessionId;

      for await (const event of chatStream({
        question: q,
        datasetIds: selectedDatasets,
        sessionId: activeSessionId,
      })) {
        if (event.type === 'delta' && event.content) {
          assistantContent += event.content;
          setStreamingContent(assistantContent);
        }
        if (event.type === 'done') {
          if (event.sessionId) sessionId = event.sessionId;

          const assistantMsg: ChatMessage = {
            id: `asst-${Date.now()}`,
            sessionId,
            role: 'assistant',
            content: assistantContent,
            ...(event.citations ? { citations: event.citations } : {}),
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          qc.invalidateQueries({ queryKey: ['chat-sessions'] });
        }
        if (event.type === 'error') {
          message.error(event.content ?? 'Stream error');
        }
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  // ── Session context menu ──
  const sessionContextMenu = (s: ChatSession): MenuProps['items'] => [
    {
      key: 'rename',
      label: t('chat.renameSession'),
      icon: <EditOutlined />,
      onClick: () => {
        Modal.confirm({
          title: t('chat.renameSession'),
          content: <Input defaultValue={s.title} id="rename-input" placeholder={s.title} />,
          onOk: () => {
            const v = (document.getElementById('rename-input') as HTMLInputElement)?.value;
            if (v?.trim()) renameSession.mutate({ id: s.id, title: v.trim() });
          },
        });
      },
    },
    {
      key: 'delete',
      label: <span style={{ color: 'var(--ph-error)' }}>{t('chat.deleteSession')}</span>,
      icon: <DeleteOutlined />,
      onClick: () => {
        Modal.confirm({
          title: t('chat.confirmDelete', { title: s.title }),
          okText: t('common.delete'),
          okButtonProps: { danger: true },
          onOk: () => deleteSession.mutate(s.id),
        });
      },
    },
  ];

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Session rail ── */}
      <div
        style={{
          width: 264,
          flexShrink: 0,
          borderRight: '1px solid var(--ph-border-subtle)',
          background: 'var(--ph-bg-surface)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Rail header */}
        <div
          style={{
            padding: '14px 14px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ph-text-tertiary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {t('chat.sessions')}
          </span>
          <Button
            size="small"
            type="text"
            icon={<PlusOutlined />}
            onClick={() => createSession.mutate()}
            loading={createSession.isPending}
            aria-label={t('chat.newSession')}
          />
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 12px' }}>
          {sessionsLoading ? (
            <Spin style={{ display: 'block', margin: '24px auto' }} />
          ) : sessions.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ fontSize: 12, color: 'var(--ph-text-tertiary)' }}>
                  {t('chat.emptySessions')}
                </span>
              }
              style={{ marginTop: 32 }}
            />
          ) : (
            sessions.map((s) => (
              <Dropdown
                key={s.id}
                trigger={['contextMenu']}
                menu={{ items: sessionContextMenu(s) ?? [] }}
              >
                <div
                  className={`ph-chat-session${s.id === activeSessionId ? ' active' : ''}`}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <span className="ph-chat-session-title">{s.title}</span>
                  <span className="ph-chat-session-meta">
                    {s.messageCount} · {formatTime(s.updatedAt ?? s.createdAt)}
                  </span>
                </div>
              </Dropdown>
            ))
          )}
        </div>
      </div>

      {/* ── Conversation column ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--ph-bg-base)',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 52,
            flexShrink: 0,
            padding: '0 24px',
            borderBottom: '1px solid var(--ph-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <RobotOutlined style={{ fontSize: 16, color: 'var(--ph-accent)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {currentSession?.title ?? t('chat.title')}
          </span>
          {currentSession && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--ph-text-tertiary)',
                fontFamily: 'var(--ph-font-mono)',
                marginLeft: 'auto',
              }}
            >
              {currentSession.messageCount}
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: COLUMN_WIDTH, margin: '0 auto', padding: '24px 24px 12px' }}>
            {msgsLoading ? (
              <Spin style={{ display: 'block', margin: '60px auto' }} />
            ) : messages.length === 0 && !isStreaming ? (
              /* Empty state */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  paddingTop: '14vh',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--ph-accent-dim)',
                    border: '1px solid var(--ph-accent-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RobotOutlined style={{ fontSize: 28, color: 'var(--ph-accent)' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{t('chat.emptyTitle')}</div>
                <Text
                  style={{ fontSize: 12, color: 'var(--ph-text-tertiary)', textAlign: 'center' }}
                >
                  {t('chat.placeholder')}
                </Text>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}

                {/* Streaming assistant response */}
                {isStreaming &&
                  (streamingContent ? (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      <AvatarBadge role="assistant" />
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="ph-bubble ph-bubble-assistant"
                          style={{ display: 'inline-block' }}
                        >
                          {streamingContent}
                          <span className="ph-caret" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      <AvatarBadge role="assistant" />
                      <div style={{ paddingTop: 6 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: 'var(--ph-text-tertiary)',
                            fontStyle: 'italic',
                          }}
                        >
                          {t('chat.thinking')}
                        </Text>
                      </div>
                    </div>
                  ))}

                <div ref={bottomRef} />
              </>
            )}
          </div>
        </div>

        {/* Composer */}
        <div style={{ flexShrink: 0, padding: '12px 24px 18px' }}>
          <div style={{ maxWidth: COLUMN_WIDTH, margin: '0 auto' }}>
            <ChatComposer
              datasets={datasets}
              selectedDatasets={selectedDatasets}
              onSelectedDatasetsChange={setSelectedDatasets}
              value={input}
              onValueChange={setInput}
              onSend={handleSend}
              sending={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Round avatar badge for one side of the conversation. */
function AvatarBadge({ role }: { role: 'user' | 'assistant' }) {
  return role === 'user' ? (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--ph-bg-elevated)',
        border: '1px solid var(--ph-border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <UserOutlined style={{ fontSize: 13, color: 'var(--ph-text-secondary)' }} />
    </div>
  ) : (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--ph-accent-dim)',
        border: '1px solid var(--ph-accent-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <RobotOutlined style={{ fontSize: 13, color: 'var(--ph-accent)' }} />
    </div>
  );
}

/** One message row: avatar + bubble + optional citation chips. */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        marginBottom: 20,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      <AvatarBadge role={msg.role} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '82%',
          minWidth: 0,
        }}
      >
        <div
          className={isUser ? 'ph-bubble ph-bubble-user' : 'ph-bubble ph-bubble-assistant'}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {msg.content}
        </div>

        {/* Citations */}
        {!isUser && msg.citations && msg.citations.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {msg.citations.slice(0, 6).map((c, i) => (
              <span key={i} className="ph-chat-citation">
                <span className="ph-chat-citation-index">{i + 1}</span>
                <span
                  style={{
                    maxWidth: 200,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.documentName ?? c.documentId}
                  {c.pageNumber != null ? ` · p.${c.pageNumber}` : ''}
                </span>
              </span>
            ))}
          </div>
        )}

        <span
          style={{
            fontSize: 11,
            color: 'var(--ph-text-tertiary)',
            marginTop: 4,
            fontFamily: 'var(--ph-font-mono)',
          }}
        >
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}
