/**
 * ApiError — the only error type gateway code should throw.
 *
 * Carries the HTTP status plus the numeric business code from ErrCode;
 * the global exception filter renders it into the unified envelope.
 * Domain services stay transport-agnostic (no reply objects here).
 */

import { ErrCode, type ErrCodeValue } from './error-codes.js';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrCodeValue,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, code: ErrCodeValue = ErrCode.BAD_REQUEST): ApiError {
    return new ApiError(400, code, message);
  }

  static validation(message: string): ApiError {
    return new ApiError(400, ErrCode.VALIDATION_FAILED, message);
  }

  static unauthorized(message = 'Missing Authorization header'): ApiError {
    return new ApiError(401, ErrCode.UNAUTHORIZED, message);
  }

  static notFound(message: string, code: ErrCodeValue = ErrCode.NOT_FOUND): ApiError {
    return new ApiError(404, code, message);
  }

  static notImplemented(message: string): ApiError {
    return new ApiError(501, ErrCode.NOT_IMPLEMENTED, message);
  }

  static internal(message: string): ApiError {
    return new ApiError(500, ErrCode.INTERNAL_ERROR, message);
  }

  /**
   * Wraps adapter/backend failures, preserving an existing ApiError as-is.
   * Unknown errors are stringified into an INTERNAL_ERROR.
   */
  static wrap(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new ApiError(500, ErrCode.INTERNAL_ERROR, message);
  }
}
