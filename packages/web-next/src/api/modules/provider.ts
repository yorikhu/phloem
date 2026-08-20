/**
 * LLM Provider API (F8.1)
 */
import { request, type Page, type PageParams, pageQuery } from '../http.js';
import type { LLMProvider, ProviderTestResult } from '@phloem/shared';

export interface ProviderCreate {
  name: string;
  type: LLMProvider['type'];
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface ProviderUpdate {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  models?: string[];
  defaultModel?: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export const providers = {
  list(params?: PageParams) {
    return request<Page<LLMProvider>>(`/providers${pageQuery(params)}`);
  },

  get(id: string) {
    return request<LLMProvider>(`/providers/${id}`);
  },

  create(body: ProviderCreate) {
    return request<LLMProvider>('/providers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: ProviderUpdate) {
    return request<LLMProvider>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  remove(id: string) {
    return request<void>(`/providers/${id}`, { method: 'DELETE' });
  },

  test(id: string) {
    return request<ProviderTestResult>(`/providers/${id}/test`, { method: 'POST' });
  },

  setDefault(id: string) {
    return request<LLMProvider>(`/providers/${id}/default`, { method: 'POST' });
  },
};
