/**
 * DocumentsController — /api/v1/datasets/:datasetId/documents(+/chunks)
 */

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { DocumentsService } from './documents.service.js';
import {
  ListDocumentsDto,
  UpdateChunkDto,
  RebuildChunksDto,
  type FastifyRequestWithFile,
} from './dto/documents.dto.js';
import { ApiError } from '../../common/api-error.js';

@Controller('/api/v1/datasets/:datasetId/documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  list(@Param('datasetId') datasetId: string, @Query() query: unknown) {
    const q = ListDocumentsDto.parse(query);
    return this.service.list(datasetId, q.page, q.page_size);
  }

  @Post()
  async upload(@Param('datasetId') datasetId: string, @Req() req: FastifyRequestWithFile) {
    const data = await req.file();
    if (!data) throw ApiError.badRequest('No file uploaded');
    const buffer = Buffer.from(await data.toBuffer());
    return this.service.upload(datasetId, buffer, data.filename);
  }

  @Get(':documentId')
  get(@Param('datasetId') datasetId: string, @Param('documentId') documentId: string) {
    return this.service.get(datasetId, documentId);
  }

  @Delete(':documentId')
  remove(@Param('datasetId') datasetId: string, @Param('documentId') documentId: string) {
    return this.service.remove(datasetId, documentId);
  }

  @Get(':documentId/chunks')
  listChunks(
    @Param('datasetId') datasetId: string,
    @Param('documentId') documentId: string,
    @Query() query: unknown,
  ) {
    const q = ListDocumentsDto.parse(query);
    return this.service.listChunks(datasetId, documentId, q.page, q.page_size);
  }

  @Patch(':documentId/chunks/:chunkId')
  updateChunk(
    @Param('datasetId') datasetId: string,
    @Param('documentId') documentId: string,
    @Param('chunkId') chunkId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateChunk(datasetId, documentId, chunkId, UpdateChunkDto.parse(body));
  }

  @Post(':documentId/chunks/rebuild')
  rebuildChunks(
    @Param('datasetId') datasetId: string,
    @Param('documentId') documentId: string,
    @Body() body: unknown,
  ) {
    return this.service.rebuildChunks(datasetId, documentId, RebuildChunksDto.parse(body ?? {}));
  }
}
