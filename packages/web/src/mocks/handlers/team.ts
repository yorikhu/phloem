/**
 * Team mock handlers (F5.4)
 */
import { http, HttpResponse } from 'msw';
import type { MemberRole, TeamMember } from '@phloem/shared';

interface InviteInput {
  email?: string;
  role?: MemberRole;
}

const _members: TeamMember[] = [
  {
    id: 'mem-1',
    name: '攸悠',
    email: 'you@phloem.dev',
    role: 'owner',
    status: 'active',
    joinedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'mem-2',
    name: '林可',
    email: 'lin@phloem.dev',
    role: 'admin',
    status: 'active',
    joinedAt: '2026-08-05T00:00:00Z',
  },
  {
    id: 'mem-3',
    name: '陈默',
    email: 'chen@phloem.dev',
    role: 'member',
    status: 'invited',
    joinedAt: '2026-08-15T00:00:00Z',
  },
];

export const teamHandlers = [
  http.get('/api/v1/team/members', () => {
    return HttpResponse.json(_members);
  }),

  http.post('/api/v1/team/members', async ({ request }) => {
    const body = (await request.json()) as InviteInput;
    if (!body.email) {
      return HttpResponse.json({ message: 'email required' }, { status: 400 });
    }
    const existing = _members.find((m) => m.email === body.email);
    if (existing) {
      return HttpResponse.json({ message: '成员已存在' }, { status: 409 });
    }
    const member: TeamMember = {
      id: `mem-${Date.now()}`,
      name: body.email.split('@')[0] ?? 'New Member',
      email: body.email,
      role: body.role ?? 'member',
      status: 'invited',
      joinedAt: new Date().toISOString(),
    };
    _members.push(member);
    return HttpResponse.json(member, { status: 201 });
  }),

  http.put('/api/v1/team/members/:id/role', async ({ params, request }) => {
    const m = _members.find((m) => m.id === params['id']);
    if (!m) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as InviteInput;
    if (m.role === 'owner') {
      return HttpResponse.json({ message: '不能修改所有者角色' }, { status: 403 });
    }
    if (body.role) m.role = body.role;
    return HttpResponse.json(m);
  }),

  http.delete('/api/v1/team/members/:id', ({ params }) => {
    const idx = _members.findIndex((m) => m.id === params['id']);
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    if (_members[idx]?.role === 'owner') {
      return HttpResponse.json({ message: '不能移除所有者' }, { status: 403 });
    }
    _members.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
