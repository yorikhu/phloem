/**
 * In-memory mock store shared by all handler modules.
 *
 * Handlers mutate these structures directly; cross-domain side effects
 * (e.g. uploading a document bumps its dataset counters) happen here
 * so no handler needs another domain's state.
 */

import type { Dataset, Document } from '@phloem/shared';
import { seedCurrentUser, seedDatasets, seedDocuments, seedRetrievalResults } from './data/seed.js';

export const store = {
  user: seedCurrentUser,
  datasets: [...seedDatasets],
  documents: { ...seedDocuments },
  retrievalResults: [...seedRetrievalResults],
};

/** Find a dataset row; returns undefined when missing. */
export function findDataset(id: string): Dataset | undefined {
  return store.datasets.find((d) => d.id === id);
}

/** Documents of a dataset, always defined (creates on first access). */
export function docsOf(datasetId: string): Document[] {
  let list = store.documents[datasetId];
  if (!list) {
    list = [];
    store.documents[datasetId] = list;
  }
  return list;
}

/** Bump a dataset's document counter and touch updatedAt. */
export function touchDataset(datasetId: string, delta: number): void {
  const ds = findDataset(datasetId);
  if (!ds) return;
  ds.documentCount = Math.max(0, ds.documentCount + delta);
  ds.updatedAt = new Date().toISOString();
}
