/**
 * Dataset DTOs — request shapes validated with Zod at the controller
 * boundary; services receive parsed, typed objects only.
 */

import { z } from 'zod';

export const ListDatasetsDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateDatasetDto = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  embedding_model: z.string().optional(),
});

export type ListDatasetsDtoType = z.infer<typeof ListDatasetsDto>;
export type CreateDatasetDtoType = z.infer<typeof CreateDatasetDto>;
