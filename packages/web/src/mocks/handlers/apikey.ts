/**
 * API Key mock handlers (F5.6)
 */
import { http, HttpResponse } from 'msw';
import type { ApiKey, ApiKeyCreated } from '../../api/modules/apikey.js';

let _seq = 3;

const _keys: ApiKey[] = [
  { api_key_id: 'key-1', name: 'agent-dev', created_at: '2026-08-10T09:00:00Z' },
  { api_key_id: 'key-2', name: 'ci-pipeline', created_at: '2026-08-15T14:30:00Z' },
];

function generateKey(): string {
  const rand = () => Math.random().toString(36).slice(2, 38);
  return `ph-${rand()}${rand()}`.slice(0, 64);
}

export const apikeyHandlers = [
  http.get('/api/v1/apikeys', () => {
    return HttpResponse.json(_keys);
  }),

  http.post('/api/v1/apikeys', async ({ request }) => {
    const body = (await request.json()) as { name?: string };
    if (!body.name) {
      return HttpResponse.json({ message: 'name required' }, { status: 400 });
    }
    const created: ApiKeyCreated = {
      api_key_id: `key-${_seq++}`,
      api_key: generateKey(),
      name: body.name,
    };
    const { api_key: _ignored, ...summary } = created;
    void _ignored;
    _keys.push({ ...summary, created_at: new Date().toISOString() });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete('/api/v1/apikeys/:id', ({ params }) => {
    const idx = _keys.findIndex((k) => k.api_key_id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _keys.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
