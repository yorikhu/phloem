/**
 * ChannelsController — /api/v1/channels
 */

import { Controller, Get, Patch, Post } from '@nestjs/common';
import type { ChannelsService } from './channels.service.js';

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
