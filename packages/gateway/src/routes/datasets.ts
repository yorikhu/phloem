/**
 * Dataset routes — /api/v1/datasets
 *
 * GET    /              — list datasets
 * POST   /              — create dataset
 * GET    /:id           — get dataset
 * DELETE /:id           — delete dataset
 */

import type { FastifyInstance } from 'fastify';
import type { IKnowledgeAdapter } from '../adapters/index.js';
import { ok, created, noContent, mapError, ErrCode, apiError } from './_lib/response.js';
import { z } from 'zod';
import type { DatasetListResponse } from '@phloem/shared';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  embedding_model: z.string().optional(),
});

export async function datasetsRoutes(app: FastifyInstance, adapter: IKnowledgeAdapter) {
  // ── List ────────────────────────────────────────────────────────────────
  app.get('/api/v1/datasets', async (req, reply) => {
    const query = QuerySchema.safeParse(req.query);
    if (!query.success) {
      return apiError(reply, 400, ErrCode.INVALID_PARAM, query.error.message);
    }

    try {
      const result = await adapter.listDatasets(query.data.page, query.data.page_size);
      const response: DatasetListResponse = {
        data: result.data,
        total: result.total,
        page: query.data.page,
        pageSize: result.data.length,
      };
      return ok(response, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // ── Create ─────────────────────────────────────────────────────────────
  app.post('/api/v1/datasets', async (req, reply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success) {
      return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);
    }

    try {
      const dataset = await adapter.createDataset({
        name: body.data.name,
        ...(body.data.description !== undefined && { description: body.data.description }),
        ...(body.data.embedding_model !== undefined && {
          embeddingModel: body.data.embedding_model,
        }),
      });
      return created(dataset, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // ── Get ─────────────────────────────────────────────────────────────────
  app.get('/api/v1/datasets/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const dataset = await adapter.getDataset(id);
      if (!dataset) {
        return apiError(reply, 404, ErrCode.DATASET_NOT_FOUND, `Dataset ${id} not found`);
      }
      return ok(dataset, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // ── Delete ───────────────────────────────────────────────────────────────
  app.delete('/api/v1/datasets/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await adapter.deleteDataset(id);
      return noContent(reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });
}
