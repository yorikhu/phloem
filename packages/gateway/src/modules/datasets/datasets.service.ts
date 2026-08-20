/**
 * DatasetsService — dataset business logic over the knowledge adapter.
 */

import { Inject, Injectable } from '@nestjs/common';
import { KNOWLEDGE_ADAPTER } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import { ApiError } from '../../common/api-error.js';
import { ErrCode } from '../../common/error-codes.js';
import type { CreateDatasetDtoType } from './dto/datasets.dto.js';

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

  create(input: CreateDatasetDtoType) {
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
