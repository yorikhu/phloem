/**
 * ApiKeysController — /api/v1/apikeys
 */

import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { ApiKeysService } from './apikeys.service.js';
import { CreateApiKeyDto } from './dto/apikeys.dto.js';

@Controller('/api/v1/apikeys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(CreateApiKeyDto.parse(body));
  }

  @Delete(':keyId')
  remove(@Param('keyId') keyId: string) {
    return this.service.remove(keyId);
  }
}
