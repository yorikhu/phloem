/**
 * Gateway configuration — environment-driven, Zod-validated.
 */

import { z } from 'zod';
import 'dotenv/config';

const configSchema = z.object({
  port: z.coerce.number().int().positive().default(3000),
  host: z.string().default('0.0.0.0'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  adapterType: z.enum(['mock', 'ragflow']).default('mock'),
  ragflowUrl: z.string().url().default('http://localhost:9380'),
  ragflowApiKey: z.string().optional(),
  corsOrigins: z.string().default('*'),
});

const parsed = configSchema.safeParse({
  port: process.env.PHLOEM_PORT ?? process.env.PORT,
  host: process.env.PHLOEM_HOST,
  logLevel: process.env.PHLOEM_LOG_LEVEL,
  adapterType: process.env.PHLOEM_ADAPTER_TYPE,
  ragflowUrl: process.env.PHLOEM_RAGFLOW_URL,
  ragflowApiKey: process.env.PHLOEM_RAGFLOW_API_KEY,
  corsOrigins: process.env.PHLOEM_CORS_ORIGINS,
});

if (!parsed.success) {
  console.error('Invalid configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export type GatewayConfig = typeof config;
