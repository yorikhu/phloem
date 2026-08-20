/**
 * DatasetsController — /api/v1/datasets
 * Thin: validate input, delegate to service, return data (envelope is
 * applied globally by ResponseInterceptor).
 */

import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import type { DatasetsService } from './datasets.service.js';
import { ListDatasetsDto, CreateDatasetDto } from './dto/datasets.dto.js';

@Controller('/api/v1/datasets')
export class DatasetsController {
  constructor(private readonly service: DatasetsService) {}

  @Get()
  list(@Query() query: unknown) {
    const q = ListDatasetsDto.parse(query);
    return this.service.list(q.page, q.page_size);
  }

  @Post()
  create(@Body() body: unknown) {
    const dto = CreateDatasetDto.parse(body);
    return this.service.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
