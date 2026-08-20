/**
 * HealthController — /api/v1/health, reports adapter status.
 */

import { Controller, Get, Inject } from '@nestjs/common';
import { KNOWLEDGE_ADAPTER } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import { env } from '../../config/env.js';

@Controller('/api/v1/health')
export class HealthController {
  constructor(@Inject(KNOWLEDGE_ADAPTER) private readonly adapter: IKnowledgeAdapter) {}

  @Get()
  async check() {
    const health = await this.adapter.healthCheck();
    return {
      status: health.status,
      adapter: env.PHLOEM_ADAPTER_TYPE,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      detail: health.detail,
    };
  }
}
