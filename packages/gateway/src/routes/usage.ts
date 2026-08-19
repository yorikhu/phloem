/**
 * Usage stats routes — /api/v1/usage
 * Stub: usage / quota tracking
 */

import type { FastifyInstance } from 'fastify';
import { ok } from './_lib/response.js';

export async function usageRoutes(_app: FastifyInstance) {
  _app.get('/api/v1/usage', async (_req, reply) => {
    // Usage tracking requires RAGFlow database access; not exposed via REST in v0.26
    return ok(
      {
        documentsUploaded: 0,
        chunksCreated: 0,
        apiCalls: 0,
        quota: null,
        period: 'month',
      },
      reply,
    );
  });
}
