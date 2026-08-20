/**
 * UsageModule — /api/v1/usage (quota tracking — needs RAGFlow DB, Phase 2+).
 */

import { Controller, Get, Injectable, Module } from '@nestjs/common';

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

@Controller('/api/v1/usage')
export class UsageController {
  constructor(private readonly service: UsageService) {}

  @Get()
  get() {
    return this.service.get();
  }
}

@Module({
  controllers: [UsageController],
  providers: [UsageService],
})
export class UsageModule {}
