/**
 * Handlers for common endpoints (service health).
 */

import { http, HttpResponse } from 'msw';
import { API } from './shared.js';

export const commonHandlers = [
  http.get(`${API}/health`, () =>
    HttpResponse.json({
      status: 'ok',
      adapter: 'mock',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }),
  ),
];
