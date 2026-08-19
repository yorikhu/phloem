/**
 * Chat tool handlers — list_messages
 */

import { api } from '../_lib/api.js';
import type { ChatMessage } from '@phloem/shared';

interface ListMessagesArgs {
  chat_id: string;
  session_id: string;
  page?: number;
  page_size?: number;
}

export async function handleListMessages(args: unknown): Promise<string> {
  const params = args as ListMessagesArgs;
  if (!params.chat_id || !params.session_id) {
    throw new Error('chat_id and session_id are required');
  }

  const messages = await api.get<ChatMessage[]>(
    `/api/v1/chats/${params.chat_id}/sessions/${params.session_id}/messages`,
  );

  if (!messages.length) {
    return 'No messages found in this session.';
  }

  const lines = messages.map(
    (m) =>
      `[${m.role.toUpperCase()}] ${m.createdAt}\n${m.content}${m.citations?.length ? `\n  (${m.citations.length} citation(s))` : ''}`,
  );

  return `Messages in session ${params.session_id} (total: ${messages.length}):\n\n${lines.join('\n\n')}`;
}
