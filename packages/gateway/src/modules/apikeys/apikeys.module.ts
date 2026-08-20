/**
 * ApiKeysModule — assembly.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { ApiKeysController } from './apikeys.controller.js';
import { ApiKeysService } from './apikeys.service.js';

@Module({
  imports: [AdapterModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
