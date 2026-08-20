/**
 * ChatController — /api/v1/chats(+sessions, completion).
 * Streaming responses delegate to chat.sse.ts renderer.
 */

import { Body, Controller, Delete, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { ChatService } from './chat.service.js';
import { renderSse } from './chat.sse.js';
import { CompletionDto, CreateChatDto, CreateSessionDto } from './dto/chat.dto.js';

@Controller('/api/v1/chats')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get()
  list(@Query() query: { page?: string; page_size?: string }) {
    return this.service.list(Number(query.page ?? 1), Number(query.page_size ?? 20));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(CreateChatDto.parse(body));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/sessions')
  listSessions(@Param('id') id: string, @Query() query: { page?: string; page_size?: string }) {
    return this.service.listSessions(id, Number(query.page ?? 1), Number(query.page_size ?? 20));
  }

  @Post(':id/sessions')
  createSession(@Param('id') id: string, @Body() body: unknown) {
    return this.service.createSession(id, CreateSessionDto.parse(body ?? {}));
  }

  @Post(':id/completion')
  async completion(@Param('id') id: string, @Body() body: unknown, @Res() reply: FastifyReply) {
    const dto = CompletionDto.parse(body);
    if (dto.stream === false) {
      const { stream: _s, ...rest } = dto;
      return this.service.complete(id, rest);
    }
    const upstream = await this.service.stream(id, dto);
    await renderSse(upstream, reply);
  }
}
