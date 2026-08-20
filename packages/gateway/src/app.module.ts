/**
 * AppModule — composition root.
 *
 * ── Enterprise extension points ─────────────────────────────────────────
 * phloem-enterprise composes on top of this module without forking:
 *
 * 1. Module override: `app.overrideModule(DatasetsModule).useModule(...)` —
 *    swap any feature module for an RBAC-aware implementation.
 * 2. Extra providers: append guards (tenant resolution), interceptors
 *    (audit logging), or middleware at bootstrap in main.ts.
 * 3. KNOWLEDGE_ADAPTER token: replace the engine binding (see adapter.module).
 *
 * The OSS tree stays self-contained: it never imports enterprise code.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from './modules/adapters/adapter.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { DatasetsModule } from './modules/datasets/datasets.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { RetrievalModule } from './modules/retrieval/retrieval.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { ApiKeysModule } from './modules/apikeys/apikeys.module.js';
import { AccountModule } from './modules/account/account.module.js';
import { TeamModule } from './modules/team/team.module.js';
import { ProvidersModule } from './modules/providers/providers.module.js';
import { SourcesModule } from './modules/sources/sources.module.js';
import { ChannelsModule } from './modules/channels/channels.module.js';
import { UsageModule } from './modules/usage/usage.module.js';

@Module({
  imports: [
    AdapterModule,
    HealthModule,
    DatasetsModule,
    DocumentsModule,
    RetrievalModule,
    ChatModule,
    ApiKeysModule,
    AccountModule,
    TeamModule,
    ProvidersModule,
    SourcesModule,
    ChannelsModule,
    UsageModule,
  ],
})
export class AppModule {}
