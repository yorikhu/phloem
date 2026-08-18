/**
 * Handlers for the document module — files inside a dataset.
 */

import { http, HttpResponse } from 'msw';
import type { Document } from '@phloem/shared';
import { store, docsOf, touchDataset } from '../store.js';
import { API, readPaging } from './shared.js';

export const documentHandlers = [
  http.get(`${API}/datasets/:datasetId/documents`, ({ params, request }) => {
    const { page, pageSize, start } = readPaging(new URL(request.url));
    const docs = docsOf(params.datasetId as string);
    return HttpResponse.json({
      data: docs.slice(start, start + pageSize),
      total: docs.length,
      page,
      pageSize,
    });
  }),

  http.post(`${API}/datasets/:datasetId/documents`, async ({ params, request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dsId = params.datasetId as string;
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      datasetId: dsId,
      name: file.name,
      size: file.size,
      status: 'ready',
      chunkCount: Math.floor(Math.random() * 30) + 5,
      progress: 1,
      createdAt: new Date().toISOString(),
    };
    docsOf(dsId).unshift(newDoc);
    touchDataset(dsId, +1);
    return HttpResponse.json(newDoc, { status: 201 });
  }),

  http.delete(`${API}/datasets/:datasetId/documents/:documentId`, ({ params }) => {
    const dsId = params.datasetId as string;
    const docId = params.documentId as string;
    const docs = docsOf(dsId);
    const before = docs.length;
    const remaining = docs.filter((d) => d.id !== docId);
    if (remaining.length < before) {
      store.documents[dsId] = remaining;
      touchDataset(dsId, -1);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
