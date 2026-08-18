/**
 * Chunk mock handlers (F1.4, F1.5, F1.6)
 */
import { http, HttpResponse } from 'msw';
import { parsePageParams } from './shared.js';
import type { Chunk } from '@phloem/shared';

// Demo chunks for a sample document
const _demoChunks: Chunk[] = [
  {
    id: 'chunk-1',
    documentId: 'doc-demo',
    content:
      'RAGFlow 是一个基于深度文档理解的知识库问答系统。它使用 DeepDoc 解析器处理 PDF、Word、Excel 等复杂文档，自动切片并建立向量索引，支持混合检索（向量 + 关键词）。',
    index: 1,
    length: 98,
    avgScore: 0.92,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'chunk-2',
    documentId: 'doc-demo',
    content:
      'DeepDoc 解析器的核心能力包括：表格结构保持（通过专门的表格检测模型）、多栏文档按阅读顺序解析、扫描件 OCR（集成 Nougat/PP-StructureV2），以及对数学公式和代码块的结构化识别。',
    index: 2,
    length: 112,
    avgScore: 0.88,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'chunk-3',
    documentId: 'doc-demo',
    content:
      '在生产环境中，建议使用 Docker Compose 部署 RAGFlow，内存需求不低于 8GB（Lite 版）。向量数据库默认使用 Infinity，替代方案为 Elasticsearch（AGPL 许可证注意）。',
    index: 3,
    length: 85,
    avgScore: 0.91,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'chunk-4',
    documentId: 'doc-demo',
    content:
      '检索策略建议使用混合模式（Hybrid Search）：向量检索捕捉语义相似性，关键词检索（BM25）保证精准词匹配，重排序模型（Rerank）综合两者结果给出最优排序。top_k 通常设置在 10-20 之间。',
    index: 4,
    length: 96,
    avgScore: 0.85,
    createdAt: '2026-08-10T00:00:00Z',
  },
];

export const chunkHandlers = [
  http.get('/api/v1/documents/:docId/chunks', ({ params, request }) => {
    const { page, pageSize } = parsePageParams(request);
    const docChunks = _demoChunks.filter((c) => c.documentId === params['docId']);
    const start = (page - 1) * pageSize;
    const slice = docChunks.slice(start, start + pageSize);
    return HttpResponse.json({ data: slice, total: docChunks.length, page, pageSize });
  }),

  http.put('/api/v1/documents/:docId/chunks/:chunkId', async ({ params, request }) => {
    const body = (await request.json()) as { content?: string };
    const chunk = _demoChunks.find(
      (c) => c.id === params['chunkId'] && c.documentId === params['docId'],
    );
    if (!chunk) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    if (body.content !== undefined) chunk.content = body.content;
    return HttpResponse.json(chunk);
  }),

  http.delete('/api/v1/documents/:docId/chunks/:chunkId', ({ params }) => {
    const idx = _demoChunks.findIndex(
      (c) => c.id === params['chunkId'] && c.documentId === params['docId'],
    );
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _demoChunks.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/documents/:docId/reparse', async () => {
    // Simulate reparse: 2s delay
    await new Promise((r) => setTimeout(r, 2000));
    return HttpResponse.json({ status: 'ok', message: 'Reparsing started' });
  }),
];
