/**
 * AccountService — resolves the current user by forwarding their token.
 */

import { Inject, Injectable } from '@nestjs/common';
import { RAGFLOW_HTTP } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class AccountService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  get(authHeader: string | undefined) {
    if (!authHeader) throw ApiError.unauthorized();
    return this.ragflow.call('/api/v1/account', { authOverride: authHeader });
  }
}
