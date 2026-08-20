/**
 * ChatService — assistant/session CRUD + completion over RAGFlow,
 * plus the SSE upstream opener used by the controller.
 */

import { Inject, Injectable } from '@nestjs/common';
import { RAGFLOW_HTTP } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import type { CompletionDtoType, CreateChatDtoType, CreateSessionDtoType } from './dto/chat.dto.js';

@Injectable()
export class ChatService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  list(page: number, pageSize: number) {
    return this.ragflow
      .call<{ chats: unknown[]; total: number }>(`/api/v1/chats?page=${page}&page_size=${pageSize}`)
      .then((d) => ({ data: d?.chats ?? [], total: d?.total ?? 0 }));
  }

  create(input: CreateChatDtoType) {
    return this.ragflow.call<unknown>('/api/v1/chats', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  get(id: string) {
    return this.ragflow.call<unknown>(`/api/v1/chats/${id}`);
  }

  remove(id: string) {
    return this.ragflow.call<void>(`/api/v1/chats/${id}`, { method: 'DELETE' });
  }

  listSessions(id: string, page: number, pageSize: number) {
    return this.ragflow
      .call<{ sessions: unknown[]; total: number }>(
        `/api/v1/chats/${id}/sessions?page=${page}&page_size=${pageSize}`,
      )
      .then((d) => ({ data: d?.sessions ?? [], total: d?.total ?? 0 }));
  }

  createSession(id: string, input: CreateSessionDtoType) {
    return this.ragflow.call<unknown>(`/api/v1/chats/${id}/sessions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  complete(chatId: string, input: Omit<CompletionDtoType, 'stream'>) {
    return this.ragflow.call<{ answer: string; reference?: unknown[]; session_id?: string }>(
      `/api/v1/chats/${chatId}/completions`,
      {
        method: 'POST',
        body: JSON.stringify({ question: input.question, stream: false }),
      },
    );
  }

  stream(chatId: string, input: CompletionDtoType): Promise<Response> {
    const body: Record<string, unknown> = { question: input.question, stream: true };
    if (input.session_id) body.session_id = input.session_id;
    if (input.dataset_ids?.length) body.dataset_ids = input.dataset_ids;
    if (input.model) body.model = input.model;
    return this.ragflow.raw(`/api/v1/chats/${chatId}/completions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
