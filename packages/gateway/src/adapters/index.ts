/**
 * Adapter registry — selects the adapter based on PHLOEM_ADAPTER_TYPE env var.
 */

import type { IKnowledgeAdapter } from './types.js';
import { MockAdapter } from './mock.js';

export type { IKnowledgeAdapter } from './types.js';

export function createAdapter(type: 'mock' | 'ragflow'): IKnowledgeAdapter {
  switch (type) {
    case 'mock':
      return new MockAdapter();

    case 'ragflow':
      // TODO: Implement RAGFlowAdapter in Phase 1 W4
      throw new Error('RAGFlowAdapter not yet implemented. Set PHLOEM_ADAPTER_TYPE=mock for now.');

    default:
      throw new Error(`Unknown adapter type: ${type satisfies never}`);
  }
}
