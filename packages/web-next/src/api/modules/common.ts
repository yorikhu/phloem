/**
 * Cross-cutting endpoints: service health and misc platform utilities.
 */

import type { HealthStatus } from '@phloem/shared';
import { request } from '../http.js';

export const commonApi = {
  /** Liveness/version probe of the backing service. */
  health: () => request<HealthStatus>('/health'),
};
