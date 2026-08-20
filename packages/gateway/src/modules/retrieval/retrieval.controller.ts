/**
 * RetrievalController — POST /api/v1/retrieval
 */

import { Body, Controller, Post } from '@nestjs/common';
import type { RetrievalService } from './retrieval.service.js';
import { RetrievalDto } from './dto/retrieval.dto.js';

@Controller('/api/v1/retrieval')
export class RetrievalController {
  constructor(private readonly service: RetrievalService) {}

  @Post()
  retrieve(@Body() body: unknown) {
    return this.service.retrieve(RetrievalDto.parse(body));
  }
}
