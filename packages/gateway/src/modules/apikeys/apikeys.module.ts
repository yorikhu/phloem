/**
 * ApiKeysModule — /api/v1/apikeys (proxied to RAGFlow /system/tokens style).
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { RAGFLOW_HTTP, AdapterModule } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';

const CreateKeyDto = z.object({ name: z.string().min(1).max(255) });

@Injectable()
export class ApiKeysService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  list() {
    return this.ragflow
      .request<{ api_keys?: unknown[] }>('/api/v1/api_keys')
      .then((e) => (e.code === 0 ? (e.data?.api_keys ?? []) : []));
  }

  create(input: z.infer<typeof CreateKeyDto>) {
    return this.ragflow.request<Record<string, unknown>>('/api/v1/api_keys', {
      method: 'POST',
      body: JSON.stringify({ name: input.name }),
    });
  }

  remove(keyId: string) {
    return this.ragflow.request<void>(`/api/v1/api_keys/${keyId}`, { method: 'DELETE' });
  }
}

@Controller('/api/v1/apikeys')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(CreateKeyDto.parse(body));
  }

  @Delete(':keyId')
  remove(@Param('keyId') keyId: string) {
    return this.service.remove(keyId);
  }
}

@Module({
  imports: [AdapterModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
