/**
 * RagflowHttpClient — single shared HTTP client for RAGFlow.
 *
 * Replaces the five copy-pasted rfFetch helpers from the Fastify era.
 * Owns auth header injection, timeout, and envelope unwrapping; callers
 * get typed data or an ApiError, never raw fetch plumbing.
 */

import { Injectable } from '@nestjs/common';
import { ApiError } from './api-error.js';

export interface RagflowEnvelope<T> {
  code: number;
  data?: T;
  message?: string;
}

export interface RagflowRequestInit extends RequestInit {
  /** Override Authorization (e.g. forward an end-user token). */
  authOverride?: string;
}

@Injectable()
export class RagflowHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs = 30_000,
  ) {}

  async request<T>(path: string, init: RagflowRequestInit = {}): Promise<RagflowEnvelope<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const { authOverride, ...fetchInit } = init;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...fetchInit,
        signal: controller.signal,
        headers: {
          Authorization: authOverride ?? `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(fetchInit.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        throw ApiError.internal(`RAGFlow HTTP ${response.status} at ${path}`);
      }
      if (response.status === 204) return { code: 0 };

      const text = await response.text();
      if (!text) return { code: 0 };
      return JSON.parse(text) as RagflowEnvelope<T>;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.wrap(err);
    } finally {
      clearTimeout(timer);
    }
  }

  /** request() + assert code === 0, returning data directly. */
  async call<T>(path: string, init: RagflowRequestInit = {}): Promise<T> {
    const envelope = await this.request<T>(path, init);
    if (envelope.code !== 0) {
      throw ApiError.internal(envelope.message ?? `RAGFlow error ${envelope.code} at ${path}`);
    }
    return envelope.data as T;
  }

  /** Streams the raw Response for SSE pass-through. */
  async raw(path: string, init: RagflowRequestInit = {}): Promise<Response> {
    const { authOverride, ...fetchInit } = init;
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...fetchInit,
      headers: {
        Authorization: authOverride ?? `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(fetchInit.headers as Record<string, string>),
      },
    });
    if (!response.ok || !response.body) {
      throw ApiError.internal(`RAGFlow stream HTTP ${response.status} at ${path}`);
    }
    return response;
  }
}
