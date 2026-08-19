/**
 * LLM Provider routes — /api/v1/providers
 * Stub: RAGFlow v0.26 does not expose provider management via REST API.
 */

import type { FastifyInstance } from 'fastify';
import { ok, ErrCode, apiError } from './_lib/response.js';

export async function providersRoutes(_app: FastifyInstance) {
  // RAGFlow v0.26 doesn't expose a public provider management API.
  // Models are configured in ragflow.yml / Settings UI.
  _app.get('/api/v1/providers', async (_req, reply) => {
    return ok([], reply);
  });

  _app.post('/api/v1/providers/test', async (req, reply) => {
    return apiError(
      reply,
      501,
      ErrCode.INTERNAL_ERROR,
      'Provider test not yet implemented: RAGFlow does not expose provider management API',
    );
  });
}
