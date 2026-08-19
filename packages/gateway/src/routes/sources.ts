/**
 * Data Source routes — /api/v1/sources
 * Stub: sync from external sources (S3, GitHub, Notion etc.)
 */

import type { FastifyInstance } from 'fastify';
import { ok, ErrCode, apiError } from './_lib/response.js';

export async function sourcesRoutes(_app: FastifyInstance) {
  _app.get('/api/v1/sources', async (_req, reply) => {
    // Data source sync is not yet exposed via RAGFlow REST API
    return ok([], reply);
  });

  _app.post('/api/v1/sources', async (req, reply) => {
    return apiError(reply, 501, ErrCode.INTERNAL_ERROR, 'Data source sync not yet implemented');
  });

  _app.post('/api/v1/sources/:id/sync', async (req, reply) => {
    return apiError(reply, 501, ErrCode.INTERNAL_ERROR, 'Data source sync not yet implemented');
  });
}
