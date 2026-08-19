/**
 * API Key module — API key CRUD.
 */

import { request } from '../http.js';

export interface ApiKey {
  api_key_id: string;
  name: string;
  created_at: string;
}

export interface ApiKeyCreated {
  api_key_id: string;
  api_key: string; // only returned once on creation
  name: string;
}

export const apikeyApi = {
  list: () => request<ApiKey[]>('/apikeys'),

  create: (name: string) =>
    request<ApiKeyCreated>('/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  revoke: (keyId: string) => request<void>(`/apikeys/${keyId}`, { method: 'DELETE' }),
};
