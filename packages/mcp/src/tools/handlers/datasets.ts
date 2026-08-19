/**
 * Dataset tool handlers — list_datasets, get_dataset_config, update_dataset_config
 */

import { api } from '../_lib/api.js';
import type { Dataset, DatasetListResponse } from '@phloem/shared';

// ── list_datasets ────────────────────────────────────────────────────────────

interface ListDatasetsArgs {
  page?: number;
  page_size?: number;
}

export async function handleListDatasets(args: unknown): Promise<string> {
  const params = args as ListDatasetsArgs;
  const result = await api.get<DatasetListResponse>(
    `/api/v1/datasets?page=${params.page ?? 1}&page_size=${params.page_size ?? 20}`,
  );

  if (!result.data.length) {
    return 'No datasets found.';
  }

  const lines = result.data.map(
    (d) =>
      `ID: ${d.id} | Name: ${d.name} | Docs: ${d.documentCount} | Chunks: ${d.chunkCount} | Created: ${d.createdAt}`,
  );

  return `Datasets (total: ${result.total}):\n\n${lines.join('\n')}`;
}

// ── get_dataset_config ───────────────────────────────────────────────────────

interface GetDatasetConfigArgs {
  dataset_id: string;
}

export async function handleGetDatasetConfig(args: unknown): Promise<string> {
  const params = args as GetDatasetConfigArgs;
  if (!params.dataset_id) throw new Error('dataset_id is required');

  const dataset = await api.get<Dataset>(`/api/v1/datasets/${params.dataset_id}`);

  return JSON.stringify(
    {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      embedding_model: dataset.embeddingModel,
      document_count: dataset.documentCount,
      chunk_count: dataset.chunkCount,
      created_at: dataset.createdAt,
      updated_at: dataset.updatedAt,
    },
    null,
    2,
  );
}

// ── update_dataset_config ───────────────────────────────────────────────────

interface UpdateDatasetConfigArgs {
  dataset_id: string;
  name?: string;
  description?: string;
  embedding_model?: string;
}

export async function handleUpdateDatasetConfig(args: unknown): Promise<string> {
  const params = args as UpdateDatasetConfigArgs;
  if (!params.dataset_id) throw new Error('dataset_id is required');

  // RAGFlow uses PATCH /api/v1/datasets/{id} for partial updates
  const body: Record<string, unknown> = {};
  if (params.name !== undefined) body.name = params.name;
  if (params.description !== undefined) body.description = params.description;
  if (params.embedding_model !== undefined) body.embedding_model = params.embedding_model;

  const result = await api.patch<Dataset>(`/api/v1/datasets/${params.dataset_id}`, body);

  return `Dataset updated:\n${JSON.stringify(result, null, 2)}`;
}
