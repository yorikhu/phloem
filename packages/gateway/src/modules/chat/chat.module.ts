/**
 * ChatModule — assembly.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [AdapterModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
