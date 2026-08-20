/**
 * Retrieval DTOs — hybrid search request shape.
 */

import { z } from 'zod';

export const RetrievalDto = z.object({
  question: z.string().min(1).max(4000),
  dataset_ids: z.array(z.string()).min(1),
  strategy: z.enum(['hybrid', 'vector', 'keyword']).optional(),
  top_k: z.coerce.number().int().min(1).max(100).optional(),
  similarity_threshold: z.number().min(0).max(1).optional(),
});

export type RetrievalDtoType = z.infer<typeof RetrievalDto>;
