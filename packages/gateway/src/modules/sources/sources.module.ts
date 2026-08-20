/**
 * SourcesModule — /api/v1/sources (external storage sync — Phase 2+).
 */

import { Controller, Get, Injectable, Module, Post } from '@nestjs/common';
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

@Controller('/api/v1/sources')
export class SourcesController {
  constructor(private readonly service: SourcesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create() {
    return this.service.create();
  }

  @Post(':id/sync')
  sync() {
    return this.service.sync();
  }
}

@Module({
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
