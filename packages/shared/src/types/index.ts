/**
 * Core domain types for Phloem.
 * These mirror the OpenAPI specification (openapi.yaml) at the repo root.
 */

// ── Health ──

export type ServiceStatus = 'ok' | 'degraded' | 'error';
export type AdapterType = 'mock' | 'ragflow';

export interface HealthStatus {
  status: ServiceStatus;
  adapter: AdapterType;
  version: string;
  timestamp?: string;
}

// ── Dataset ──

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  chunkCount: number;
  embeddingModel?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DatasetCreate {
  name: string;
  description?: string;
  embeddingModel?: string;
}

export interface DatasetListResponse {
  data: Dataset[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Document ──

export type DocumentStatus = 'pending' | 'parsing' | 'ready' | 'error';

export interface Document {
  id: string;
  datasetId: string;
  name: string;
  size?: number;
  status: DocumentStatus;
  chunkCount?: number;
  progress?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentListResponse {
  data: Document[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Retrieval ──

export interface RetrievalRequest {
  question: string;
  datasetIds: string[];
  topK?: number;
  similarityThreshold?: number;
}

export interface RetrievalChunk {
  content: string;
  score: number;
  documentId: string;
  documentName?: string;
  datasetId: string;
  pageNumber?: number;
}

export interface RetrievalResponse {
  question: string;
  results: RetrievalChunk[];
}

// ── API Error ──

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ── Pagination ──

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
