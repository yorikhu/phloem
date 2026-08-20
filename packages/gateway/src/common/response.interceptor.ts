/**
 * ResponseInterceptor — wraps every successful return into the envelope
 *   { code: 0, data, request_id, timestamp }
 *
 * 204 responses and SSE streams are passed through untouched. The
 * envelope shape is part of the public API contract (see openapi.yaml);
 * enterprise extensions must not bypass this interceptor.
 */

import { Injectable } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { randomUUID } from 'node:crypto';

export interface ApiEnvelope<T> {
  code: 0;
  data: T;
  request_id: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // Passthrough: 204 No Content and raw streams already hold the reply.
        if (data === undefined || data === null) return data;
        return {
          code: 0 as const,
          data,
          request_id: randomUUID(),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
