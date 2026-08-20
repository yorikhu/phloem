/**
 * AccountModule — GET /api/v1/account (forwards caller's auth header).
 */

import {
  Controller,
  Get,
  Headers,
  Inject,
  Injectable,
  Module,
} from '@nestjs/common';
import { RAGFLOW_HTTP, AdapterModule } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class AccountService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  get(authHeader: string | undefined) {
    if (!authHeader) throw ApiError.unauthorized();
    return this.ragflow.call('/api/v1/account', { authOverride: authHeader });
  }
}

@Controller('/api/v1/account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get()
  get(@Headers('authorization') auth: string | undefined) {
    return this.service.get(auth);
  }
}

@Module({
  imports: [AdapterModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
