/**
 * Unified API client — auto-switches between mock (MSW) and real backend.
 *
 * In dev mode with VITE_API_MODE=mock, MSW intercepts all fetch calls.
 * In real mode, requests proxy to the gateway at /api/v1.
 */

import type {
  Dataset,
  DatasetCreate,
  Document,
  RetrievalRequest,
  RetrievalResponse,
  HealthStatus,
} from '@phloem/shared';

const API_BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Health
  health: () => request<HealthStatus>('/health'),

  // Datasets
  listDatasets: (page = 1, pageSize = 20) =>
    request<{ data: Dataset[]; total: number; page: number; pageSize: number }>(
      `/datasets?page=${page}&pageSize=${pageSize}`,
    ),

  getDataset: (id: string) => request<Dataset>(`/datasets/${id}`),

  createDataset: (input: DatasetCreate) =>
    request<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteDataset: (id: string) => request<void>(`/datasets/${id}`, { method: 'DELETE' }),

  // Documents
  listDocuments: (datasetId: string, page = 1, pageSize = 20) =>
    request<{ data: Document[]; total: number; page: number; pageSize: number }>(
      `/datasets/${datasetId}/documents?page=${page}&pageSize=${pageSize}`,
    ),

  uploadDocument: (datasetId: string, file: File) => {
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

  deleteDocument: (datasetId: string, documentId: string) =>
    request<void>(`/datasets/${datasetId}/documents/${documentId}`, {
      method: 'DELETE',
    }),

  // Retrieval
  retrieve: (req: RetrievalRequest) =>
    request<RetrievalResponse>('/retrieval', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};
