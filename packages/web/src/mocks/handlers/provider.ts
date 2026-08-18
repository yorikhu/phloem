/**
 * LLM Provider mock handlers (F8.1)
 */
import { http, HttpResponse } from 'msw';
import { parsePageParams } from './shared.js';
import type { LLMProvider, ProviderType } from '@phloem/shared';

interface ProviderCreateInput {
  name?: string;
  type?: ProviderType;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  defaultModel?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

// In-memory store for providers
const _providers: LLMProvider[] = [
  {
    id: 'prov-1',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-***',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o-mini',
    enabled: true,
    isDefault: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'prov-2',
    name: '硅基流动',
    type: 'openai_compatible',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: 'sk-***',
    models: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3'],
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    enabled: true,
    isDefault: false,
    createdAt: '2026-08-10T00:00:00Z',
  },
];

export const providerHandlers = [
  http.get('/api/v1/providers', ({ request }) => {
    const { page, pageSize } = parsePageParams(request);
    const start = (page - 1) * pageSize;
    const slice = _providers.slice(start, start + pageSize);
    return HttpResponse.json({ data: slice, total: _providers.length, page, pageSize });
  }),

  http.get('/api/v1/providers/:id', ({ params }) => {
    const p = _providers.find((p) => p.id === params['id']);
    if (!p) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json(p);
  }),

  http.post('/api/v1/providers', async ({ request }) => {
    const body = (await request.json()) as ProviderCreateInput;
    const defaultModelVal = body.defaultModel;
    const newProvider: LLMProvider = {
      id: `prov-${Date.now()}`,
      name: body.name ?? 'New Provider',
      type: body.type ?? ('openai_compatible' as ProviderType),
      baseUrl: body.baseUrl ?? '',
      apiKey: body.apiKey ?? '',
      models: body.models ?? [],
      ...(defaultModelVal !== undefined ? { defaultModel: defaultModelVal } : {}),
      enabled: body.enabled ?? true,
      isDefault: _providers.length === 0,
      createdAt: new Date().toISOString(),
    };
    if (newProvider.isDefault) {
      _providers.forEach((p) => {
        p.isDefault = false;
      });
    }
    _providers.push(newProvider);
    return HttpResponse.json(newProvider, { status: 201 });
  }),

  http.put('/api/v1/providers/:id', async ({ params, request }) => {
    const idx = _providers.findIndex((p) => p.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as ProviderCreateInput;
    if (body.isDefault) {
      _providers.forEach((p) => {
        p.isDefault = false;
      });
    }
    _providers[idx] = { ..._providers[idx], ...body, id: params['id'] as string } as LLMProvider;
    return HttpResponse.json(_providers[idx]);
  }),

  http.delete('/api/v1/providers/:id', ({ params }) => {
    const idx = _providers.findIndex((p) => p.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _providers.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/providers/:id/test', async ({ params }) => {
    const p = _providers.find((p) => p.id === params['id']);
    if (!p) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    // Simulate latency + success (mock always succeeds)
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    return HttpResponse.json({
      ok: true,
      latencyMs: Math.round(600 + Math.random() * 400),
      selectedModel: p.models[0],
    });
  }),

  http.post('/api/v1/providers/:id/default', ({ params }) => {
    _providers.forEach((p) => {
      p.isDefault = p.id === params['id'];
    });
    const p = _providers.find((p) => p.id === params['id']);
    return HttpResponse.json(p);
  }),
];
