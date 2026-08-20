/**
 * AccountModule — assembly.
 */

import { Module } from '@nestjs/common';
import { AdapterModule } from '../adapters/adapter.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [AdapterModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
