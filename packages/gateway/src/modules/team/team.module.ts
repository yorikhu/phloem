/**
 * TeamModule — assembly.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';

@Module({
  imports: [AdapterModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
