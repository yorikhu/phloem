/**
 * AllExceptionsFilter — renders every unhandled error as the unified envelope
 *   { code: <business code>, message, request_id, timestamp }
 *
 * Zod validation failures and ApiError keep their status + code; anything
 * else collapses to 500/9000. Fastify replies that are already streaming
 * (SSE) are left alone — once headers are sent the body owns the response.
 */

import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiError } from './api-error.js';
import { ErrCode, type ErrCodeValue } from './error-codes.js';

interface ErrorEnvelope {
  code: ErrCodeValue;
  message: string;
  request_id: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<{ sent?: boolean; statusCode: number }>();

    // SSE streams: headers already flushed, the transport owns the error frame.
    if (res.sent) return;

    let status: number;
    let code: ErrCodeValue;
    let message: string;

    if (exception instanceof ApiError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const rawMessage =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
      message = Array.isArray(rawMessage) ? rawMessage.join('; ') : rawMessage;
      code = status === 400 ? ErrCode.VALIDATION_FAILED : ErrCode.INTERNAL_ERROR;
    } else if (exception instanceof Error && exception.name === 'ZodError') {
      status = HttpStatus.BAD_REQUEST;
      code = ErrCode.VALIDATION_FAILED;
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrCode.INTERNAL_ERROR;
      message = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(`Unhandled exception: ${message}`, exception instanceof Error ? exception.stack : undefined);
    }

    const body: ErrorEnvelope = {
      code,
      message,
      request_id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    res.statusCode = status;
    (res as unknown as { send: (b: unknown) => void }).send(body);
  }
}
