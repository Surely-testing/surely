// ============================================
// types/member.types.ts
// ============================================

import { Tables } from "./database.types";

export type SuiteMemberRole = 'admin' | 'member';

export interface SuiteMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: SuiteMemberRole;
  joined_at: string;
}

export type OrgMemberRole = 'owner' | 'admin' | 'manager' | 'member';
export type OrgMemberStatus = 'active' | 'inactive';

export type OrganizationMember = Tables<'organization_members'> & {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

export interface InviteMemberFormData {
  email: string;
  role: SuiteMemberRole | OrgMemberRole;
}

export type Invitation = Tables<'invitations'>;

export type InvitationType = 'organization' | 'testSuite';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';
