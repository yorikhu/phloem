/**
 * Chat routes — /api/v1/chats, /api/v1/chats/:id/completion
 *
 * GET     /api/v1/chats                        — list chat assistants
 * POST    /api/v1/chats                        — create chat assistant
 * GET     /api/v1/chats/:id                    — get chat assistant
 * DELETE  /api/v1/chats/:id                    — delete chat assistant
 * GET     /api/v1/chats/:id/sessions           — list sessions
 * POST    /api/v1/chats/:id/sessions           — create session
 * POST    /api/v1/chats/:id/completion         — stream chat completion (SSE)
 */

import type { FastifyInstance, FastifyReply } from 'fastify';
import { ok, created, noContent, mapError, ErrCode, apiError } from './_lib/response.js';
import { z } from 'zod';
import type { ChatMessage } from '@phloem/shared';

const CompletionBodySchema = z.object({
  question: z.string().min(1).max(4000),
  session_id: z.string().optional(),
  dataset_ids: z.array(z.string()).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
});

const CreateSessionSchema = z.object({
  session_id: z.string().optional(),
});

const BASE_URL = () =>
  (process.env.PHLOEM_RAGFLOW_URL ?? 'http://localhost:9380').replace(/\/$/, '');
const API_KEY = () => process.env.PHLOEM_RAGFLOW_API_KEY ?? '';

function rfHeaders() {
  return {
    Authorization: `Bearer ${API_KEY()}`,
    'Content-Type': 'application/json',
  };
}

async function rfFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ code: number; data?: T; message?: string }> {
  const resp = await fetch(`${BASE_URL()}${path}`, {
    ...init,
    headers: { ...rfHeaders(), ...(init?.headers as Record<string, string>) },
  });
  const text = await resp.text();
  if (!text) return { code: 0 };
  return JSON.parse(text) as { code: number; data?: T; message?: string };
}

// ── SSE Streaming ────────────────────────────────────────────────────────────

async function streamChatCompletion(
  app: FastifyInstance,
  chatId: string,
  body: z.infer<typeof CompletionBodySchema>,
  reply: FastifyReply,
) {
  const baseUrl = BASE_URL();
  const apiKey = API_KEY();

  // Build RAGFlow chat completion request
  const rfBody: Record<string, unknown> = {
    question: body.question,
    stream: true,
  };
  if (body.session_id) rfBody.session_id = body.session_id;
  if (body.dataset_ids?.length) rfBody.dataset_ids = body.dataset_ids;
  if (body.model) rfBody.model = body.model;

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  });

  try {
    const response = await fetch(`${baseUrl}/api/v1/chats/${chatId}/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(rfBody),
    });

    if (!response.ok) {
      reply.raw.write(
        `event: error\ndata: ${JSON.stringify({ error: `RAGFlow HTTP ${response.status}` })}\n\n`,
      );
      reply.raw.end();
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // RAGFlow SSE format: data: {"choices":[{"delta":{"content":"..."}}]}
    const lines: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      lines.push(chunk);

      // Process complete lines (each line is "data: {...}")
      for (const line of lines.join('').split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]' || raw === 'done') {
          reply.raw.write('event: done\ndata: {}\n\n');
          reply.raw.end();
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          // Extract content delta from various RAGFlow SSE formats
          const content =
            parsed.choices?.[0]?.delta?.content ?? parsed.delta?.content ?? parsed.content ?? '';
          const citations = parsed.reference ?? parsed.citations ?? [];
          const sessionId = parsed.session_id ?? body.session_id;

          if (content) {
            reply.raw.write(
              `event: message\ndata: ${JSON.stringify({ type: 'delta', content, citations, sessionId })}\n\n`,
            );
          }
        } catch {
          // skip malformed lines
        }
      }
      lines.length = 0;
    }

    reply.raw.write('event: done\ndata: {}\n\n');
    reply.raw.end();
  } catch (err) {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
    reply.raw.end();
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────

export async function chatRoutes(app: FastifyInstance) {
  // List chat assistants
  app.get('/api/v1/chats', async (req, reply) => {
    const { page = 1, page_size = 20 } = req.query as { page?: number; page_size?: number };
    try {
      const resp = await rfFetch<{ chats: unknown[]; total: number }>(
        `/api/v1/chats?page=${page}&page_size=${page_size}`,
      );
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return ok({ data: resp.data?.chats ?? [], total: resp.data?.total ?? 0 }, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // Create chat assistant
  app.post('/api/v1/chats', async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1).max(255),
        dataset_ids: z.array(z.string()).optional(),
      })
      .safeParse(req.body);
    if (!body.success) return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);

    try {
      const resp = await rfFetch<Record<string, unknown>>('/api/v1/chats', {
        method: 'POST',
        body: JSON.stringify(body.data),
      });
      if (resp.code !== 0)
        return apiError(
          reply,
          400,
          ErrCode.CHAT_SESSION_CREATE_FAILED,
          resp.message ?? 'RAGFlow error',
        );
      return created(resp.data, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // Get chat assistant
  app.get('/api/v1/chats/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const resp = await rfFetch<Record<string, unknown>>(`/api/v1/chats/${id}`);
      if (resp.code === 404)
        return apiError(reply, 404, ErrCode.CHAT_SESSION_NOT_FOUND, `Chat ${id} not found`);
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return ok(resp.data, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // Delete chat assistant
  app.delete('/api/v1/chats/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const resp = await rfFetch<void>(`/api/v1/chats/${id}`, { method: 'DELETE' });
      if (resp.code !== 0)
        return apiError(
          reply,
          400,
          ErrCode.CHAT_SESSION_DELETE_FAILED,
          resp.message ?? 'RAGFlow error',
        );
      return noContent(reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // List sessions
  app.get('/api/v1/chats/:id/sessions', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { page = 1, page_size = 20 } = req.query as { page?: number; page_size?: number };
    try {
      const resp = await rfFetch<{ sessions: unknown[]; total: number }>(
        `/api/v1/chats/${id}/sessions?page=${page}&page_size=${page_size}`,
      );
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return ok({ data: resp.data?.sessions ?? [], total: resp.data?.total ?? 0 }, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // Create session
  app.post('/api/v1/chats/:id/sessions', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateSessionSchema.safeParse(req.body);
    if (!body.success) return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);

    try {
      const resp = await rfFetch<{ session_id: string }>(`/api/v1/chats/${id}/sessions`, {
        method: 'POST',
        body: JSON.stringify({ session_id: body.data.session_id }),
      });
      if (resp.code !== 0)
        return apiError(
          reply,
          400,
          ErrCode.CHAT_SESSION_CREATE_FAILED,
          resp.message ?? 'RAGFlow error',
        );
      return created(resp.data, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // Completion (SSE streaming)
  app.post('/api/v1/chats/:id/completion', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CompletionBodySchema.safeParse(req.body);
    if (!body.success) return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);

    if (body.data.stream !== false) {
      // SSE mode
      await streamChatCompletion(app, id, body.data, reply);
      return reply;
    }

    // Non-streaming mode
    try {
      const rfBody: Record<string, unknown> = {
        question: body.data.question,
        stream: false,
      };
      if (body.data.session_id) rfBody.session_id = body.data.session_id;
      if (body.data.dataset_ids?.length) rfBody.dataset_ids = body.data.dataset_ids;

      const resp = await rfFetch<{ answer: string; reference?: unknown[]; session_id?: string }>(
        `/api/v1/chats/${id}/completions`,
        { method: 'POST', body: JSON.stringify(rfBody) },
      );
      if (resp.code !== 0)
        return apiError(
          reply,
          400,
          ErrCode.CHAT_COMPLETION_FAILED,
          resp.message ?? 'RAGFlow error',
        );

      return ok(
        {
          answer: resp.data?.answer ?? '',
          citations: resp.data?.reference,
          sessionId: resp.data?.session_id ?? body.data.session_id,
        },
        reply,
      );
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // List messages in a session
  app.get('/api/v1/chats/:chatId/sessions/:sessionId/messages', async (req, reply) => {
    const { chatId, sessionId } = req.params as { chatId: string; sessionId: string };
    try {
      const resp = await rfFetch<{ messages: ChatMessage[] }>(
        `/api/v1/chats/${chatId}/sessions/${sessionId}/messages`,
      );
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return ok(resp.data?.messages ?? [], reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });
}
