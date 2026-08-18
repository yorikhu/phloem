/**
 * Retrieval module — hybrid search across datasets.
 */

import type { RetrievalRequest, RetrievalResponse } from '@phloem/shared';
import { request } from '../http.js';

export const retrievalApi = {
  retrieve: (req: RetrievalRequest) =>
    request<RetrievalResponse>('/retrieval', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};
