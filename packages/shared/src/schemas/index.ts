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

// ── LLM Provider (F8.1) ──

export const providerTypeSchema = z.enum([
  'openai',
  'openai_compatible',
  'anthropic',
  'gemini',
  '自定义',
]);

export const llmProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: providerTypeSchema,
  baseUrl: z.string().url(),
  apiKey: z.string(),
  models: z.array(z.string()),
  defaultModel: z.string().optional(),
  enabled: z.boolean(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const llmProviderCreateSchema = z.object({
  name: z.string().min(1).max(64),
  type: providerTypeSchema.default('openai_compatible'),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  models: z.array(z.string()).min(1),
  defaultModel: z.string().optional(),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const providerTestResultSchema = z.object({
  ok: z.boolean(),
  latencyMs: z.number().optional(),
  error: z.string().optional(),
  selectedModel: z.string().optional(),
});

// ── Chat / 问答 (F2.2, F2.4) ──

export const chatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  citations: z.array(retrievalChunkSchema).optional(),
  createdAt: z.string().datetime(),
});

export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  datasetIds: z.array(z.string()),
  messageCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const chatStreamEventSchema = z.object({
  type: z.enum(['delta', 'done', 'error']),
  content: z.string().optional(),
  citations: z.array(retrievalChunkSchema).optional(),
  sessionId: z.string().optional(),
});

// ── Chunk / 文档详情 (F1.4, F1.5, F1.6) ──

export const chunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  content: z.string(),
  index: z.number().int().nonnegative(),
  length: z.number().int().nonnegative().optional(),
  avgScore: z.number().optional(),
  createdAt: z.string().datetime(),
});

export const chunkUpdateSchema = z.object({
  content: z.string().min(1),
});

export const chunkRebuildOptionsSchema = z.object({
  chunkMethod: z.enum(['naive', 'paper', 'book', 'laws']).optional(),
  chunkSize: z.number().int().min(64).max(2048).optional(),
  delimiter: z.string().optional(),
});

// ── Team (F5.4) ──

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'readonly']),
  status: z.enum(['active', 'invited', 'suspended']),
  avatarUrl: z.string().optional(),
  joinedAt: z.string().datetime(),
});

export const teamInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'readonly']),
});

// ── MCP Server (F4.4) ──

export const mcpServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  transport: z.enum(['sse', 'streamable_http', 'stdio']),
  url: z.string(),
  enabled: z.boolean(),
  status: z.enum(['connected', 'disconnected', 'error']),
  toolCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

// ── Data Source connection (F8.2) ──

export const dataSourceConnectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['s3', 'webdav', 'notion', 'github', 'rss']),
  endpoint: z.string(),
  authType: z.enum(['none', 'token', 'basic']),
  status: z.enum(['connected', 'error', 'disabled']),
  documentCount: z.number().int().nonnegative(),
  lastSyncAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

// ── Chat channel (F8.3) ──

export const chatChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['webchat', 'wechat', 'dingtalk', 'feishu', 'api']),
  webhookUrl: z.string().optional(),
  boundDatasetIds: z.array(z.string()),
  enabled: z.boolean(),
  messageCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
