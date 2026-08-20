/**
 * ApiKeysService — proxied to RAGFlow token management.
 */

import { Inject, Injectable } from '@nestjs/common';
import { RAGFLOW_HTTP } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import type { CreateApiKeyDtoType } from './dto/apikeys.dto.js';

@Injectable()
export class ApiKeysService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  list() {
    return this.ragflow
      .request<{ api_keys?: unknown[] }>('/api/v1/api_keys')
      .then((e) => (e.code === 0 ? (e.data?.api_keys ?? []) : []));
  }

  create(input: CreateApiKeyDtoType) {
    return this.ragflow.request<Record<string, unknown>>('/api/v1/api_keys', {
      method: 'POST',
      body: JSON.stringify({ name: input.name }),
    });
  }

  remove(keyId: string) {
    return this.ragflow.request<void>(`/api/v1/api_keys/${keyId}`, { method: 'DELETE' });
  }
}
