/**
 * MCP Server API (F4.4)
 */
import { request } from '../http.js';
import type { McpServer } from '@phloem/shared';

export interface McpServerCreate {
  name: string;
  transport: McpServer['transport'];
  url: string;
  enabled?: boolean;
}

export interface McpServerUpdate {
  name?: string;
  url?: string;
  enabled?: boolean;
}

export interface McpTestResult {
  ok: boolean;
  latencyMs?: number;
  toolCount?: number;
  error?: string;
}

export const mcp = {
  list() {
    return request<McpServer[]>('/mcp/servers');
  },

  create(body: McpServerCreate) {
    return request<McpServer>('/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: McpServerUpdate) {
    return request<McpServer>(`/mcp/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  remove(id: string) {
    return request<void>(`/mcp/servers/${id}`, { method: 'DELETE' });
  },

  test(id: string) {
    return request<McpTestResult>(`/mcp/servers/${id}/test`, { method: 'POST' });
  },
};
