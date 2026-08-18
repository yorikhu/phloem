/**
 * API surface, organized as a namespace of domain modules.
 *
 * ```
 * import { api } from '../api';
 *
 * api.user.me()              // identity
 * api.common.health()        // platform health
 * api.datasets.list()        // knowledge bases
 * api.documents.list(dsId)   // files within a dataset
 * api.retrieval.retrieve()   // hybrid search
 * api.providers.list()       // LLM providers (F8.1)
 * api.account.get()          // current user profile (F5.5)
 * api.chat.listSessions()    // chat sessions (F2.4)
 * api.chunks.list(docId)     // chunk list (F1.5)
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
import { providers } from './modules/provider.js';
import { account } from './modules/account.js';
import { chat } from './modules/chat.js';
import { chunks } from './modules/chunk.js';

export const api = {
  common: commonApi,
  user: userApi,
  datasets: datasetApi,
  documents: documentApi,
  retrieval: retrievalApi,
  providers,
  account,
  chat,
  chunks,
};
