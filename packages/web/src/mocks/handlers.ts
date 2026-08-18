/**
 * MSW request handlers — simulates the full API surface for dev mode.
 */

import { http, HttpResponse } from 'msw';
import { mockCurrentUser, mockDatasets, mockDocuments, mockRetrievalResults } from './data.js';
import type { Dataset, Document } from '@phloem/shared';

const API = '/api/v1';

let datasets = [...mockDatasets];
const documents = { ...mockDocuments };

export const handlers = [
  // ── Auth ──
  http.get(`${API}/auth/me`, () => HttpResponse.json(mockCurrentUser)),
  // ── Health ──
  http.get(`${API}/health`, () =>
    HttpResponse.json({
      status: 'ok',
      adapter: 'mock',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }),
  ),

  // ── Datasets ──
  http.get(`${API}/datasets`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      data: datasets.slice(start, start + pageSize),
      total: datasets.length,
      page,
      pageSize,
    });
  }),

  http.get(`${API}/datasets/:id`, ({ params }) => {
    const ds = datasets.find((d) => d.id === params.id);
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
    datasets = [newDs, ...datasets];
    documents[newDs.id] = [];
    return HttpResponse.json(newDs, { status: 201 });
  }),

  http.delete(`${API}/datasets/:id`, ({ params }) => {
    datasets = datasets.filter((d) => d.id !== params.id);
    delete documents[params.id as string];
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Documents ──
  http.get(`${API}/datasets/:datasetId/documents`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
    const docs = documents[params.datasetId as string] ?? [];
    const start = (page - 1) * pageSize;
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
    if (!documents[dsId]) documents[dsId] = [];
    documents[dsId] = [newDoc, ...documents[dsId]];
    // Update dataset count
    const ds = datasets.find((d) => d.id === dsId);
    if (ds) {
      ds.documentCount++;
      ds.updatedAt = new Date().toISOString();
    }
    return HttpResponse.json(newDoc, { status: 201 });
  }),

  http.delete(`${API}/datasets/:datasetId/documents/:documentId`, ({ params }) => {
    const dsId = params.datasetId as string;
    const docId = params.documentId as string;
    if (documents[dsId]) {
      documents[dsId] = documents[dsId].filter((d) => d.id !== docId);
      const ds = datasets.find((d) => d.id === dsId);
      if (ds && ds.documentCount > 0) ds.documentCount--;
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Retrieval ──
  http.post(`${API}/retrieval`, async ({ request }) => {
    const body = (await request.json()) as { question: string; datasetIds: string[] };
    // Simulate latency
    await new Promise((r) => setTimeout(r, 400));
    return HttpResponse.json({
      question: body.question,
      results: mockRetrievalResults.filter((r) => body.datasetIds.includes(r.datasetId)),
    });
  }),
];
