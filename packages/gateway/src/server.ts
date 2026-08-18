/**
 * Phloem Gateway — Fastify server entry point.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/index.js';
import { createAdapter } from './adapters/index.js';

const adapter = createAdapter(config.adapterType);

const app = Fastify({
  logger: {
    level: config.logLevel,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

await app.register(cors, { origin: config.corsOrigins });

// ── Health check ──
app.get('/api/v1/health', async () => {
  const health = await adapter.healthCheck();
  return {
    status: health.status,
    adapter: config.adapterType,
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  };
});

// ── Start ──
const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Phloem Gateway running on http://${config.host}:${config.port}`);
    app.log.info(`Adapter: ${config.adapterType}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
