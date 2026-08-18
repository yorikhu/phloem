/**
 * Zod schemas for runtime validation.
 * These correspond to the types in ../types and the OpenAPI specification.
 */

import { z } from 'zod';

// ── Auth ──

export const currentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']),
  avatarUrl: z.string().url().optional(),
});

// ── Health ──

export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  adapter: z.enum(['mock', 'ragflow']),
  version: z.string(),
  timestamp: z.string().datetime().optional(),
});

// ── Dataset ──

export const datasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  documentCount: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  embeddingModel: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const datasetCreateSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  embeddingModel: z.string().default('BAAI/bge-large-zh-v1.5'),
});

export const datasetListResponseSchema = z.object({
  data: z.array(datasetSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

// ── Document ──

export const documentStatusSchema = z.enum(['pending', 'parsing', 'ready', 'error']);

export const documentSchema = z.object({
  id: z.string(),
  datasetId: z.string(),
  name: z.string(),
  size: z.number().int().nonnegative().optional(),
  status: documentStatusSchema,
  chunkCount: z.number().int().nonnegative().optional(),
  progress: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const documentListResponseSchema = z.object({
  data: z.array(documentSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

// ── Retrieval ──

export const retrievalRequestSchema = z.object({
  question: z.string().min(1),
  datasetIds: z.array(z.string()).min(1),
  topK: z.number().int().min(1).max(100).default(10),
  similarityThreshold: z.number().min(0).max(1).default(0.2),
});

export const retrievalChunkSchema = z.object({
  content: z.string(),
  score: z.number(),
  documentId: z.string(),
  documentName: z.string().optional(),
  datasetId: z.string(),
  pageNumber: z.number().int().optional(),
});

export const retrievalResponseSchema = z.object({
  question: z.string(),
  results: z.array(retrievalChunkSchema),
});

// ── Error ──

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
