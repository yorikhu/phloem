/**
 * MSW browser setup — enables mock mode in dev.
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers/index.js';

export const worker = setupWorker(...handlers);
