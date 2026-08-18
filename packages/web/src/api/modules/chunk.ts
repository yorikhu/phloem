/**
 * Chunk API (F1.4, F1.5, F1.6)
 */
import { request, type Page, type PageParams, pageQuery } from '../http.js';
import type { Chunk, ChunkUpdate, ChunkRebuildOptions } from '@phloem/shared';

export const chunks = {
  list(documentId: string, params?: PageParams) {
    return request<Page<Chunk>>(`/documents/${documentId}/chunks${pageQuery(params)}`);
  },

  update(documentId: string, chunkId: string, body: ChunkUpdate) {
    return request<Chunk>(`/documents/${documentId}/chunks/${chunkId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  remove(documentId: string, chunkId: string) {
    return request<void>(`/documents/${documentId}/chunks/${chunkId}`, {
      method: 'DELETE',
    });
  },

  rebuild(documentId: string, options?: ChunkRebuildOptions) {
    return request<{ status: string; message: string }>(`/documents/${documentId}/reparse`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    });
  },
};
