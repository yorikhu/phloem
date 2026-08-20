/**
 * Document module — files inside a dataset.
 */

import type { Document } from '@phloem/shared';
import { request, pageQuery, API_BASE, type Page, type PageParams } from '../http.js';

export const documentApi = {
  list: (datasetId: string, params?: PageParams) =>
    request<Page<Document>>(`/datasets/${datasetId}/documents${pageQuery(params)}`),

  upload: (datasetId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/datasets/${datasetId}/documents`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json() as Promise<Document>;
    });
  },

  remove: (datasetId: string, documentId: string) =>
    request<void>(`/datasets/${datasetId}/documents/${documentId}`, {
      method: 'DELETE',
    }),
};
