/**
 * API Key DTOs.
 */

import { z } from 'zod';

export const CreateApiKeyDto = z.object({
  name: z.string().min(1).max(255),
});

export type CreateApiKeyDtoType = z.infer<typeof CreateApiKeyDto>;
