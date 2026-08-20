/**
 * RetrievalService — maps transport DTO to adapter request.
 */

import { Inject, Injectable } from '@nestjs/common';
import { KNOWLEDGE_ADAPTER } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import type { RetrievalRequest } from '@phloem/shared';
import type { RetrievalDtoType } from './dto/retrieval.dto.js';

@Injectable()
export class RetrievalService {
  constructor(@Inject(KNOWLEDGE_ADAPTER) private readonly adapter: IKnowledgeAdapter) {}

  retrieve(input: RetrievalDtoType) {
    const request: RetrievalRequest = {
      question: input.question,
      datasetIds: input.dataset_ids,
      ...(input.strategy !== undefined && { strategy: input.strategy }),
      ...(input.top_k !== undefined && { topK: input.top_k }),
      ...(input.similarity_threshold !== undefined && {
        similarityThreshold: input.similarity_threshold,
      }),
    };
    return this.adapter.retrieve(request);
  }
}
