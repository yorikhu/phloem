/**
 * TeamService — read path proxies RAGFlow users; invite is Phase 3
 * (enterprise replaces this module for full RBAC).
 */

import { Inject, Injectable } from '@nestjs/common';
import { RAGFLOW_HTTP } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class TeamService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  listMembers() {
    return this.ragflow
      .request<{ users?: unknown[] }>('/api/v1/users')
      .then((e) => (e.code === 0 ? (e.data?.users ?? []) : []));
  }

  invite() {
    throw ApiError.notImplemented(
      'Team invite not yet implemented: RAGFlow does not expose invite API; use RAGFlow web UI',
    );
  }
}
