/**
 * MCP Server mock handlers (F4.4)
 */
import { http, HttpResponse } from 'msw';
import type { McpServer, McpTransport } from '@phloem/shared';

interface McpCreateInput {
  name?: string;
  transport?: McpTransport;
  url?: string;
  enabled?: boolean;
}

const _servers: McpServer[] = [
  {
    id: 'mcp-1',
    name: 'phloem-ragflow',
    transport: 'streamable_http',
    url: 'http://localhost:9380/mcp',
    enabled: true,
    status: 'connected',
    toolCount: 8,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mcp-2',
    name: 'filesystem-tools',
    transport: 'sse',
    url: 'http://localhost:3333/sse',
    enabled: true,
    status: 'connected',
    toolCount: 5,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'mcp-3',
    name: 'web-search',
    transport: 'sse',
    url: 'https://mcp.example.com/search/sse',
    enabled: false,
    status: 'disconnected',
    toolCount: 0,
    createdAt: '2026-08-14T00:00:00Z',
  },
];

export const mcpHandlers = [
  http.get('/api/v1/mcp/servers', () => {
    return HttpResponse.json(_servers);
  }),

  http.post('/api/v1/mcp/servers', async ({ request }) => {
    const body = (await request.json()) as McpCreateInput;
    const server: McpServer = {
      id: `mcp-${Date.now()}`,
      name: body.name ?? 'New Server',
      transport: body.transport ?? 'streamable_http',
      url: body.url ?? '',
      enabled: body.enabled ?? true,
      status: 'disconnected',
      toolCount: 0,
      createdAt: new Date().toISOString(),
    };
    _servers.push(server);
    return HttpResponse.json(server, { status: 201 });
  }),

  http.put('/api/v1/mcp/servers/:id', async ({ params, request }) => {
    const s = _servers.find((s) => s.id === params['id']);
    if (!s) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as McpCreateInput;
    if (body.name !== undefined) s.name = body.name;
    if (body.url !== undefined) s.url = body.url;
    if (body.enabled !== undefined) {
      s.enabled = body.enabled;
      s.status = body.enabled ? 'connected' : 'disconnected';
      s.toolCount = body.enabled ? Math.max(s.toolCount, 3) : 0;
    }
    return HttpResponse.json(s);
  }),

  http.delete('/api/v1/mcp/servers/:id', ({ params }) => {
    const idx = _servers.findIndex((s) => s.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _servers.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/mcp/servers/:id/test', async ({ params }) => {
    const s = _servers.find((s) => s.id === params['id']);
    if (!s) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    const ok = s.enabled && s.url.length > 0;
    return HttpResponse.json(
      ok
        ? { ok: true, latencyMs: Math.round(400 + Math.random() * 300), toolCount: s.toolCount }
        : { ok: false, error: 'Server is disabled or URL is empty' },
    );
  }),
];
