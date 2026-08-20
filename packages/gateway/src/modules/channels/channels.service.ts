/**
 * ChannelsService — webchat/wechat/dingtalk/feishu binding (Phase 2+).
 */

import { Injectable } from '@nestjs/common';
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
