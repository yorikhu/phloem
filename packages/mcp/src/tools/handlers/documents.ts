/**
 * Document tool handlers — list_documents, upload_document, get_chunk
 */

import { api } from '../_lib/api.js';
import type { DocumentListResponse } from '@phloem/shared';

// ── list_documents ─────────────────────────────────────────────────────────

interface ListDocumentsArgs {
  dataset_id: string;
  page?: number;
  page_size?: number;
}

export async function handleListDocuments(args: unknown): Promise<string> {
  const params = args as ListDocumentsArgs;
  if (!params.dataset_id) throw new Error('dataset_id is required');

  const result = await api.get<DocumentListResponse>(
    `/api/v1/datasets/${params.dataset_id}/documents?page=${params.page ?? 1}&page_size=${params.page_size ?? 20}`,
  );

  if (!result.data.length) {
    return 'No documents found in this dataset.';
  }

  const lines = result.data.map(
    (d) =>
      `ID: ${d.id} | Name: ${d.name} | Status: ${d.status} | Chunks: ${d.chunkCount ?? '?'} | Size: ${d.size ?? '?'}`,
  );

  return `Documents (total: ${result.total}):\n\n${lines.join('\n')}`;
}

// ── get_chunk ─────────────────────────────────────────────────────────────

interface GetChunkArgs {
  dataset_id: string;
  document_id: string;
  page?: number;
  page_size?: number;
}

export async function handleGetChunk(args: unknown): Promise<string> {
  const params = args as GetChunkArgs;
  if (!params.dataset_id || !params.document_id) {
    throw new Error('dataset_id and document_id are required');
  }

  const chunks = await api.get<{ chunks: unknown[]; total: number }>(
    `/api/v1/datasets/${params.dataset_id}/documents/${params.document_id}/chunks?page=${params.page ?? 1}&page_size=${params.page_size ?? 50}`,
  );

  if (!chunks.chunks?.length) {
    return 'No chunks found.';
  }

  const lines = (chunks.chunks as Array<{ id: string; content: string; index?: number }>).map(
    (c, i) => `[${i + 1}] ID: ${c.id} | Index: ${c.index ?? i + 1}\n${c.content}`,
  );

  return `Chunks (total: ${chunks.total}):\n\n${lines.join('\n\n')}`;
}
