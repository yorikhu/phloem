/**
 * API surface, organized as a namespace of domain modules.
 *
 * ```
 * import { api } from '../api';
 *
 * api.user.me()            // identity
 * api.common.health()      // platform health
 * api.datasets.list()      // knowledge bases
 * api.documents.list(dsId) // files within a dataset
 * api.retrieval.retrieve() // hybrid search
 * ```
 *
 * Adding a domain: create `modules/<name>.ts` exporting `<name>Api`,
 * then spread it here. Shared HTTP primitives live in `http.ts`.
 */

import { commonApi } from './modules/common.js';
import { userApi } from './modules/user.js';
import { datasetApi } from './modules/dataset.js';
import { documentApi } from './modules/document.js';
import { retrievalApi } from './modules/retrieval.js';

export const api = {
  common: commonApi,
  user: userApi,
  datasets: datasetApi,
  documents: documentApi,
  retrieval: retrievalApi,
};
