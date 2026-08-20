/**
 * TeamController — /api/v1/team
 */

import { Controller, Get, Post } from '@nestjs/common';
import type { TeamService } from './team.service.js';

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
