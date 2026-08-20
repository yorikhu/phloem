/**
 * SSE renderer — translates upstream RAGFlow events into Phloem's
 * client-facing event frames (message/done/error).
 */

import type { FastifyReply } from 'fastify';

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
