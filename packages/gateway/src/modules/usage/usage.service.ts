/**
 * UsageService — quota tracking needs RAGFlow DB access (Phase 2+).
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class UsageService {
  get() {
    return {
      documentsUploaded: 0,
      chunksCreated: 0,
      apiCalls: 0,
      quota: null,
      period: 'month',
    };
  }
}
