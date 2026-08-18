/**
 * Chat sessions & messages mock handlers (F2.2, F2.4)
 */
import { http, HttpResponse } from 'msw';
import { parsePageParams } from './shared.js';
import type { ChatSession, ChatMessage } from '@phloem/shared';

const _sessions: ChatSession[] = [
  {
    id: 'sess-1',
    title: 'RAGFlow 与 Dify 如何选型',
    datasetIds: ['ds-1'],
    messageCount: 4,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-15T10:30:00Z',
  },
  {
    id: 'sess-2',
    title: '知识库切片策略讨论',
    datasetIds: ['ds-1', 'ds-2'],
    messageCount: 2,
    createdAt: '2026-08-14T14:00:00Z',
    updatedAt: '2026-08-14T14:15:00Z',
  },
];

const _messages: ChatMessage[] = [
  {
    id: 'msg-1',
    sessionId: 'sess-1',
    role: 'user',
    content: 'RAGFlow 和 Dify 在知识库场景下哪个更好？',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    sessionId: 'sess-1',
    role: 'assistant',
    content:
      '两者定位不同：RAGFlow 专注于文档解析与检索质量，DeepDoc 解析器对 PDF/Word 等复杂文档的处理能力强，适合需要高精度知识提取的场景；Dify 是 Agent 应用平台，编排能力强，适合需要工作流和多工具调用的场景。如果核心需求是「让 AI 精准回答知识库内容」，推荐 RAGFlow 系产品。',
    citations: [
      {
        content:
          'RAGFlow 专注于文档解析与检索质量，DeepDoc 解析器对 PDF/Word 等复杂文档的处理能力强',
        score: 0.94,
        documentId: 'doc-1',
        documentName: 'RAGFlow 技术白皮书.pdf',
        datasetId: 'ds-1',
        pageNumber: 3,
      },
    ],
    createdAt: '2026-08-15T10:00:05Z',
  },
];

export const chatHandlers = [
  http.get('/api/v1/chat/sessions', ({ request }) => {
    const { page, pageSize } = parsePageParams(request);
    const start = (page - 1) * pageSize;
    const slice = _sessions.slice(start, start + pageSize);
    return HttpResponse.json({ data: slice, total: _sessions.length, page, pageSize });
  }),

  http.post('/api/v1/chat/sessions', async ({ request }) => {
    const body = (await request.json()) as { title?: string; datasetIds?: string[] };
    const s: ChatSession = {
      id: `sess-${Date.now()}`,
      title: body.title ?? '新会话',
      datasetIds: body.datasetIds ?? [],
      messageCount: 0,
      createdAt: new Date().toISOString(),
    };
    _sessions.unshift(s);
    return HttpResponse.json(s, { status: 201 });
  }),

  http.put('/api/v1/chat/sessions/:id', async ({ params, request }) => {
    const body = (await request.json()) as { title?: string };
    const s = _sessions.find((s) => s.id === params['id']);
    if (!s) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    if (body.title !== undefined) s.title = body.title;
    return HttpResponse.json(s);
  }),

  http.delete('/api/v1/chat/sessions/:id', ({ params }) => {
    const idx = _sessions.findIndex((s) => s.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _sessions.splice(idx, 1);
    _messages.splice(
      _messages.findIndex((m) => m.sessionId === params['id']),
      1,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/v1/chat/sessions/:id/messages', ({ params, request }) => {
    const { page, pageSize } = parsePageParams(request);
    const sessionMsgs = _messages.filter((m) => m.sessionId === params['id']);
    const start = (page - 1) * pageSize;
    const slice = sessionMsgs.slice(start, start + pageSize);
    return HttpResponse.json({ data: slice, total: sessionMsgs.length, page, pageSize });
  }),

  // SSE mock: streams a few tokens then done
  http.post('/api/v1/chat', async ({ request }) => {
    const body = (await request.json()) as {
      question: string;
      datasetIds?: string[];
      sessionId?: string;
    };
    void body;

    // Simulate SSE streaming with a few chunks
    const text =
      '根据知识库内容，这是一个基于 RAG（检索增强生成）技术的知识问答示例。系统会从您上传的文档中检索相关片段，然后由大语言模型生成答案，并附上引用来源。';
    const chunks = text.split(/(\s+)/).filter(Boolean);

    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(`data: ${JSON.stringify({ type: 'delta', content: chunk })}\n`);
          await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
        }
        controller.enqueue(`data: ${JSON.stringify({ type: 'done', sessionId: 'sess-new' })}\n`);
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];
