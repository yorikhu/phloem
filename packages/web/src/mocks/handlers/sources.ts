/**
 * Data Source mock handlers (F8.2)
 */
import { http, HttpResponse } from 'msw';
import type { DataSourceConnection, SourceAuthType, SourceType } from '@phloem/shared';

interface SourceCreateInput {
  name?: string;
  type?: SourceType;
  endpoint?: string;
  authType?: SourceAuthType;
}

const _sources: DataSourceConnection[] = [
  {
    id: 'src-1',
    name: '产品文档桶',
    type: 's3',
    endpoint: 's3://phloem-docs/product',
    authType: 'token',
    status: 'connected',
    documentCount: 42,
    lastSyncAt: '2026-08-17T10:00:00Z',
    createdAt: '2026-08-02T00:00:00Z',
  },
  {
    id: 'src-2',
    name: '团队 Notion',
    type: 'notion',
    endpoint: 'notion://phloem-wiki',
    authType: 'token',
    status: 'connected',
    documentCount: 18,
    lastSyncAt: '2026-08-18T08:30:00Z',
    createdAt: '2026-08-08T00:00:00Z',
  },
  {
    id: 'src-3',
    name: '行业资讯 RSS',
    type: 'rss',
    endpoint: 'https://feeds.example.com/ai-weekly',
    authType: 'none',
    status: 'error',
    documentCount: 7,
    lastSyncAt: '2026-08-16T22:00:00Z',
    createdAt: '2026-08-12T00:00:00Z',
  },
];

export const sourceHandlers = [
  http.get('/api/v1/sources', () => {
    return HttpResponse.json(_sources);
  }),

  http.post('/api/v1/sources', async ({ request }) => {
    const body = (await request.json()) as SourceCreateInput;
    const source: DataSourceConnection = {
      id: `src-${Date.now()}`,
      name: body.name ?? 'New Source',
      type: body.type ?? 'webdav',
      endpoint: body.endpoint ?? '',
      authType: body.authType ?? 'none',
      status: 'connected',
      documentCount: 0,
      createdAt: new Date().toISOString(),
    };
    _sources.push(source);
    return HttpResponse.json(source, { status: 201 });
  }),

  http.put('/api/v1/sources/:id', async ({ params, request }) => {
    const s = _sources.find((s) => s.id === params['id']);
    if (!s) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as SourceCreateInput & { enabled?: boolean };
    if (body.name !== undefined) s.name = body.name;
    if (body.endpoint !== undefined) s.endpoint = body.endpoint;
    if (body.enabled !== undefined) {
      s.status = body.enabled ? 'connected' : 'disabled';
    }
    return HttpResponse.json(s);
  }),

  http.delete('/api/v1/sources/:id', ({ params }) => {
    const idx = _sources.findIndex((s) => s.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _sources.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/sources/:id/test', async ({ params }) => {
    const s = _sources.find((s) => s.id === params['id']);
    if (!s) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    const ok = s.status !== 'error';
    return HttpResponse.json(
      ok
        ? { ok: true, latencyMs: Math.round(300 + Math.random() * 300) }
        : { ok: false, error: 'Feed unreachable' },
    );
  }),

  http.post('/api/v1/sources/:id/sync', async ({ params }) => {
    const s = _sources.find((s) => s.id === params['id']);
    if (!s) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    await new Promise((r) => setTimeout(r, 400));
    s.lastSyncAt = new Date().toISOString();
    s.documentCount += 1;
    return HttpResponse.json({ started: true });
  }),
];
