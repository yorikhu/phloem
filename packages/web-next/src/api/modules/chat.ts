/**
 * Chat sessions & messages API (F2.2, F2.4)
 */
import { request, type Page, type PageParams, pageQuery } from '../http.js';
import type { ChatSession, ChatMessage, ChatRequest } from '@phloem/shared';

export const chat = {
  // ── Sessions ──
  listSessions(params?: PageParams) {
    return request<Page<ChatSession>>(`/chat/sessions${pageQuery(params)}`);
  },

  createSession(body: { title?: string; datasetIds?: string[] }) {
    return request<ChatSession>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteSession(id: string) {
    return request<void>(`/chat/sessions/${id}`, { method: 'DELETE' });
  },

  renameSession(id: string, title: string) {
    return request<ChatSession>(`/chat/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  },

  // ── Messages ──
  listMessages(sessionId: string) {
    return request<Page<ChatMessage>>(`/chat/sessions/${sessionId}/messages`);
  },
};

/**
 * Start a chat SSE stream and yield parsed events.
 * Usage:
 *   for await (const event of chatStream({ question, datasetIds, sessionId })) {
 *     if (event.type === 'delta') appendToken(event.content);
 *     if (event.type === 'done') finish(event.sessionId);
 *   }
 */
export async function* chatStream(body: ChatRequest): AsyncGenerator<{
  type: 'delta' | 'done' | 'error';
  content?: string;
  citations?: ChatMessage['citations'];
  sessionId?: string;
}> {
  const res = await fetch('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Chat stream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const event = JSON.parse(data) as {
            type: string;
            content?: string;
            citations?: ChatMessage['citations'];
            sessionId?: string;
          };
          yield event as {
            type: 'delta' | 'done' | 'error';
            content?: string;
            citations?: ChatMessage['citations'];
            sessionId?: string;
          };
        } catch {
          // skip malformed line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
