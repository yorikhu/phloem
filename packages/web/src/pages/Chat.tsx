/**
 * ChatPage — knowledge base Q&A with streaming (F2.2, F2.4)
 * Route: /chat
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Typography, Spin, Empty, Tag, Dropdown, Modal, message } from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index.js';
import { chatStream } from '../api/modules/chat.js';
import { useI18n } from '../i18n/index.js';
import type { ChatSession, ChatMessage } from '@phloem/shared';

const { Text } = Typography;

export default function ChatPage() {
  const { t } = useI18n();
  const qc = useQueryClient();

  // ── Session list ──
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => api.chat.listSessions({ pageSize: 50 }),
  });

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
      if (activeSessionId) delete messagesCache.current[activeSessionId];
      if (activeSessionId) setActiveSessionId(sessions?.[0]?.id ?? null);
    },
  });

  const renameSession = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.chat.renameSession(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions'] }),
  });

  const sessions: ChatSession[] = sessionsData?.data ?? [];

  // ── Active session ──
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Cache for sessions not currently active
  const messagesCache = useRef<Record<string, ChatMessage[]>>({});

  // Load messages when active session changes
  const { data: msgsData, isLoading: msgsLoading } = useQuery({
    queryKey: ['chat-messages', activeSessionId],
    queryFn: () => api.chat.listMessages(activeSessionId!),
    enabled: !!activeSessionId,
  });

  useEffect(() => {
    setMessages(msgsData?.data ?? []);
  }, [msgsData]);

  // ── Composer ──
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isStreaming) scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

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
        datasetIds: [],
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
          content: <Input defaultValue={s.title} id="rename-input" placeholder="会话标题" />,
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
      {/* ── Left sidebar: session list ── */}
      <div
        style={{
          width: 240,
          borderRight: '1px solid var(--ph-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--ph-bg-elevated)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '16px 12px 12px',
            borderBottom: '1px solid var(--ph-border-subtle)',
          }}
        >
          <Button
            block
            icon={<PlusOutlined />}
            onClick={() => createSession.mutate()}
            loading={createSession.isPending}
          >
            {t('chat.newSession')}
          </Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
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
                  onClick={() => setActiveSessionId(s.id)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: 2,
                    borderRadius: 'var(--ph-radius-small)',
                    cursor: 'pointer',
                    background:
                      s.id === activeSessionId
                        ? 'var(--ph-accent-dim, rgba(76,106,240,0.12))'
                        : 'transparent',
                    borderLeft:
                      s.id === activeSessionId
                        ? '2px solid var(--ph-accent)'
                        : '2px solid transparent',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: s.id === activeSessionId ? 500 : 400,
                      color: 'var(--ph-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--ph-text-tertiary)',
                      marginTop: 2,
                    }}
                  >
                    {s.messageCount} 条消息
                  </div>
                </div>
              </Dropdown>
            ))
          )}
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--ph-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <RobotOutlined style={{ fontSize: 18, color: 'var(--ph-accent)' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {currentSession?.title ?? t('chat.title')}
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {msgsLoading ? (
            <Spin style={{ display: 'block', margin: '60px auto' }} />
          ) : messages.length === 0 && !isStreaming ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60%',
                gap: 12,
              }}
            >
              <RobotOutlined
                style={{ fontSize: 48, color: 'var(--ph-text-tertiary)', opacity: 0.4 }}
              />
              <Text style={{ color: 'var(--ph-text-tertiary)', fontSize: 13 }}>
                {t('retrieval.emptyIdle')}
              </Text>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '72%',
                      padding: '10px 14px',
                      borderRadius:
                        msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background:
                        msg.role === 'user' ? 'var(--ph-accent)' : 'var(--ph-bg-elevated)',
                      color: msg.role === 'user' ? '#fff' : 'var(--ph-text-primary)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      border: '1px solid var(--ph-border-subtle)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Citations */}
                  {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        maxWidth: '72%',
                        padding: '8px 12px',
                        background: 'var(--ph-bg-elevated)',
                        border: '1px solid var(--ph-border-subtle)',
                        borderRadius: 'var(--ph-radius-small)',
                        fontSize: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: 'var(--ph-text-tertiary)',
                          fontFamily: 'var(--ph-font-mono)',
                          marginBottom: 6,
                          display: 'block',
                        }}
                      >
                        {t('chat.citations')}
                      </Text>
                      {msg.citations.map((c, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>
                          <Tag style={{ fontSize: 11, marginRight: 6 }}>
                            {c.documentName ?? c.documentId}
                            {c.pageNumber != null ? ` p.${c.pageNumber}` : ''}
                          </Tag>
                          <Text
                            style={{ fontSize: 11, color: 'var(--ph-text-secondary)' }}
                            ellipsis={{ tooltip: c.content }}
                          >
                            {c.content.slice(0, 80)}…
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}

                  <Text
                    style={{
                      fontSize: 11,
                      color: 'var(--ph-text-tertiary)',
                      marginTop: 4,
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </Text>
                </div>
              ))}

              {/* Streaming assistant response */}
              {isStreaming && streamingContent && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: '10px 14px',
                    maxWidth: '72%',
                    borderRadius: '12px 12px 12px 4px',
                    background: 'var(--ph-bg-elevated)',
                    border: '1px solid var(--ph-border-subtle)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--ph-text-primary)',
                  }}
                >
                  {streamingContent}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 14,
                      background: 'var(--ph-accent)',
                      marginLeft: 2,
                      borderRadius: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'ph-blink 1s step-end infinite',
                    }}
                  />
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div style={{ marginBottom: 20 }}>
                  <Text
                    style={{ fontSize: 12, color: 'var(--ph-text-tertiary)', fontStyle: 'italic' }}
                  >
                    {t('chat.thinking')}
                  </Text>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Composer */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--ph-border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              background: 'var(--ph-bg-surface)',
              border: '1px solid var(--ph-border-default)',
              borderRadius: 'var(--ph-radius)',
              padding: '8px 12px',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('chat.placeholder')}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--ph-text-primary)',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                overflowY: 'hidden',
                minHeight: 24,
                maxHeight: 120,
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              loading={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
