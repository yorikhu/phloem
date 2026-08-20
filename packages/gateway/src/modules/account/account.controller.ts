/**
 * AccountController — GET /api/v1/account
 */

import { Controller, Get, Headers } from '@nestjs/common';
import type { AccountService } from './account.service.js';

@Controller('/api/v1/account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get()
  get(@Headers('authorization') auth: string | undefined) {
    return this.service.get(auth);
  }
}
