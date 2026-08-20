/**
 * DatasetsModule — assembles controller/service; depends on the adapter
 * token, exports nothing (leaf feature module).
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { DatasetsController } from './datasets.controller.js';
import { DatasetsService } from './datasets.service.js';

@Module({
  imports: [AdapterModule],
  controllers: [DatasetsController],
  providers: [DatasetsService],
})
export class DatasetsModule {}
