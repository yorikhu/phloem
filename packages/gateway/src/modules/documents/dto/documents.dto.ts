/**
 * Document/Chunk DTOs.
 */

import { z } from 'zod';

export const ListDocumentsDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateChunkDto = z.object({
  content: z.string().optional(),
  available: z.boolean().optional(),
});

export const RebuildChunksDto = z.object({
  chunk_method: z.enum(['naive', 'paper', 'book', 'laws']).optional(),
  chunk_size: z.number().int().min(1).max(2000).optional(),
  delimiter: z.string().optional(),
});

export type ListDocumentsDtoType = z.infer<typeof ListDocumentsDto>;
export type UpdateChunkDtoType = z.infer<typeof UpdateChunkDto>;
export type RebuildChunksDtoType = z.infer<typeof RebuildChunksDto>;

/** Minimal typing for the fastify request carrying a multipart file. */
export interface FastifyRequestWithFile {
  file(): Promise<{ filename: string; toBuffer(): Promise<Buffer> } | undefined>;
}
