/**
 * Team routes — /api/v1/team/members
 * Stub: RAGFlow manages team members via its own user management.
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

export async function teamRoutes(app: FastifyInstance) {
  app.get('/api/v1/team/members', async (req, reply) => {
    // RAGFlow lists users via its own endpoint
    const resp = await rfFetch<{ users: unknown[] }>('/api/v1/users');
    if (resp.code !== 0)
      return apiError(reply, 400, ErrCode.INTERNAL_ERROR, resp.message ?? 'RAGFlow error');
    return ok(resp.data?.users ?? [], reply);
  });

  app.post('/api/v1/team/invite', async (req, reply) => {
    return apiError(
      reply,
      501,
      ErrCode.INTERNAL_ERROR,
      'Team invite not yet implemented: RAGFlow does not expose invite API; use RAGFlow web UI',
    );
  });
}
