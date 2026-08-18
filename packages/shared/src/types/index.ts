/**
 * Core domain types for Phloem.
 * These mirror the OpenAPI specification (openapi.yaml) at the repo root.
 */

// ── Auth ──

export type UserRole = 'owner' | 'admin' | 'member';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

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

/** Retrieval strategy: hybrid blends vector + keyword search. */
export type RetrievalStrategy = 'hybrid' | 'vector' | 'keyword';

export interface RetrievalRequest {
  question: string;
  datasetIds: string[];
  strategy?: RetrievalStrategy;
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

// ── LLM Provider (F8.1) ──

export type ProviderType = 'openai' | 'openai_compatible' | 'anthropic' | 'gemini' | '自定义';

export interface LLMProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel?: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProviderTestResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  selectedModel?: string;
}

// ── Chat / 问答 (F2.2, F2.4) ──

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: RetrievalChunk[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  datasetIds: string[];
  messageCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatRequest {
  question: string;
  datasetIds: string[];
  sessionId?: string;
  model?: string;
}

export interface ChatStreamEvent {
  type: 'delta' | 'done' | 'error';
  content?: string;
  citations?: RetrievalChunk[];
  sessionId?: string;
}

// ── Chunk / 文档详情 (F1.4, F1.5, F1.6) ──

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  index: number; // 显示序号
  length?: number; // 字符数
  avgScore?: number; // 平均相似度分
  createdAt: string;
}

export interface ChunkUpdate {
  content?: string;
}

export interface ChunkRebuildOptions {
  chunkMethod?: 'naive' | 'paper' | 'book' | 'laws';
  chunkSize?: number;
  delimiter?: string;
}

// ── Pagination ──

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
