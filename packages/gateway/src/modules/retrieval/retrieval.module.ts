/**
 * RetrievalModule — POST /api/v1/retrieval
 */

import {
  Body,
  Controller,
  Inject,
  Injectable,
  Module,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { KNOWLEDGE_ADAPTER, AdapterModule } from '../adapters/adapter.module.js';
import type { IKnowledgeAdapter } from '../../adapters/types.js';
import type { RetrievalRequest } from '@phloem/shared';

const RetrievalDto = z.object({
  question: z.string().min(1).max(4000),
  dataset_ids: z.array(z.string()).min(1),
  strategy: z.enum(['hybrid', 'vector', 'keyword']).optional(),
  top_k: z.coerce.number().int().min(1).max(100).optional(),
  similarity_threshold: z.number().min(0).max(1).optional(),
});

@Injectable()
export class RetrievalService {
  constructor(@Inject(KNOWLEDGE_ADAPTER) private readonly adapter: IKnowledgeAdapter) {}

  retrieve(input: z.infer<typeof RetrievalDto>) {
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

@Controller('/api/v1/retrieval')
export class RetrievalController {
  constructor(private readonly service: RetrievalService) {}

  @Post()
  retrieve(@Body() body: unknown) {
    return this.service.retrieve(RetrievalDto.parse(body));
  }
}

@Module({
  imports: [AdapterModule],
  controllers: [RetrievalController],
  providers: [RetrievalService],
})
export class RetrievalModule {}
