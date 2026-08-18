/**
 * Handlers for the dataset module — knowledge base CRUD.
 */

import { http, HttpResponse } from 'msw';
import type { Dataset } from '@phloem/shared';
import { store, docsOf } from '../store.js';
import { API, readPaging } from './shared.js';

export const datasetHandlers = [
  http.get(`${API}/datasets`, ({ request }) => {
    const { page, pageSize, start } = readPaging(new URL(request.url));
    return HttpResponse.json({
      data: store.datasets.slice(start, start + pageSize),
      total: store.datasets.length,
      page,
      pageSize,
    });
  }),

  http.get(`${API}/datasets/:id`, ({ params }) => {
    const ds = store.datasets.find((d) => d.id === params.id);
    if (!ds) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(ds);
  }),

  http.post(`${API}/datasets`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };
    const newDs: Dataset = {
      id: `ds-${Date.now()}`,
      name: body.name,
      documentCount: 0,
      chunkCount: 0,
      embeddingModel: 'BAAI/bge-large-zh-v1.5',
      createdAt: new Date().toISOString(),
    };
    if (body.description) {
      newDs.description = body.description;
    }
    store.datasets = [newDs, ...store.datasets];
    docsOf(newDs.id);
    return HttpResponse.json(newDs, { status: 201 });
  }),

  http.delete(`${API}/datasets/:id`, ({ params }) => {
    store.datasets = store.datasets.filter((d) => d.id !== params.id);
    delete store.documents[params.id as string];
    return new HttpResponse(null, { status: 204 });
  }),
];
