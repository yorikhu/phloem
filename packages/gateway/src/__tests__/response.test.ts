/**
 * Unit tests for gateway response helpers.
 */

import { describe, it, expect } from 'vitest';
import { ErrCode } from '../routes/_lib/response.js';

describe('ErrCode', () => {
  it('SUCCESS is 0', () => {
    expect(ErrCode.SUCCESS).toBe(0);
  });

  it('has error codes in correct ranges', () => {
    expect(ErrCode.BAD_REQUEST).toBe(1000);
    expect(ErrCode.INVALID_PARAM).toBe(1001);
    expect(ErrCode.VALIDATION_FAILED).toBe(1002);
    expect(ErrCode.NOT_FOUND).toBe(1004);
    expect(ErrCode.UNAUTHORIZED).toBe(2001);
    expect(ErrCode.FORBIDDEN).toBe(2003);
    expect(ErrCode.DATASET_NOT_FOUND).toBe(3001);
    expect(ErrCode.DOCUMENT_NOT_FOUND).toBe(4001);
    expect(ErrCode.CHAT_SESSION_NOT_FOUND).toBe(5001);
    expect(ErrCode.INTERNAL_ERROR).toBe(9000);
  });

  it('has all chat error codes', () => {
    expect(ErrCode.CHAT_SESSION_CREATE_FAILED).toBe(5003);
    expect(ErrCode.CHAT_SESSION_DELETE_FAILED).toBe(5004);
  });
});
