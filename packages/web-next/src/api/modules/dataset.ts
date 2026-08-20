/**
 * Dataset module — knowledge base CRUD.
 */

import type { Dataset, DatasetCreate } from '@phloem/shared';
import { request, pageQuery, type Page, type PageParams } from '../http.js';

export const datasetApi = {
  list: (params?: PageParams) => request<Page<Dataset>>(`/datasets${pageQuery(params)}`),

  get: (id: string) => request<Dataset>(`/datasets/${id}`),

  create: (input: DatasetCreate) =>
    request<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  remove: (id: string) => request<void>(`/datasets/${id}`, { method: 'DELETE' }),
};
