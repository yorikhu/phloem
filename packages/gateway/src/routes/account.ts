/**
 * Account route — GET /api/v1/account
 * Returns the current authenticated user (from RAGFlow JWT session).
 */

import type { FastifyInstance } from 'fastify';
import { ok, ErrCode, apiError } from './_lib/response.js';

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

export async function accountRoutes(app: FastifyInstance) {
  app.get('/api/v1/account', async (req, reply) => {
    // Forward Authorization header to RAGFlow to resolve current user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return apiError(reply, 401, ErrCode.UNAUTHORIZED, 'Missing Authorization header');
    }

    try {
      const resp = await rfFetch<{
        id: string;
        nickname: string;
        email: string;
        role: string;
        avatar_url?: string;
      }>('/api/v1/account', { headers: { Authorization: authHeader } });
      if (resp.code !== 0)
        return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
      return ok(resp.data, reply);
    } catch (err) {
      return apiError(reply, 500, ErrCode.INTERNAL_ERROR, String(err));
    }
  });
}
