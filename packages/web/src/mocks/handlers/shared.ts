/**
 * Shared helpers for handler modules (pagination parsing, etc.).
 */

export function readPaging(url: URL): { page: number; pageSize: number; start: number } {
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
  return { page, pageSize, start: (page - 1) * pageSize };
}

/** Same as readPaging but accepts an MSW request object. */
export function parsePageParams(request: Request): { page: number; pageSize: number } {
  return readPaging(new URL(request.url));
}

export const API = '/api/v1';
