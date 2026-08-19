/**
 * Phloem MCP Server entry point.
 *
 * Exposes Phloem knowledge base operations as MCP tools
 * for AI agents to consume via stdio transport.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS, dispatchTool } from './tools/registry.js';

const server = new Server(
  { name: 'phloem-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

// ── List tools ─────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

// ── Call tool ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await dispatchTool(request);
  return result;
});

// ── Start ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Phloem MCP Server running on stdio');
