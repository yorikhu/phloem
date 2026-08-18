/**
 * Knowledge adapter interface — the contract between the gateway and any backend.
 * Implementations: MockAdapter (no backend), RAGFlowAdapter (real RAGFlow).
 */

import type {
  Dataset,
  DatasetCreate,
  Document,
  RetrievalRequest,
  RetrievalResponse,
} from '@phloem/shared';

export interface IKnowledgeAdapter {
  readonly type: 'mock' | 'ragflow';

  // Datasets
  listDatasets(page?: number, pageSize?: number): Promise<{ data: Dataset[]; total: number }>;
  getDataset(id: string): Promise<Dataset | null>;
  createDataset(input: DatasetCreate): Promise<Dataset>;
  deleteDataset(id: string): Promise<void>;

  // Documents
  listDocuments(
    datasetId: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: Document[]; total: number }>;
  uploadDocument(datasetId: string, file: File | Buffer, filename: string): Promise<Document>;
  deleteDocument(datasetId: string, documentId: string): Promise<void>;

  // Retrieval
  retrieve(request: RetrievalRequest): Promise<RetrievalResponse>;

  // Health
  healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'error'; detail?: string }>;
}
