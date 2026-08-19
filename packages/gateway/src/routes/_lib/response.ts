/**
 * Unified API response helpers and error codes.
 *
 * All responses follow the shape:
 *   { code: number, data: T, request_id: string, timestamp: string }
 *
 * Error codes (分段):
 *   0         Success
 *   1xxx      通用 / 参数错误
 *   2xxx      认证 / 鉴权错误
 *   3xxx      Dataset 相关错误
 *   4xxx      Document 相关错误
 *   5xxx      Chat / 会话相关错误
 *   6xxx      MCP / 工具相关错误
 *   9xxx      内部 / 未知错误
 */

import type { FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

export interface ApiResponse<T> {
  code: number;
  data: T | null;
  request_id: string;
  timestamp: string;
}

// ── Error codes ─────────────────────────────────────────────────────────────

export const ErrCode = {
  // 通用
  SUCCESS: 0,
  BAD_REQUEST: 1000,
  INVALID_PARAM: 1001,
  VALIDATION_FAILED: 1002,
  NOT_FOUND: 1004,
  INTERNAL_ERROR: 9000,

  // 认证
  UNAUTHORIZED: 2001,
  FORBIDDEN: 2003,

  // Dataset
  DATASET_NOT_FOUND: 3001,
  DATASET_CREATE_FAILED: 3002,
  DATASET_DELETE_FAILED: 3003,

  // Document
  DOCUMENT_NOT_FOUND: 4001,
  DOCUMENT_UPLOAD_FAILED: 4002,
  DOCUMENT_DELETE_FAILED: 4003,

  // Chat
  CHAT_SESSION_NOT_FOUND: 5001,
  CHAT_COMPLETION_FAILED: 5002,
  CHAT_SESSION_CREATE_FAILED: 5003,
  CHAT_SESSION_DELETE_FAILED: 5004,
} as const;

export type ErrCode = (typeof ErrCode)[keyof typeof ErrCode];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function ok<T>(data: T, reply: FastifyReply, requestId?: string): FastifyReply {
  return reply.send({
    code: ErrCode.SUCCESS,
    data,
    request_id: requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
  });
}

export function created<T>(data: T, reply: FastifyReply, requestId?: string): FastifyReply {
  return reply.status(201).send({
    code: ErrCode.SUCCESS,
    data,
    request_id: requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
  });
}

export function noContent(reply: FastifyReply): FastifyReply {
  return reply.status(204).send();
}

export function apiError(
  reply: FastifyReply,
  statusCode: number,
  code: ErrCode,
  message: string,
  requestId?: string,
): FastifyReply {
  return reply.status(statusCode).send({
    code,
    data: null,
    request_id: requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
    message,
  });
}

// ── Error mapping from known error types ────────────────────────────────────

export function mapError(err: unknown, reply: FastifyReply): FastifyReply {
  const message = err instanceof Error ? err.message : String(err);

  // RAGFlow HTTP-level errors
  if (message.includes('HTTP 401') || message.toLowerCase().includes('unauthorized')) {
    return apiError(reply, 401, ErrCode.UNAUTHORIZED, 'RAGFlow API key 无效或已过期');
  }
  if (message.includes('HTTP 403') || message.toLowerCase().includes('forbidden')) {
    return apiError(reply, 403, ErrCode.FORBIDDEN, '无权限访问该资源');
  }
  if (message.includes('HTTP 404')) {
    return apiError(reply, 404, ErrCode.NOT_FOUND, '资源不存在');
  }
  if (message.includes('HTTP 429')) {
    return apiError(reply, 429, ErrCode.BAD_REQUEST, 'RAGFlow 请求过于频繁，请稍后重试');
  }

  // Validation errors
  if (message.includes('ZodError') || message.includes('validation')) {
    return apiError(reply, 400, ErrCode.VALIDATION_FAILED, message);
  }

  // Generic internal error
  return apiError(reply, 500, ErrCode.INTERNAL_ERROR, message);
}
