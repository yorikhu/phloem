/**
 * AdapterModule — provides IKnowledgeAdapter behind the KNOWLEDGE_ADAPTER
 * injection token.
 *
 * ── Enterprise extension point ──────────────────────────────────────────
 * The closed-source phloem-enterprise package overrides this module via
 * DynamicModule replacement (Nest module resolution: last-registered wins
 * with `overrideModule`, or DI re-binding in the composition root) to
 * supply multi-tenant / RBAC-aware adapter implementations. The OSS tree
 * never imports enterprise code — only the token contract.
 *
 *   @Module({ providers: [{ provide: KNOWLEDGE_ADAPTER, useClass: MtAdapter }] })
 */

import { Module } from '@nestjs/common';
import type { Provider } from '@nestjs/common';
import { env } from '../../config/env.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import { MockAdapter } from '../../adapters/mock.js';
import { RAGFlowAdapter } from '../../adapters/ragflow.js';
import { RagflowHttpClient } from '../../common/ragflow-http.client.js';

export const KNOWLEDGE_ADAPTER = Symbol('KNOWLEDGE_ADAPTER');
export const RAGFLOW_HTTP = Symbol('RAGFLOW_HTTP');

const adapterProvider: Provider = {
  provide: KNOWLEDGE_ADAPTER,
  // Factory keeps the engine choice in one place; enterprise rebinds this
  // token to swap in multi-tenant adapter implementations.
  useFactory: (_http?: RagflowHttpClient): IKnowledgeAdapter => {
    switch (env.PHLOEM_ADAPTER_TYPE) {
      case 'ragflow':
        return new RAGFlowAdapter();
      case 'mock':
      default:
        return new MockAdapter();
    }
  },
  inject: [RAGFLOW_HTTP],
};

const ragflowHttpProvider: Provider = {
  provide: RAGFLOW_HTTP,
  useFactory: (): RagflowHttpClient =>
    new RagflowHttpClient(env.PHLOEM_RAGFLOW_URL, env.PHLOEM_RAGFLOW_API_KEY ?? ''),
};

@Module({
  providers: [ragflowHttpProvider, adapterProvider],
  exports: [KNOWLEDGE_ADAPTER, RAGFLOW_HTTP],
})
export class AdapterModule {}
