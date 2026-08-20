/**
 * ProvidersController — /api/v1/providers
 */

import { Controller, Get, Post } from '@nestjs/common';
import type { ProvidersService } from './providers.service.js';

@Controller('/api/v1/providers')
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post('test')
  test() {
    return this.service.test();
  }
}
