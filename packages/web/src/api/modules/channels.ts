/**
 * Chat channel API (F8.3)
 */
import { request } from '../http.js';
import type { ChatChannel } from '@phloem/shared';

export interface ChannelCreate {
  name: string;
  type: ChatChannel['type'];
  webhookUrl?: string;
  boundDatasetIds?: string[];
}

export interface ChannelUpdate {
  name?: string;
  webhookUrl?: string;
  boundDatasetIds?: string[];
  enabled?: boolean;
}

export const channels = {
  list() {
    return request<ChatChannel[]>('/channels');
  },

  create(body: ChannelCreate) {
    return request<ChatChannel>('/channels', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(id: string, body: ChannelUpdate) {
    return request<ChatChannel>(`/channels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  remove(id: string) {
    return request<void>(`/channels/${id}`, { method: 'DELETE' });
  },
};
