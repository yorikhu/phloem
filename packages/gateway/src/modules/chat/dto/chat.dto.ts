/**
 * Chat DTOs — assistant/session/completion request shapes.
 */

import { z } from 'zod';

export const CompletionDto = z.object({
  question: z.string().min(1).max(4000),
  session_id: z.string().optional(),
  dataset_ids: z.array(z.string()).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
});

export const CreateChatDto = z.object({
  name: z.string().min(1).max(255),
  dataset_ids: z.array(z.string()).optional(),
});

export const CreateSessionDto = z.object({
  session_id: z.string().optional(),
});

export type CompletionDtoType = z.infer<typeof CompletionDto>;
export type CreateChatDtoType = z.infer<typeof CreateChatDto>;
export type CreateSessionDtoType = z.infer<typeof CreateSessionDto>;
