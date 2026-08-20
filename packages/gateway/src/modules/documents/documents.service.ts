/**
 * DocumentsService — document/chunk operations across adapter + RAGFlow.
 */

import { Inject, Injectable } from '@nestjs/common';
import { KNOWLEDGE_ADAPTER, RAGFLOW_HTTP } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import { ApiError } from '../../common/api-error.js';
import { ErrCode } from '../../common/error-codes.js';
import type { UpdateChunkDtoType, RebuildChunksDtoType } from './dto/documents.dto.js';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(KNOWLEDGE_ADAPTER) private readonly adapter: IKnowledgeAdapter,
    @Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient,
  ) {}

  list(datasetId: string, page: number, pageSize: number) {
    return this.adapter.listDocuments(datasetId, page, pageSize).then((r) => ({
      data: r.data,
      total: r.total,
      page,
      pageSize: r.data.length,
    }));
  }

  async get(datasetId: string, documentId: string) {
    const result = await this.adapter.listDocuments(datasetId, 1, 100);
    const doc = result.data.find((d) => d.id === documentId);
    if (!doc) {
      throw ApiError.notFound(`Document ${documentId} not found`, ErrCode.DOCUMENT_NOT_FOUND);
    }
    return doc;
  }

  upload(datasetId: string, file: Buffer, filename: string) {
    return this.adapter.uploadDocument(datasetId, file, filename);
  }

  remove(datasetId: string, documentId: string) {
    return this.adapter.deleteDocument(datasetId, documentId);
  }

  listChunks(datasetId: string, documentId: string, page: number, pageSize: number) {
    return this.ragflow.call<{ chunks: unknown[]; total: number }>(
      `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks?page=${page}&page_size=${pageSize}`,
    );
  }

  updateChunk(datasetId: string, documentId: string, chunkId: string, body: UpdateChunkDtoType) {
    return this.ragflow.call<unknown>(
      `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  }

  rebuildChunks(datasetId: string, documentId: string, body: RebuildChunksDtoType) {
    return this.ragflow
      .call<unknown>(`/api/v1/datasets/${datasetId}/documents/${documentId}/chunks`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      .then(() => ({ status: 'triggered' as const }));
  }
}
