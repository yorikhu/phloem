/**
 * User / identity module — current session account.
 */

import type { CurrentUser } from '@phloem/shared';
import { request } from '../http.js';

export const userApi = {
  /** Signed-in account for the sidebar footer and identity widgets. */
  me: () => request<CurrentUser>('/auth/me'),
};
