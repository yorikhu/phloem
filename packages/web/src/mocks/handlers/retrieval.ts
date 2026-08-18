/**
 * Handlers for the retrieval module — hybrid search.
 */

import { http, HttpResponse } from 'msw';
import { store } from '../store.js';
import { API } from './shared.js';

export const retrievalHandlers = [
  http.post(`${API}/retrieval`, async ({ request }) => {
    const body = (await request.json()) as { question: string; datasetIds: string[] };
    // Simulate latency
    await new Promise((r) => setTimeout(r, 400));
    return HttpResponse.json({
      question: body.question,
      results: store.retrievalResults.filter((r) => body.datasetIds.includes(r.datasetId)),
    });
  }),
];
