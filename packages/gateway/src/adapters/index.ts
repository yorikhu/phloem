/**
 * Adapter registry — selects the adapter based on PHLOEM_ADAPTER_TYPE env var.
 */

import type { IKnowledgeAdapter } from './types.js';
import { MockAdapter } from './mock.js';
import { RAGFlowAdapter } from './ragflow.js';

export type { IKnowledgeAdapter } from './types.js';

export function createAdapter(type: 'mock' | 'ragflow'): IKnowledgeAdapter {
  switch (type) {
    case 'mock':
      return new MockAdapter();
    case 'ragflow':
      return new RAGFlowAdapter();
    default:
      throw new Error(`Unknown adapter type: ${type satisfies never}`);
  }
}
