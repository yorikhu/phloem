/**
 * Chat channel mock handlers (F8.3)
 */
import { http, HttpResponse } from 'msw';
import type { ChannelType, ChatChannel } from '@phloem/shared';

interface ChannelCreateInput {
  name?: string;
  type?: ChannelType;
  webhookUrl?: string;
  boundDatasetIds?: string[];
}

const _channels: ChatChannel[] = [
  {
    id: 'ch-1',
    name: '官网客服',
    type: 'webchat',
    boundDatasetIds: ['ds-1'],
    enabled: true,
    messageCount: 1284,
    createdAt: '2026-08-05T00:00:00Z',
  },
  {
    id: 'ch-2',
    name: '企业微信助手',
    type: 'wechat',
    webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=***',
    boundDatasetIds: ['ds-1', 'ds-2'],
    enabled: true,
    messageCount: 356,
    createdAt: '2026-08-11T00:00:00Z',
  },
  {
    id: 'ch-3',
    name: '飞书机器人',
    type: 'feishu',
    webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/***',
    boundDatasetIds: [],
    enabled: false,
    messageCount: 0,
    createdAt: '2026-08-15T00:00:00Z',
  },
];

export const channelHandlers = [
  http.get('/api/v1/channels', () => {
    return HttpResponse.json(_channels);
  }),

  http.post('/api/v1/channels', async ({ request }) => {
    const body = (await request.json()) as ChannelCreateInput;
    const webhook = body.webhookUrl;
    const channel: ChatChannel = {
      id: `ch-${Date.now()}`,
      name: body.name ?? 'New Channel',
      type: body.type ?? 'webchat',
      ...(webhook !== undefined ? { webhookUrl: webhook } : {}),
      boundDatasetIds: body.boundDatasetIds ?? [],
      enabled: true,
      messageCount: 0,
      createdAt: new Date().toISOString(),
    };
    _channels.push(channel);
    return HttpResponse.json(channel, { status: 201 });
  }),

  http.put('/api/v1/channels/:id', async ({ params, request }) => {
    const c = _channels.find((c) => c.id === params['id']);
    if (!c) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as ChannelCreateInput & { enabled?: boolean };
    if (body.name !== undefined) c.name = body.name;
    if (body.webhookUrl !== undefined) c.webhookUrl = body.webhookUrl;
    if (body.boundDatasetIds !== undefined) c.boundDatasetIds = body.boundDatasetIds;
    if (body.enabled !== undefined) c.enabled = body.enabled;
    return HttpResponse.json(c);
  }),

  http.delete('/api/v1/channels/:id', ({ params }) => {
    const idx = _channels.findIndex((c) => c.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    _channels.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
