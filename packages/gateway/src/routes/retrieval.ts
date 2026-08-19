/**
 * Retrieval route — POST /api/v1/retrieval
 */

import type { FastifyInstance } from 'fastify';
import type { IKnowledgeAdapter } from '../adapters/index.js';
import { ok, mapError, ErrCode, apiError } from './_lib/response.js';
import { z } from 'zod';

const RetrievalBodySchema = z.object({
  question: z.string().min(1).max(4000),
  dataset_ids: z.array(z.string()).min(1),
  strategy: z.enum(['hybrid', 'vector', 'keyword']).optional(),
  top_k: z.coerce.number().int().min(1).max(100).optional(),
  similarity_threshold: z.number().min(0).max(1).optional(),
});

export async function retrievalRoutes(app: FastifyInstance, adapter: IKnowledgeAdapter) {
  app.post('/api/v1/retrieval', async (req, reply) => {
    const body = RetrievalBodySchema.safeParse(req.body);
    if (!body.success) {
      return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);
    }

    try {
      const req: {
        question: string;
        datasetIds: string[];
        strategy?: 'hybrid' | 'vector' | 'keyword';
        topK?: number;
        similarityThreshold?: number;
      } = {
        question: body.data.question,
        datasetIds: body.data.dataset_ids,
      };
      if (body.data.strategy) req.strategy = body.data.strategy;
      if (body.data.top_k !== undefined) req.topK = body.data.top_k;
      if (body.data.similarity_threshold !== undefined)
        req.similarityThreshold = body.data.similarity_threshold;

      const result = await adapter.retrieve(req);
      return ok(result, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });
}
