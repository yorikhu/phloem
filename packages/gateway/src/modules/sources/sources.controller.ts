/**
 * SourcesController — /api/v1/sources
 */

import { Controller, Get, Post } from '@nestjs/common';
import type { SourcesService } from './sources.service.js';

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
