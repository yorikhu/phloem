/**
 * RAGFlow Adapter — implements IKnowledgeAdapter using the RAGFlow HTTP API.
 *
 * API Base: http://<ragflow-host>:9380/api/v1
 * Auth:     Bearer <api_key>  (RAGFlow Settings → API Keys)
 *
 * Error codes (from RAGFlow api_utils):
 *   0  Success
 *   400 Bad Request
 *   401 Unauthorized
 *   403 Forbidden
 *   404 Not Found
 *   500 Internal Server Error
 *   101 Argument Error
 *   102 Data Error
 */

import type {
  Dataset,
  DatasetCreate,
  Document,
  RetrievalRequest,
  RetrievalResponse,
} from '@phloem/shared';

import type { IKnowledgeAdapter } from './types.js';

// ── RAGFlow raw response shapes ──────────────────────────────────────────────

interface RAGFlowResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface RAGFlowDataset {
  id: string;
  name: string;
  description?: string;
  document_count?: number;
  chunk_count?: number;
  create_time?: string;
  update_time?: string;
  // parser_config fields may appear
  embedding_model?: string;
}

interface RAGFlowDocument {
  id: string;
  dataset_id?: string;
  name: string;
  size?: number;
  type?: string;
  source_type?: string;
  status?: string; // 0=pending, 1=parsing, 2=completed, 3=error
  progress?: number; // 0-100
  chunk_count?: number;
  create_time?: string;
  update_time?: string;
}

interface RAGFlowRetrievalResult {
  id?: string;
  content?: string;
  document_id?: string;
  document_name?: string;
  dataset_id?: string;
  score?: number;
  positions?: number[][];
  create_time?: string;
}

interface RAGFlowRetrievalResp {
  chunks?: RAGFlowRetrievalResult[];
  // also: { "0": [...], "1": [...] } style when multiple datasets
  [key: string]: unknown;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Map RAGFlow document status strings to our DocumentStatus union.
 * RAGFlow status: 0=pending, 1=parsing, 2=completed, 3=error
 */
function mapDocStatus(s?: string | number): Document['status'] {
  if (s === 0 || s === '0' || s === 'pending') return 'pending';
  if (s === 1 || s === '1' || s === 'parsing') return 'parsing';
  if (s === 2 || s === '2' || s === 'completed' || s === 'ready') return 'ready';
  if (s === 3 || s === '3' || s === 'error') return 'error';
  return 'pending';
}

/**
 * Normalise a RAGFlow dataset to our shared Dataset type.
 */
function normaliseDataset(r: RAGFlowDataset): Dataset {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    documentCount: r.document_count ?? 0,
    chunkCount: r.chunk_count ?? 0,
    ...(r.embedding_model && { embeddingModel: r.embedding_model }),
    createdAt: r.create_time ?? new Date().toISOString(),
    ...(r.update_time && { updatedAt: r.update_time }),
  };
}

/**
 * Normalise a RAGFlow document to our shared Document type.
 */
function normaliseDocument(r: RAGFlowDocument, datasetId: string): Document {
  return {
    id: r.id,
    datasetId: r.dataset_id ?? datasetId,
    name: r.name,
    size: r.size ?? 0,
    status: mapDocStatus(r.status),
    ...(r.chunk_count !== undefined && { chunkCount: r.chunk_count }),
    ...(r.progress !== undefined && { progress: r.progress }),
    createdAt: r.create_time ?? new Date().toISOString(),
    ...(r.update_time && { updatedAt: r.update_time }),
  };
}

/**
 * Check RAGFlow response code; throws if not 0.
 */
function assertOk<T>(resp: RAGFlowResponse<T>): void {
  if (resp.code !== 0) {
    throw new Error(`RAGFlow API error ${resp.code}: ${resp.message ?? 'unknown'}`);
  }
}

// ── RAGFlowAdapter ───────────────────────────────────────────────────────────

export class RAGFlowAdapter implements IKnowledgeAdapter {
  readonly type = 'ragflow' as const;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(opts: { baseUrl?: string; apiKey?: string; timeout?: number } = {}) {
    this.baseUrl = (
      opts.baseUrl ??
      process.env.PHLOEM_RAGFLOW_URL ??
      'http://localhost:9380'
    ).replace(/\/$/, '');
    this.apiKey = opts.apiKey ?? process.env.PHLOEM_RAGFLOW_API_KEY ?? '';
    this.timeout = opts.timeout ?? 30_000;
    if (!this.apiKey) {
      throw new Error('PHLOEM_RAGFLOW_API_KEY is required for RAGFlowAdapter');
    }
  }

  private async rfFetch<T>(path: string, init: RequestInit = {}): Promise<RAGFlowResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string>),
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`RAGFlow HTTP ${response.status} at ${path}`);
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return { code: 0 };
    }

    const text = await response.text();
    if (!text) return { code: 0 };

    try {
      return JSON.parse(text) as RAGFlowResponse<T>;
    } catch {
      throw new Error(`Invalid JSON from RAGFlow at ${path}: ${text.slice(0, 200)}`);
    }
  }

  // ── Datasets ──────────────────────────────────────────────────────────────

  async listDatasets(page = 1, pageSize = 20): Promise<{ data: Dataset[]; total: number }> {
    const resp = await this.rfFetch<RAGFlowDataset[]>(
      `/api/v1/datasets?page=${page}&page_size=${pageSize}`,
    );
    assertOk(resp);
    const data = resp.data ?? [];
    return {
      data: data.map(normaliseDataset),
      // RAGFlow doesn't always return total; use data length as proxy
      total: data.length,
    };
  }

  async getDataset(id: string): Promise<Dataset | null> {
    const resp = await this.rfFetch<RAGFlowDataset>(`/api/v1/datasets/${id}`);
    if (resp.code === 404) return null;
    assertOk(resp);
    return normaliseDataset(resp.data as RAGFlowDataset);
  }

  async createDataset(input: DatasetCreate): Promise<Dataset> {
    const body: Record<string, unknown> = {
      name: input.name,
      description: input.description ?? '',
    };
    if (input.embeddingModel) {
      body.embedding_model = input.embeddingModel;
    }
    // Default parser config — naive chunk method
    body.parser_config = {
      chunk_token_num: 128,
      layout_recognize: true,
      html4excel: false,
      delimeter: '\\n!?;。！？；',
      chunk_method: 'naive',
    };

    const resp = await this.rfFetch<RAGFlowDataset>('/api/v1/datasets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    assertOk(resp);
    return normaliseDataset(resp.data as RAGFlowDataset);
  }

  async deleteDataset(id: string): Promise<void> {
    const resp = await this.rfFetch<void>(`/api/v1/datasets/${id}`, {
      method: 'DELETE',
    });
    assertOk(resp);
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  async listDocuments(
    datasetId: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ data: Document[]; total: number }> {
    const resp = await this.rfFetch<RAGFlowDocument[]>(
      `/api/v1/datasets/${datasetId}/documents?page=${page}&page_size=${pageSize}`,
    );
    assertOk(resp);
    const data = resp.data ?? [];
    return {
      data: data.map((d) => normaliseDocument(d, datasetId)),
      total: data.length,
    };
  }

  async uploadDocument(
    datasetId: string,
    file: File | Buffer,
    filename: string,
  ): Promise<Document> {
    // Build FormData manually using native fetch
    const form = new FormData();
    form.append('file', file as unknown as Blob, filename);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout * 3); // upload needs more time

    const response = await fetch(`${this.baseUrl}/api/v1/datasets/${datasetId}/documents`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        // Do NOT set Content-Type: multipart/form-data — browser sets it with boundary
      },
      body: form,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`RAGFlow upload HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text) throw new Error('Empty response from RAGFlow upload');

    const resp = JSON.parse(text) as RAGFlowResponse<RAGFlowDocument>;
    assertOk(resp);
    return normaliseDocument(resp.data as RAGFlowDocument, datasetId);
  }

  async deleteDocument(datasetId: string, documentId: string): Promise<void> {
    const resp = await this.rfFetch<void>(`/api/v1/datasets/${datasetId}/documents/${documentId}`, {
      method: 'DELETE',
    });
    assertOk(resp);
  }

  // ── Retrieval ─────────────────────────────────────────────────────────────

  async retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    const body: Record<string, unknown> = {
      question: request.question,
      dataset_ids: request.datasetIds,
      top: request.topK ?? 10,
    };
    if (request.strategy) {
      body.retrieval_strategy = request.strategy;
    }
    if (request.similarityThreshold !== undefined) {
      body.similarity_threshold = request.similarityThreshold;
    }

    const resp = await this.rfFetch<RAGFlowRetrievalResp>('/api/v1/retrieval', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    assertOk(resp);

    const raw = resp.data ?? {};

    // RAGFlow returns { "0": [...], "1": [...] } keyed by dataset index,
    // or { chunks: [...] } in newer versions
    let chunks: RAGFlowRetrievalResult[] = [];

    if (Array.isArray(raw)) {
      chunks = raw;
    } else if (Array.isArray(raw.chunks)) {
      chunks = raw.chunks as RAGFlowRetrievalResult[];
    } else {
      // Flatten the { "0": [...], "1": [...] } shape
      chunks = Object.values(raw).flatMap((v) =>
        Array.isArray(v) ? (v as RAGFlowRetrievalResult[]) : [],
      );
    }

    return {
      question: request.question,
      results: chunks.map((c) => ({
        content: c.content ?? '',
        score: c.score ?? 0,
        documentId: c.document_id ?? '',
        documentName: c.document_name ?? '',
        datasetId: c.dataset_id ?? '',
      })),
    };
  }

  // ── Health ───────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'error'; detail?: string }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      clearTimeout(timer);
      if (response.ok) return { status: 'ok' };
      return { status: 'error', detail: `HTTP ${response.status}` };
    } catch (err) {
      return { status: 'error', detail: String(err) };
    }
  }
}
