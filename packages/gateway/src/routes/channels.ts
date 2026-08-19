/**
 * Chat Channel routes — /api/v1/channels
 * Stub: multi-channel binding (webchat, wechat, dingtalk, feishu)
 */

import type { FastifyInstance } from 'fastify';
import { ok, ErrCode, apiError } from './_lib/response.js';

export async function channelsRoutes(_app: FastifyInstance) {
  _app.get('/api/v1/channels', async (_req, reply) => {
    return ok([], reply);
  });

  _app.post('/api/v1/channels', async (req, reply) => {
    return apiError(
      reply,
      501,
      ErrCode.INTERNAL_ERROR,
      'Multi-channel binding not yet implemented',
    );
  });

  _app.patch('/api/v1/channels/:id', async (req, reply) => {
    return apiError(
      reply,
      501,
      ErrCode.INTERNAL_ERROR,
      'Multi-channel binding not yet implemented',
    );
  });
}
