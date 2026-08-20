/**
 * RetrievalModule — assembly.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { RetrievalController } from './retrieval.controller.js';
import { RetrievalService } from './retrieval.service.js';

@Module({
  imports: [AdapterModule],
  controllers: [RetrievalController],
  providers: [RetrievalService],
})
export class RetrievalModule {}
