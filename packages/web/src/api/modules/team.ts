/**
 * Team API (F5.4)
 */
import { request } from '../http.js';
import type { MemberRole, TeamInvite, TeamMember } from '@phloem/shared';

export interface RoleUpdate {
  role: MemberRole;
}

export const team = {
  list() {
    return request<TeamMember[]>('/team/members');
  },

  invite(body: TeamInvite) {
    return request<TeamMember>('/team/members', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateRole(id: string, body: RoleUpdate) {
    return request<TeamMember>(`/team/members/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  remove(id: string) {
    return request<void>(`/team/members/${id}`, { method: 'DELETE' });
  },
};
