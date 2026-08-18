/**
 * Account API (F5.5)
 */
import { request } from '../http.js';
import type { CurrentUser } from '@phloem/shared';

export interface AccountUpdate {
  name?: string;
  avatarUrl?: string;
}

export const account = {
  get() {
    return request<CurrentUser>('/account');
  },

  update(body: AccountUpdate) {
    return request<CurrentUser>('/account', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
