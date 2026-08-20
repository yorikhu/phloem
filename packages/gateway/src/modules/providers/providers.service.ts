/**
 * ProvidersService — RAGFlow v0.26 has no provider-management REST API.
 */

import { Injectable } from '@nestjs/common';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class ProvidersService {
  list() {
    return [];
  }

  test() {
    throw ApiError.notImplemented(
      'Provider test not yet implemented: RAGFlow does not expose provider management API',
    );
  }
}
