/**
 * HealthModule — always mounted.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [AdapterModule],
  controllers: [HealthController],
})
export class HealthModule {}
