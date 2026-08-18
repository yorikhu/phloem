/**
 * Phloem MCP Server entry point.
 *
 * Exposes Phloem knowledge base operations as MCP tools
 * for AI agents to consume.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// TODO: Implement ToolRegistry and tool handlers in Phase 2

const server = new Server(
  { name: 'phloem-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'retrieve_knowledge',
      description: 'Retrieve knowledge from Phloem datasets using hybrid retrieval',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question to search for' },
          datasetIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Dataset IDs to search across',
          },
          topK: { type: 'integer', default: 10, description: 'Number of results to return' },
        },
        required: ['question', 'datasetIds'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  // TODO: Route to actual tool handlers
  return {
    content: [
      {
        type: 'text',
        text: `Tool "${name}" not yet implemented. This is a scaffold.`,
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Phloem MCP Server running on stdio');
