/**
 * All MSW handlers, composed from per-domain modules.
 *
 * Mirrors the structure of `src/api/modules/` — add a domain by
 * creating `handlers/<name>.ts` and spreading it here.
 */

import { commonHandlers } from './common.js';
import { userHandlers } from './user.js';
import { datasetHandlers } from './dataset.js';
import { documentHandlers } from './document.js';
import { retrievalHandlers } from './retrieval.js';

export const handlers = [
  ...commonHandlers,
  ...userHandlers,
  ...datasetHandlers,
  ...documentHandlers,
  ...retrievalHandlers,
];
