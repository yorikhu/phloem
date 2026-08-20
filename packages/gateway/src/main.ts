/**
 * Phloem Gateway — Nest bootstrap on the Fastify adapter.
 *
 * Why FastifyAdapter and not Express: the gateway is I/O-bound proxying;
 * Fastify keeps ~2x throughput over Express under the same Nest app.
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/response.interceptor.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
  await app.register(cors, { origin: env.PHLOEM_CORS_ORIGINS });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  await app.listen(env.PHLOEM_PORT, env.PHLOEM_HOST);
  // eslint-disable-next-line no-console -- startup banner, one line, systemd reads stdout
  console.log(
    `Phloem Gateway (nest) running on http://${env.PHLOEM_HOST}:${env.PHLOEM_PORT} | adapter: ${env.PHLOEM_ADAPTER_TYPE} | ragflow: ${env.PHLOEM_RAGFLOW_URL}`,
  );
}

bootstrap();
