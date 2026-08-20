/**
 * Document detail dynamic route — no pre-rendered paths (docIds are runtime
 * data). Client-side navigation works via router.push; static export just
 * needs generateStaticParams to exist, even if empty.
 */

import DocumentDetailClient from './DocumentDetailClient';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ docId: 'index' }];
}

export default function DocumentDetailPage() {
  return <DocumentDetailClient />;
}
