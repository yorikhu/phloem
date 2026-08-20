/**
 * ChatModule — /api/v1/chats(+sessions, completion)
 *
 * SSE streaming: the completion endpoint writes headers via reply.raw and
 * marks reply.sent — bypassing both the response interceptor (streams are
 * never enveloped) and the exception filter (post-header errors travel as
 * SSE `event: error` frames, per the streaming contract in openapi.yaml).
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { z } from 'zod';
import { RAGFLOW_HTTP, AdapterModule } from '../adapters/adapter.module.js';
import type { RagflowHttpClient } from '../../common/ragflow-http.client.js';
import type { FastifyReply } from 'fastify';

const CompletionDto = z.object({
  question: z.string().min(1).max(4000),
  session_id: z.string().optional(),
  dataset_ids: z.array(z.string()).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
});

const CreateChatDto = z.object({
  name: z.string().min(1).max(255),
  dataset_ids: z.array(z.string()).optional(),
});

const CreateSessionDto = z.object({
  session_id: z.string().optional(),
});

@Injectable()
export class ChatService {
  constructor(@Inject(RAGFLOW_HTTP) private readonly ragflow: RagflowHttpClient) {}

  list(page: number, pageSize: number) {
    return this.ragflow
      .call<{ chats: unknown[]; total: number }>(`/api/v1/chats?page=${page}&page_size=${pageSize}`)
      .then((d) => ({ data: d?.chats ?? [], total: d?.total ?? 0 }));
  }

  create(input: z.infer<typeof CreateChatDto>) {
    return this.ragflow.call<unknown>('/api/v1/chats', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  get(id: string) {
    return this.ragflow.call<unknown>(`/api/v1/chats/${id}`);
  }

  remove(id: string) {
    return this.ragflow.call<void>(`/api/v1/chats/${id}`, { method: 'DELETE' });
  }

  listSessions(id: string, page: number, pageSize: number) {
    return this.ragflow
      .call<{ sessions: unknown[]; total: number }>(
        `/api/v1/chats/${id}/sessions?page=${page}&page_size=${pageSize}`,
      )
      .then((d) => ({ data: d?.sessions ?? [], total: d?.total ?? 0 }));
  }

  createSession(id: string, input: z.infer<typeof CreateSessionDto>) {
    return this.ragflow.call<unknown>(`/api/v1/chats/${id}/sessions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /** Non-streaming completion. */
  complete(chatId: string, input: Omit<z.infer<typeof CompletionDto>, 'stream'>) {
    return this.ragflow.call<{ answer: string; reference?: unknown[]; session_id?: string }>(
      `/api/v1/chats/${chatId}/completions`,
      {
        method: 'POST',
        body: JSON.stringify({ question: input.question, stream: false }),
      },
    );
  }

  /** Opens the RAGFlow SSE stream for pass-through rendering. */
  stream(chatId: string, input: z.infer<typeof CompletionDto>): Promise<Response> {
    const body: Record<string, unknown> = { question: input.question, stream: true };
    if (input.session_id) body.session_id = input.session_id;
    if (input.dataset_ids?.length) body.dataset_ids = input.dataset_ids;
    if (input.model) body.model = input.model;
    return this.ragflow.raw(`/api/v1/chats/${chatId}/completions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

/** Renders the upstream RAGFlow SSE into Phloem's client-facing events. */
export async function renderSse(upstream: Response, reply: FastifyReply): Promise<void> {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  });
  // Mark as sent: interceptor must not envelope, filter must not hijack.
  (reply as unknown as { sent: boolean }).sent = true;

  const write = (event: string, data: unknown) =>
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep incomplete tail

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]' || raw === 'done') {
          reply.raw.end();
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const content =
            (parsed.choices as Array<{ delta?: { content?: string } }> | undefined)?.[0]?.delta
              ?.content ??
            (parsed.delta as { content?: string } | undefined)?.content ??
            (parsed.content as string | undefined) ??
            '';
          if (content) {
            write('message', {
              type: 'delta',
              content,
              citations: parsed.reference ?? parsed.citations ?? [],
              sessionId: parsed.session_id,
            });
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
    reply.raw.end();
  } catch (err) {
    write('error', { error: String(err) });
    reply.raw.end();
  }
}

@Controller('/api/v1/chats')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get()
  list(@Query() query: { page?: string; page_size?: string }) {
    return this.service.list(Number(query.page ?? 1), Number(query.page_size ?? 20));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(CreateChatDto.parse(body));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/sessions')
  listSessions(@Param('id') id: string, @Query() query: { page?: string; page_size?: string }) {
    return this.service.listSessions(id, Number(query.page ?? 1), Number(query.page_size ?? 20));
  }

  @Post(':id/sessions')
  createSession(@Param('id') id: string, @Body() body: unknown) {
    return this.service.createSession(id, CreateSessionDto.parse(body ?? {}));
  }

  @Post(':id/completion')
  async completion(
    @Param('id') id: string,
    @Body() body: unknown,
    @Res() reply: FastifyReply,
    @Headers() _headers: Record<string, string>,
  ) {
    const dto = CompletionDto.parse(body);
    if (dto.stream === false) {
      const { stream: _s, ...rest } = dto;
      return this.service.complete(id, rest);
    }
    const upstream = await this.service.stream(id, dto);
    await renderSse(upstream, reply);
  }
}

@Module({
  imports: [AdapterModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
