/**
 * TeamModule — /api/v1/team
 *
 * RAGFlow does not expose team invite via REST; read path proxies its
 * user list. Enterprise replaces this module for full RBAC.
 */

import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Post,
} from '@nestjs/common';
import { RAGFLOW_HTTP, AdapterModule } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class TeamService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  listMembers() {
    return this.ragflow
      .request<{ users?: unknown[] }>('/api/v1/users')
      .then((e) => (e.code === 0 ? (e.data?.users ?? []) : []));
  }

  invite() {
    throw ApiError.notImplemented(
      'Team invite not yet implemented: RAGFlow does not expose invite API; use RAGFlow web UI',
    );
  }
}

@Controller('/api/v1/team')
export class TeamController {
  constructor(private readonly service: TeamService) {}

  @Get('members')
  listMembers() {
    return this.service.listMembers();
  }

  @Post('invite')
  invite() {
    return this.service.invite();
  }
}

@Module({
  imports: [AdapterModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
