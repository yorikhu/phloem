/**
 * UsageController — /api/v1/usage
 */

import { Controller, Get } from '@nestjs/common';
import type { UsageService } from './usage.service.js';

@Controller('/api/v1/usage')
export class UsageController {
  constructor(private readonly service: UsageService) {}

  @Get()
  get() {
    return this.service.get();
  }
}
