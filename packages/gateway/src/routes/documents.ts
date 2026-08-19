/**
 * Document routes — /api/v1/datasets/:datasetId/documents
 *
 * GET    /                          — list documents in a dataset
 * POST   /                          — upload document to a dataset
 * GET    /:documentId               — get document
 * DELETE /:documentId               — delete document
 */

import type { FastifyInstance } from 'fastify';
import type { IKnowledgeAdapter } from '../adapters/index.js';
import { ok, created, noContent, mapError, ErrCode, apiError } from './_lib/response.js';
import { z } from 'zod';
import type { DocumentListResponse } from '@phloem/shared';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Chunk routes — /api/v1/datasets/:datasetId/documents/:documentId/chunks
export async function chunksRoutes(app: FastifyInstance) {
  const ChunkSchema = z.object({
    content: z.string().optional(),
  });

  app.get('/api/v1/datasets/:datasetId/documents/:documentId/chunks', async (req, reply) => {
    const { datasetId, documentId } = req.params as {
      datasetId: string;
      documentId: string;
    };
    const query = QuerySchema.safeParse(req.query);
    if (!query.success) {
      return apiError(reply, 400, ErrCode.INVALID_PARAM, query.error.message);
    }

    // RAGFlow chunks list endpoint
    const rfResp = await rfGet<{ chunks: unknown[]; total: number }>(
      app,
      `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks?page=${query.data.page}&page_size=${query.data.page_size}`,
    );
    if (!rfResp.ok) return rfResp.reply;

    return ok({ data: rfResp.data?.chunks ?? [], total: rfResp.data?.total ?? 0 }, reply);
  });

  app.patch(
    '/api/v1/datasets/:datasetId/documents/:documentId/chunks/:chunkId',
    async (req, reply) => {
      const { datasetId, documentId, chunkId } = req.params as {
        datasetId: string;
        documentId: string;
        chunkId: string;
      };
      const body = ChunkSchema.safeParse(req.body);
      if (!body.success) {
        return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);
      }

      const rfResp = await rfPatch(
        app,
        `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`,
        {
          content: body.data.content,
        },
      );
      if (!rfResp.ok) return rfResp.reply;

      return ok(rfResp.data, reply);
    },
  );

  app.post(
    '/api/v1/datasets/:datasetId/documents/:documentId/chunks/rebuild',
    async (req, reply) => {
      const { datasetId, documentId } = req.params as { datasetId: string; documentId: string };
      const body = z
        .object({
          chunk_method: z.enum(['naive', 'paper', 'book', 'laws']).optional(),
          chunk_size: z.number().int().min(1).max(2000).optional(),
          delimiter: z.string().optional(),
        })
        .safeParse(req.body);
      if (!body.success) {
        return apiError(reply, 400, ErrCode.VALIDATION_FAILED, body.error.message);
      }

      // Trigger re-parse via RAGFlow
      const rfResp = await rfPost(
        app,
        `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks`,
        body.data,
      );
      if (!rfResp.ok) return rfResp.reply;

      return ok({ status: 'triggered' }, reply);
    },
  );
}

// ── Shared RAGFlow fetch helpers (lightweight, avoid circular dep on adapter) ─

async function rfGet<T>(
  app: FastifyInstance,
  path: string,
): Promise<{ ok: boolean; data?: T; reply?: ReturnType<typeof apiError> }> {
  try {
    const baseUrl = process.env.PHLOEM_RAGFLOW_URL?.replace(/\/$/, '') ?? 'http://localhost:9380';
    const apiKey = process.env.PHLOEM_RAGFLOW_API_KEY ?? '';
    const resp = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
    if (!resp.ok)
      return {
        ok: false,
        reply: apiError(
          app as unknown as ReturnType<typeof apiError>,
          resp.status,
          ErrCode.INTERNAL_ERROR,
          `RAGFlow HTTP ${resp.status}`,
        ),
      };
    const json = (await resp.json()) as { code: number; data?: T; message?: string };
    if (json.code !== 0)
      return {
        ok: false,
        reply: apiError(
          app as unknown as ReturnType<typeof apiError>,
          400,
          ErrCode.INTERNAL_ERROR,
          json.message ?? 'RAGFlow error',
        ),
      };
    return { ok: true, data: json.data };
  } catch (err) {
    return {
      ok: false,
      reply: apiError(
        app as unknown as ReturnType<typeof apiError>,
        500,
        ErrCode.INTERNAL_ERROR,
        String(err),
      ),
    };
  }
}

async function rfPatch<T>(
  app: FastifyInstance,
  path: string,
  body: unknown,
): Promise<{ ok: boolean; data?: T; reply?: ReturnType<typeof apiError> }> {
  try {
    const baseUrl = process.env.PHLOEM_RAGFLOW_URL?.replace(/\/$/, '') ?? 'http://localhost:9380';
    const apiKey = process.env.PHLOEM_RAGFLOW_API_KEY ?? '';
    const resp = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok)
      return {
        ok: false,
        reply: apiError(
          app as unknown as ReturnType<typeof apiError>,
          resp.status,
          ErrCode.INTERNAL_ERROR,
          `RAGFlow HTTP ${resp.status}`,
        ),
      };
    const json = (await resp.json()) as { code: number; data?: T; message?: string };
    if (json.code !== 0)
      return {
        ok: false,
        reply: apiError(
          app as unknown as ReturnType<typeof apiError>,
          400,
          ErrCode.INTERNAL_ERROR,
          json.message ?? 'RAGFlow error',
        ),
      };
    return { ok: true, data: json.data };
  } catch (err) {
    return {
      ok: false,
      reply: apiError(
        app as unknown as ReturnType<typeof apiError>,
        500,
        ErrCode.INTERNAL_ERROR,
        String(err),
      ),
    };
  }
}

async function rfPost<T>(
  app: FastifyInstance,
  path: string,
  body: unknown,
): Promise<{ ok: boolean; data?: T; reply?: ReturnType<typeof apiError> }> {
  try {
    const baseUrl = process.env.PHLOEM_RAGFLOW_URL?.replace(/\/$/, '') ?? 'http://localhost:9380';
    const apiKey = process.env.PHLOEM_RAGFLOW_API_KEY ?? '';
    const resp = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok)
      return {
        ok: false,
        reply: apiError(
          app as unknown as ReturnType<typeof apiError>,
          resp.status,
          ErrCode.INTERNAL_ERROR,
          `RAGFlow HTTP ${resp.status}`,
        ),
      };
    const json = (await resp.json()) as { code: number; data?: T; message?: string };
    if (json.code !== 0)
      return {
        ok: false,
        reply: apiError(
          app as unknown as ReturnType<typeof apiError>,
          400,
          ErrCode.INTERNAL_ERROR,
          json.message ?? 'RAGFlow error',
        ),
      };
    return { ok: true, data: json.data };
  } catch (err) {
    return {
      ok: false,
      reply: apiError(
        app as unknown as ReturnType<typeof apiError>,
        500,
        ErrCode.INTERNAL_ERROR,
        String(err),
      ),
    };
  }
}

export async function documentsRoutes(app: FastifyInstance, adapter: IKnowledgeAdapter) {
  // ── List ────────────────────────────────────────────────────────────────
  app.get('/api/v1/datasets/:datasetId/documents', async (req, reply) => {
    const { datasetId } = req.params as { datasetId: string };
    const query = QuerySchema.safeParse(req.query);
    if (!query.success) {
      return apiError(reply, 400, ErrCode.INVALID_PARAM, query.error.message);
    }

    try {
      const result = await adapter.listDocuments(datasetId, query.data.page, query.data.page_size);
      const response: DocumentListResponse = {
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

  // ── Upload (multipart/form-data) ─────────────────────────────────────────
  app.post('/api/v1/datasets/:datasetId/documents', async (req, reply) => {
    const { datasetId } = req.params as { datasetId: string };

    try {
      // Fastify auto-parses multipart when using @fastify/multipart
      const data = await req.file();
      if (!data) {
        return apiError(reply, 400, ErrCode.BAD_REQUEST, 'No file uploaded');
      }

      const fileBuffer = Buffer.from(await data.toBuffer());
      const doc = await adapter.uploadDocument(
        datasetId,
        fileBuffer as unknown as File,
        data.filename,
      );
      return created(doc, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // ── Get (by id) — delegated to chunks or documents list ─────────────────
  app.get('/api/v1/datasets/:datasetId/documents/:documentId', async (req, reply) => {
    const { datasetId, documentId } = req.params as { datasetId: string; documentId: string };
    try {
      const result = await adapter.listDocuments(datasetId, 1, 100);
      const doc = result.data.find((d) => d.id === documentId);
      if (!doc) {
        return apiError(reply, 404, ErrCode.DOCUMENT_NOT_FOUND, `Document ${documentId} not found`);
      }
      return ok(doc, reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });

  // ── Delete ───────────────────────────────────────────────────────────────
  app.delete('/api/v1/datasets/:datasetId/documents/:documentId', async (req, reply) => {
    const { datasetId, documentId } = req.params as { datasetId: string; documentId: string };
    try {
      await adapter.deleteDocument(datasetId, documentId);
      return noContent(reply);
    } catch (err) {
      return mapError(err, reply);
    }
  });
}
