/**
 * Data Source connection API (F8.2)
 */
import { request } from '../http.js';
import type { DataSourceConnection } from '@phloem/shared';

export interface SourceCreate {
  name: string;
  type: DataSourceConnection['type'];
  endpoint: string;
  authType?: DataSourceConnection['authType'];
  credential?: string;
}

export interface SourceUpdate {
  name?: string;
  endpoint?: string;
  enabled?: boolean;
}

export interface SourceTestResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export const sources = {
  list() {
    return request<DataSourceConnection[]>('/sources');
  },

  create(body: SourceCreate) {
    return request<DataSourceConnection>('/sources', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: SourceUpdate) {
    return request<DataSourceConnection>(`/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  remove(id: string) {
    return request<void>(`/sources/${id}`, { method: 'DELETE' });
  },

  test(id: string) {
    return request<SourceTestResult>(`/sources/${id}/test`, { method: 'POST' });
  },

  sync(id: string) {
    return request<{ started: boolean }>(`/sources/${id}/sync`, { method: 'POST' });
  },
};
