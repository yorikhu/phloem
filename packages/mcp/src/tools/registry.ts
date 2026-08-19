/**
 * MCP Tool Registry — all tools and their JSON Schema definitions.
 */

import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { handleRetrieve } from './handlers/retrieve.js';
import {
  handleListDatasets,
  handleGetDatasetConfig,
  handleUpdateDatasetConfig,
} from './handlers/datasets.js';
import { handleListDocuments, handleGetChunk } from './handlers/documents.js';
import { handleListMessages } from './handlers/chat.js';

// ── Tool definitions (MCP protocol format) ─────────────────────────────────

export const TOOL_DEFINITIONS = [
  // ── Built-in tools ───────────────────────────────────────────────────
  {
    name: 'retrieve_knowledge',
    description:
      'Search across one or more Phloem knowledge bases using hybrid retrieval (vector + keyword). Returns relevant document chunks with similarity scores.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question or query to search for' },
        dataset_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of dataset IDs to search across',
        },
        top_k: {
          type: 'integer',
          default: 10,
          description: 'Maximum number of results to return (1-100)',
        },
        similarity_threshold: {
          type: 'number',
          description: 'Minimum similarity score threshold (0.0-1.0)',
        },
        strategy: {
          type: 'string',
          enum: ['hybrid', 'vector', 'keyword'],
          description: 'Retrieval strategy: hybrid (default), vector-only, or keyword-only',
        },
      },
      required: ['question', 'dataset_ids'],
    },
  },
  {
    name: 'list_datasets',
    description: 'List all knowledge bases (datasets) available in the current tenant.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1, description: 'Page number' },
        page_size: { type: 'integer', default: 20, description: 'Items per page (max 100)' },
      },
    },
  },
  {
    name: 'list_documents',
    description: 'List all documents within a specific dataset.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', description: 'Dataset ID' },
        page: { type: 'integer', default: 1 },
        page_size: { type: 'integer', default: 20 },
      },
      required: ['dataset_id'],
    },
  },
  {
    name: 'upload_document',
    description:
      'Upload a document to a specific dataset. Returns the document metadata including the parsing status.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', description: 'Target dataset ID' },
        file_content: {
          type: 'string',
          description: 'Base64-encoded file content',
        },
        filename: { type: 'string', description: 'Original filename (e.g. report.pdf)' },
      },
      required: ['dataset_id', 'filename'],
    },
  },
  {
    name: 'get_chunk',
    description: 'Get the content of individual chunks (text slices) from a parsed document.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string' },
        document_id: { type: 'string' },
        page: { type: 'integer', default: 1 },
        page_size: { type: 'integer', default: 50 },
      },
      required: ['dataset_id', 'document_id'],
    },
  },
  // ── Supplementary tools ──────────────────────────────────────────────
  {
    name: 'get_dataset_config',
    description: 'Get the configuration details of a specific dataset.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string' },
      },
      required: ['dataset_id'],
    },
  },
  {
    name: 'update_dataset_config',
    description: 'Update the name, description, or embedding model of a dataset.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        embedding_model: { type: 'string' },
      },
      required: ['dataset_id'],
    },
  },
  {
    name: 'list_messages',
    description: 'List all messages in a chat session, useful for continuing a conversation.',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string' },
        session_id: { type: 'string' },
        page: { type: 'integer', default: 1 },
        page_size: { type: 'integer', default: 50 },
      },
      required: ['chat_id', 'session_id'],
    },
  },
] as const;

// ── Tool name → handler mapping ────────────────────────────────────────────

type ToolHandler = (args: unknown) => Promise<string>;

const HANDLERS: Record<string, ToolHandler> = {
  retrieve_knowledge: handleRetrieve,
  list_datasets: handleListDatasets,
  get_dataset_config: handleGetDatasetConfig,
  update_dataset_config: handleUpdateDatasetConfig,
  list_documents: handleListDocuments,
  get_chunk: handleGetChunk,
  list_messages: handleListMessages,
  // upload_document requires special handling (file upload) — stub for now
  upload_document: async () =>
    'upload_document not yet implemented: file upload via MCP requires additional transport support',
};

// ── Dispatch ─────────────────────────────────────────────────────────────

export async function dispatchTool(
  request: CallToolRequest,
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const { name, arguments: args } = request.params;

  const handler = HANDLERS[name];
  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: "${name}"` }],
    };
  }

  try {
    const text = await handler(args ?? {});
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
    };
  }
}
