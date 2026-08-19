/**
 * API Keys routes — /api/v1/apikeys
 *
 * GET    /          — list API keys
 * POST   /          — create API key (delegates to RAGFlow)
 * DELETE /:key_id   — revoke API key
 */

import type { FastifyInstance } from 'fastify';
import { ok, created, noContent, ErrCode, apiError } from './_lib/response.js';

async function rfFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ code: number; data?: T; message?: string }> {
  const baseUrl = (process.env.PHLOEM_RAGFLOW_URL ?? 'http://localhost:9380').replace(/\/$/, '');
  const apiKey = process.env.PHLOEM_RAGFLOW_API_KEY ?? '';
  const resp = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    },
  });
  const text = await resp.text();
  if (!text) return { code: 0 };
  return JSON.parse(text) as { code: number; data?: T; message?: string };
}

export async function apikeysRoutes(app: FastifyInstance) {
  app.get('/api/v1/apikeys', async (req, reply) => {
    try {
      // RAGFlow uses /api/v1/api_keys
      const resp = await rfFetch<{ api_keys: unknown[] }>('/api/v1/api_keys');
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return ok(resp.data?.api_keys ?? [], reply);
    } catch (err) {
      return apiError(reply, 500, ErrCode.INTERNAL_ERROR, String(err));
    }
  });

  app.post('/api/v1/apikeys', async (req, reply) => {
    const body = (await import('zod')).z
      .object({
        name: (await import('zod')).z.string().min(1).max(255),
      })
      .safeParse(req.body);
    if (!body.success) return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);

    try {
      const resp = await rfFetch<{ api_key_id: string; api_key: string; name: string }>(
        '/api/v1/api_keys',
        { method: 'POST', body: JSON.stringify({ name: body.data.name }) },
      );
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return created(resp.data, reply);
    } catch (err) {
      return apiError(reply, 500, ErrCode.INTERNAL_ERROR, String(err));
    }
  });

  app.delete('/api/v1/apikeys/:keyId', async (req, reply) => {
    const { keyId } = req.params as { keyId: string };
    try {
      const resp = await rfFetch<void>(`/api/v1/api_keys/${keyId}`, { method: 'DELETE' });
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return noContent(reply);
    } catch (err) {
      return apiError(reply, 500, ErrCode.INTERNAL_ERROR, String(err));
    }
  });
}
