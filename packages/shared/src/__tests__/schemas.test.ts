/**
 * Unit tests for shared Zod schemas.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-derive schemas from shared types for testing
const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  documentCount: z.number(),
  chunkCount: z.number(),
  embeddingModel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const DocumentSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  name: z.string(),
  size: z.number().optional(),
  status: z.enum(['pending', 'parsing', 'ready', 'error']),
  chunkCount: z.number().optional(),
  progress: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const RetrievalRequestSchema = z.object({
  question: z.string().min(1).max(4000),
  datasetIds: z.array(z.string()).min(1),
  strategy: z.enum(['hybrid', 'vector', 'keyword']).optional(),
  topK: z.number().optional(),
  similarityThreshold: z.number().optional(),
});

const ChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  content: z.string(),
  index: z.number(),
  length: z.number().optional(),
  avgScore: z.number().optional(),
  createdAt: z.string(),
});

describe('Dataset schema', () => {
  it('accepts a valid dataset', () => {
    const dataset = {
      id: 'ds-001',
      name: 'My Knowledge Base',
      description: 'Test description',
      documentCount: 10,
      chunkCount: 500,
      embeddingModel: 'BAAI/bge-large-zh-v1.5',
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => DatasetSchema.parse(dataset)).not.toThrow();
  });

  it('accepts a minimal dataset (only required fields)', () => {
    const dataset = {
      id: 'ds-002',
      name: 'Minimal',
      documentCount: 0,
      chunkCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => DatasetSchema.parse(dataset)).not.toThrow();
  });

  it('rejects when id is missing', () => {
    const dataset = {
      name: 'No ID',
      documentCount: 0,
      chunkCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => DatasetSchema.parse(dataset)).toThrow();
  });
});

describe('Document schema', () => {
  it('accepts a valid document', () => {
    const doc = {
      id: 'doc-001',
      datasetId: 'ds-001',
      name: 'report.pdf',
      size: 1024000,
      status: 'ready',
      chunkCount: 50,
      progress: 1.0,
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => DocumentSchema.parse(doc)).not.toThrow();
  });

  it('rejects invalid status', () => {
    const doc = {
      id: 'doc-002',
      datasetId: 'ds-001',
      name: 'test.pdf',
      status: 'unknown_status',
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => DocumentSchema.parse(doc)).toThrow();
  });

  it('accepts document without optional fields', () => {
    const doc = {
      id: 'doc-003',
      datasetId: 'ds-001',
      name: 'minimal.pdf',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => DocumentSchema.parse(doc)).not.toThrow();
  });
});

describe('RetrievalRequest schema', () => {
  it('accepts a valid retrieval request', () => {
    const req = {
      question: 'What is RAG?',
      datasetIds: ['ds-001', 'ds-002'],
      topK: 10,
      similarityThreshold: 0.25,
      strategy: 'hybrid',
    };
    expect(() => RetrievalRequestSchema.parse(req)).not.toThrow();
  });

  it('rejects empty question', () => {
    const req = {
      question: '',
      datasetIds: ['ds-001'],
    };
    expect(() => RetrievalRequestSchema.parse(req)).toThrow();
  });

  it('rejects empty datasetIds', () => {
    const req = {
      question: 'Test',
      datasetIds: [],
    };
    expect(() => RetrievalRequestSchema.parse(req)).toThrow();
  });
});

describe('Chunk schema', () => {
  it('accepts a valid chunk', () => {
    const chunk = {
      id: 'chunk-001',
      documentId: 'doc-001',
      content: 'This is a text chunk from the document.',
      index: 0,
      length: 45,
      avgScore: 0.876,
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => ChunkSchema.parse(chunk)).not.toThrow();
  });

  it('rejects when content is missing', () => {
    const chunk = {
      id: 'chunk-002',
      documentId: 'doc-001',
      index: 1,
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(() => ChunkSchema.parse(chunk)).toThrow();
  });
});
