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
import { providerHandlers } from './provider.js';
import { accountHandlers } from './account.js';
import { chatHandlers } from './chat.js';
import { chunkHandlers } from './chunk.js';
import { teamHandlers } from './team.js';
import { mcpHandlers } from './mcp.js';
import { sourceHandlers } from './sources.js';
import { channelHandlers } from './channels.js';

export const handlers = [
  ...commonHandlers,
  ...userHandlers,
  ...datasetHandlers,
  ...documentHandlers,
  ...retrievalHandlers,
  ...providerHandlers,
  ...accountHandlers,
  ...chatHandlers,
  ...chunkHandlers,
  ...teamHandlers,
  ...mcpHandlers,
  ...sourceHandlers,
  ...channelHandlers,
];
