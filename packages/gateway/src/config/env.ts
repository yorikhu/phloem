/**
 * Gateway configuration — environment-driven, Zod-validated at boot.
 * Invalid config fails fast instead of producing a half-alive service.
 */

import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PHLOEM_PORT: z.coerce.number().int().positive().default(3000),
  PHLOEM_HOST: z.string().default('0.0.0.0'),
  PHLOEM_LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PHLOEM_ADAPTER_TYPE: z.enum(['mock', 'ragflow']).default('mock'),
  PHLOEM_RAGFLOW_URL: z.string().url().default('http://localhost:9380'),
  PHLOEM_RAGFLOW_API_KEY: z.string().optional(),
  PHLOEM_CORS_ORIGINS: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid gateway configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
// lint-staged trigger test
