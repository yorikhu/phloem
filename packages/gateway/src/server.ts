/**
 * Phloem Gateway — Fastify server entry point.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config/index.js';
import { createAdapter } from './adapters/index.js';
import { datasetsRoutes } from './routes/datasets.js';
import { documentsRoutes, chunksRoutes } from './routes/documents.js';
import { retrievalRoutes } from './routes/retrieval.js';
import { chatRoutes } from './routes/chat.js';
import { apikeysRoutes } from './routes/apikeys.js';
import { accountRoutes } from './routes/account.js';
import { teamRoutes } from './routes/team.js';
import { providersRoutes } from './routes/providers.js';
import { sourcesRoutes } from './routes/sources.js';
import { channelsRoutes } from './routes/channels.js';
import { usageRoutes } from './routes/usage.js';
import { ErrCode, apiError } from './routes/_lib/response.js';

const adapter = createAdapter(config.adapterType);

const isDev = process.env.NODE_ENV !== 'production';

const app = Fastify({
  logger: isDev
    ? {
        level: config.logLevel,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : // JSON logs in production/service mode — pino-pretty transport
      // is a dev dependency and resolves unreliably under pnpm isolation.
      { level: config.logLevel },
});

// ── Plugins ────────────────────────────────────────────────────────────────
await app.register(cors, { origin: config.corsOrigins });
await app.register(multipart, {
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// ── Global error handler ──────────────────────────────────────────────────
app.setErrorHandler((err, _req, reply) => {
  const e = err as { validation?: unknown; message?: string; statusCode?: number };
  if (e.validation) {
    return apiError(reply, 400, ErrCode.VALIDATION_FAILED, e.message ?? 'Validation error');
  }
  app.log.error(err);
  return apiError(
    reply,
    e.statusCode ?? 500,
    ErrCode.INTERNAL_ERROR,
    e.message ?? 'Internal error',
  );
});

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/v1/health', async () => {
  const health = await adapter.healthCheck();
  return {
    status: health.status,
    adapter: config.adapterType,
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    detail: health.detail,
  };
});

// ── API Routes ────────────────────────────────────────────────────────────
await datasetsRoutes(app, adapter);
await documentsRoutes(app, adapter);
await chunksRoutes(app);
await retrievalRoutes(app, adapter);
await chatRoutes(app);
await apikeysRoutes(app);
await accountRoutes(app);
await teamRoutes(app);
await providersRoutes(app);
await sourcesRoutes(app);
await channelsRoutes(app);
await usageRoutes(app);

// ── 404 catch-all ────────────────────────────────────────────────────────
app.setNotFoundHandler((_req, reply) => {
  return apiError(reply, 404, ErrCode.NOT_FOUND, 'API endpoint not found');
});

// ── Start ────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Phloem Gateway running on http://${config.host}:${config.port}`);
    app.log.info(`Adapter: ${config.adapterType} | RAGFlow: ${config.ragflowUrl}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
