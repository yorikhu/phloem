/**
 * retrieve_knowledge — MCP tool handler
 */

import { api } from '../_lib/api.js';
import type { RetrievalResponse } from '@phloem/shared';

interface RetrieveArgs {
  question: string;
  dataset_ids: string[];
  top_k?: number;
  similarity_threshold?: number;
  strategy?: 'hybrid' | 'vector' | 'keyword';
}

export async function handleRetrieve(args: unknown): Promise<string> {
  const params = args as RetrieveArgs;

  if (!params.question || !params.dataset_ids?.length) {
    throw new Error('question and dataset_ids are required');
  }

  const result = await api.post<RetrievalResponse>('/api/v1/retrieval', {
    question: params.question,
    dataset_ids: params.dataset_ids,
    top_k: params.top_k ?? 10,
    ...(params.similarity_threshold !== undefined && {
      similarity_threshold: params.similarity_threshold,
    }),
    ...(params.strategy && { strategy: params.strategy }),
  });

  if (!result.results.length) {
    return 'No relevant results found.';
  }

  const lines = result.results.map(
    (r, i) =>
      `[${i + 1}] Score: ${r.score.toFixed(3)} | ${r.documentName ?? r.documentId}\n${r.content}`,
  );

  return `Found ${result.results.length} result(s):\n\n` + lines.join('\n\n');
}
