/**
 * ChannelsModule — /api/v1/channels (webchat/wechat/dingtalk/feishu binding).
 */

import { Controller, Get, Injectable, Module, Patch, Post } from '@nestjs/common';
import { ApiError } from '../../common/api-error.js';

@Injectable()
export class ChannelsService {
  list() {
    return [];
  }

  create() {
    throw ApiError.notImplemented('Multi-channel binding not yet implemented');
  }

  update() {
    throw ApiError.notImplemented('Multi-channel binding not yet implemented');
  }
}

@Controller('/api/v1/channels')
export class ChannelsController {
  constructor(private readonly service: ChannelsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create() {
    return this.service.create();
  }

  @Patch(':id')
  update() {
    return this.service.update();
  }
}

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}
