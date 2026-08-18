/**
 * MockAdapter — returns canned data for development without RAGFlow backend.
 */

import type { Dataset, DatasetCreate, RetrievalRequest } from '@phloem/shared';
import type { IKnowledgeAdapter } from './types.js';

export class MockAdapter implements IKnowledgeAdapter {
  readonly type = 'mock' as const;

  async listDatasets() {
    return {
      data: [
        {
          id: 'mock-ds-1',
          name: 'Product Documentation',
          description: 'Mock dataset for development',
          documentCount: 3,
          chunkCount: 42,
          embeddingModel: 'BAAI/bge-large-zh-v1.5',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    };
  }

  async getDataset(id: string) {
    return {
      id,
      name: 'Mock Dataset',
      documentCount: 0,
      chunkCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  async createDataset(input: DatasetCreate) {
    const result: Dataset = {
      id: `mock-ds-${Date.now()}`,
      name: input.name,
      documentCount: 0,
      chunkCount: 0,
      embeddingModel: input.embeddingModel ?? 'BAAI/bge-large-zh-v1.5',
      createdAt: new Date().toISOString(),
    };
    if (input.description !== undefined) {
      result.description = input.description;
    }
    return result;
  }

  async deleteDataset() {
    // no-op
  }

  async listDocuments() {
    return { data: [], total: 0 };
  }

  async uploadDocument(datasetId: string, _file: unknown, filename: string) {
    return {
      id: `mock-doc-${Date.now()}`,
      datasetId,
      name: filename,
      status: 'ready' as const,
      createdAt: new Date().toISOString(),
    };
  }

  async deleteDocument() {
    // no-op
  }

  async retrieve(request: RetrievalRequest) {
    return {
      question: request.question,
      results: [
        {
          content: 'This is a mock retrieval result for development purposes.',
          score: 0.95,
          documentId: 'mock-doc-1',
          documentName: 'mock-document.pdf',
          datasetId: request.datasetIds[0] ?? 'mock-ds-1',
        },
      ],
    };
  }

  async healthCheck() {
    return { status: 'ok' as const, detail: 'Mock adapter is always healthy' };
  }
}
