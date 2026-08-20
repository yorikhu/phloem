/**
 * Pagination query — shared Zod schema for list endpoints.
 */

import { z } from 'zod';

export const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuery>;
