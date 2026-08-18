/**
 * Mock data for MSW handlers — simulates a populated knowledge base.
 */

import type { Dataset, Document, RetrievalChunk, CurrentUser } from '@phloem/shared';

const now = new Date().toISOString();
const dayAgo = new Date(Date.now() - 86400000).toISOString();
const weekAgo = new Date(Date.now() - 604800000).toISOString();

export const mockCurrentUser: CurrentUser = {
  id: 'user-001',
  name: 'You You',
  email: 'you@phloem.dev',
  role: 'owner',
};

export const mockDatasets: Dataset[] = [
  {
    id: 'ds-001',
    name: 'Product Documentation',
    description: 'User guides, API references, and technical specs',
    documentCount: 12,
    chunkCount: 342,
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    createdAt: weekAgo,
    updatedAt: dayAgo,
  },
  {
    id: 'ds-002',
    name: 'Internal Wiki',
    description: 'Team processes, meeting notes, and decisions',
    documentCount: 8,
    chunkCount: 156,
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    createdAt: weekAgo,
    updatedAt: now,
  },
  {
    id: 'ds-003',
    name: 'Customer Support KB',
    description: 'FAQ, troubleshooting guides, and ticket resolutions',
    documentCount: 5,
    chunkCount: 89,
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    createdAt: dayAgo,
    updatedAt: dayAgo,
  },
];

export const mockDocuments: Record<string, Document[]> = {
  'ds-001': [
    {
      id: 'doc-001',
      datasetId: 'ds-001',
      name: 'API Reference v2.pdf',
      size: 2456789,
      status: 'ready',
      chunkCount: 48,
      progress: 1,
      createdAt: weekAgo,
      updatedAt: dayAgo,
    },
    {
      id: 'doc-002',
      datasetId: 'ds-001',
      name: 'Getting Started Guide.docx',
      size: 892341,
      status: 'ready',
      chunkCount: 22,
      progress: 1,
      createdAt: weekAgo,
      updatedAt: weekAgo,
    },
    {
      id: 'doc-003',
      datasetId: 'ds-001',
      name: 'Architecture Overview.pdf',
      size: 5678123,
      status: 'parsing',
      chunkCount: 0,
      progress: 0.65,
      createdAt: now,
    },
  ],
  'ds-002': [
    {
      id: 'doc-004',
      datasetId: 'ds-002',
      name: 'Q4 Planning Notes.md',
      size: 23456,
      status: 'ready',
      chunkCount: 15,
      progress: 1,
      createdAt: dayAgo,
      updatedAt: dayAgo,
    },
  ],
  'ds-003': [],
};

export const mockRetrievalResults: RetrievalChunk[] = [
  {
    content:
      "Phloem is an open-source, self-hosted knowledge base platform built on top of RAGFlow's deep document parsing and hybrid retrieval engine.",
    score: 0.92,
    documentId: 'doc-001',
    documentName: 'API Reference v2.pdf',
    datasetId: 'ds-001',
    pageNumber: 3,
  },
  {
    content:
      'The API gateway wraps RAGFlow with a typed Node.js interface, providing dataset CRUD, document management, and retrieval endpoints.',
    score: 0.87,
    documentId: 'doc-002',
    documentName: 'Getting Started Guide.docx',
    datasetId: 'ds-001',
    pageNumber: 1,
  },
  {
    content:
      'MCP Server exposes knowledge base capabilities as MCP tools, enabling Claude Desktop and Cursor to retrieve grounded knowledge directly.',
    score: 0.81,
    documentId: 'doc-001',
    documentName: 'API Reference v2.pdf',
    datasetId: 'ds-001',
    pageNumber: 12,
  },
];
