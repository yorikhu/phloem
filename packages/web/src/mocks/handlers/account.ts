/**
 * Account mock handlers (F5.5)
 */
import { http, HttpResponse } from 'msw';
import { seedCurrentUser } from '../data/seed.js';

let _user = { ...seedCurrentUser };

export const accountHandlers = [
  http.get('/api/v1/account', () => {
    return HttpResponse.json(_user);
  }),

  http.put('/api/v1/account', async ({ request }) => {
    const body = (await request.json()) as { name?: string; avatarUrl?: string };
    if (body.name !== undefined) _user = { ..._user, name: body.name };
    if (body.avatarUrl !== undefined) _user = { ..._user, avatarUrl: body.avatarUrl };
    return HttpResponse.json(_user);
  }),
];
