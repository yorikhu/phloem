/**
 * Gateway HTTP client for MCP tool handlers.
 * All handlers call the Phloem Gateway REST API.
 */

const GATEWAY_URL = () =>
  (process.env.PHLOEM_GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const API_KEY = () => process.env.PHLOEM_API_KEY ?? '';

export interface ApiResponse<T> {
  code: number;
  data: T | null;
  request_id: string;
  timestamp: string;
  message?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${GATEWAY_URL()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY()}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
  });

  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response from ${path}`);
  }

  const json = JSON.parse(text) as ApiResponse<T>;

  if (json.code !== 0) {
    throw new Error(`Gateway API error ${json.code}: ${json.message ?? 'unknown'}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return json.data as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' });
  },
};
