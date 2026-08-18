/**
 * Low-level HTTP primitives shared by all API modules.
 *
 * - `request` wraps fetch with JSON headers, error normalization, and
 *   204 handling. Module files should always go through it.
 * - `API_BASE` is the single place the versioned prefix lives.
 */

export const API_BASE = '/api/v1';

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** Paged list envelope shared by list endpoints. */
export type Page<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PageParams = {
  page?: number;
  pageSize?: number;
};

export function pageQuery(params?: PageParams): string {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  return `?page=${page}&pageSize=${pageSize}`;
}
