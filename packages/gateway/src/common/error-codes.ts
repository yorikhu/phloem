/**
 * Business error codes — single source of truth for the whole gateway.
 *
 * Segments:
 *   0    Success
 *   1xxx Common / validation
 *   2xxx Auth
 *   3xxx Dataset
 *   4xxx Document
 *   5xxx Chat / session
 *   6xxx MCP / tools
 *   9xxx Internal / unknown
 */

export const ErrCode = {
  SUCCESS: 0,
  BAD_REQUEST: 1000,
  INVALID_PARAM: 1001,
  VALIDATION_FAILED: 1002,
  NOT_FOUND: 1004,
  NOT_IMPLEMENTED: 1005,
  INTERNAL_ERROR: 9000,

  // Auth
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

export type ErrCodeValue = (typeof ErrCode)[keyof typeof ErrCode];
