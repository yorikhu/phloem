/**
 * ProvidersModule — /api/v1/providers
 * RAGFlow v0.26 has no public provider-management REST API.
 */

import { Controller, Get, Injectable, Module, Post } from '@nestjs/common';
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

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService],
})
export class ProvidersModule {}
