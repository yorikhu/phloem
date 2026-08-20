/**
 * DocumentsModule — /api/v1/datasets/:datasetId/documents(+/chunks)
 *
 * Upload uses Fastify multipart (FileInterceptor equivalent via
 * @fastify/multipart request.file()). Chunk routes go straight through
 * the shared RagflowHttpClient — no more copy-pasted fetch helpers.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { z } from 'zod';
import { KNOWLEDGE_ADAPTER, RAGFLOW_HTTP, AdapterModule } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import { ApiError } from '../../common/api-error.js';
import { ErrCode } from '../../common/error-codes.js';
import { PaginationQuery } from '../../common/pagination.dto.js';

const ChunkUpdateDto = z.object({
  content: z.string().optional(),
  available: z.boolean().optional(),
});

const ChunkRebuildDto = z.object({
  chunk_method: z.enum(['naive', 'paper', 'book', 'laws']).optional(),
  chunk_size: z.number().int().min(1).max(2000).optional(),
  delimiter: z.string().optional(),
});

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(KNOWLEDGE_ADAPTER) private readonly adapter: IKnowledgeAdapter,
    @Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient,
  ) {}

  list(datasetId: string, page: number, pageSize: number) {
    return this.adapter.listDocuments(datasetId, page, pageSize).then((r) => ({
      data: r.data,
      total: r.total,
      page,
      pageSize: r.data.length,
    }));
  }

  async get(datasetId: string, documentId: string) {
    const result = await this.adapter.listDocuments(datasetId, 1, 100);
    const doc = result.data.find((d) => d.id === documentId);
    if (!doc) {
      throw ApiError.notFound(`Document ${documentId} not found`, ErrCode.DOCUMENT_NOT_FOUND);
    }
    return doc;
  }

  upload(datasetId: string, file: Buffer, filename: string) {
    return this.adapter.uploadDocument(datasetId, file, filename);
  }

  remove(datasetId: string, documentId: string) {
    return this.adapter.deleteDocument(datasetId, documentId);
  }

  listChunks(datasetId: string, documentId: string, page: number, pageSize: number) {
    return this.ragflow.call<{ chunks: unknown[]; total: number }>(
      `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks?page=${page}&page_size=${pageSize}`,
    );
  }

  updateChunk(datasetId: string, documentId: string, chunkId: string, body: z.infer<typeof ChunkUpdateDto>) {
    return this.ragflow.call<unknown>(
      `/api/v1/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  }

  rebuildChunks(datasetId: string, documentId: string, body: z.infer<typeof ChunkRebuildDto>) {
    return this.ragflow
      .call<unknown>(`/api/v1/datasets/${datasetId}/documents/${documentId}/chunks`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      .then(() => ({ status: 'triggered' as const }));
  }
}

@Controller('/api/v1/datasets/:datasetId/documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  list(@Param('datasetId') datasetId: string, @Query() query: unknown) {
    const q = PaginationQuery.parse(query);
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
    const q = PaginationQuery.parse(query);
    return this.service.listChunks(datasetId, documentId, q.page, q.page_size);
  }

  @Patch(':documentId/chunks/:chunkId')
  updateChunk(
    @Param('datasetId') datasetId: string,
    @Param('documentId') documentId: string,
    @Param('chunkId') chunkId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateChunk(datasetId, documentId, chunkId, ChunkUpdateDto.parse(body));
  }

  @Post(':documentId/chunks/rebuild')
  rebuildChunks(
    @Param('datasetId') datasetId: string,
    @Param('documentId') documentId: string,
    @Body() body: unknown,
  ) {
    return this.service.rebuildChunks(datasetId, documentId, ChunkRebuildDto.parse(body ?? {}));
  }
}

/** Minimal typing for the fastify request carrying a multipart file. */
interface FastifyRequestWithFile {
  file(): Promise<{
    filename: string;
    toBuffer(): Promise<Buffer>;
  } | undefined>;
}

@Module({
  imports: [AdapterModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
