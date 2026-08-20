/**
 * SourcesService — external storage sync (Phase 2+).
 */

import { Injectable } from '@nestjs/common';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class SourcesService {
  list() {
    return [];
  }

  create() {
    throw ApiError.notImplemented('Data source sync not yet implemented');
  }

  sync() {
    throw ApiError.notImplemented('Data source sync not yet implemented');
  }
}
