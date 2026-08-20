/**
 * DatasetsModule — /api/v1/datasets
 *
 * Controller stays thin (parse → delegate → return); all RAGFlow plumbing
 * lives in the adapter, all envelope work in the interceptor/filter.
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
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { KNOWLEDGE_ADAPTER } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import { ApiError } from '../../common/api-error.js';
import { ErrCode } from '../../common/error-codes.js';
import { PaginationQuery } from '../../common/pagination.dto.js';
import { AdapterModule } from '../adapters/adapter.module.js';

const CreateDatasetDto = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  embedding_model: z.string().optional(),
});

@Injectable()
export class DatasetsService {
  constructor(@Inject(KNOWLEDGE_ADAPTER) private readonly adapter: IKnowledgeAdapter) {}

  list(page: number, pageSize: number) {
    return this.adapter.listDatasets(page, pageSize).then((r) => ({
      data: r.data,
      total: r.total,
      page,
      pageSize: r.data.length,
    }));
  }

  get(id: string) {
    return this.adapter.getDataset(id).then((ds) => {
      if (!ds) throw ApiError.notFound(`Dataset ${id} not found`, ErrCode.DATASET_NOT_FOUND);
      return ds;
    });
  }

  create(input: z.infer<typeof CreateDatasetDto>) {
    return this.adapter.createDataset({
      name: input.name,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.embedding_model !== undefined && { embeddingModel: input.embedding_model }),
    });
  }

  remove(id: string) {
    return this.adapter.deleteDataset(id);
  }
}

@Controller('/api/v1/datasets')
export class DatasetsController {
  constructor(private readonly service: DatasetsService) {}

  @Get()
  list(@Query() query: unknown) {
    const q = PaginationQuery.parse(query);
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

@Module({
  imports: [AdapterModule],
  controllers: [DatasetsController],
  providers: [DatasetsService],
})
export class DatasetsModule {}
