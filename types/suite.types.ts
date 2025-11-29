// ============================================
// types/suite.types.ts
// ============================================

import { Tables } from './database.types';

export type TestSuite = Tables<'test_suites'>;
export type SuiteMember = Tables<'suite_members'>;

export interface TestSuiteWithStats extends Omit<TestSuite, 'members'> {
  stats?: {
    totalTestCases: number;
    totalBugs: number;
    totalRecordings: number;
    activeSprints: number;
    totalMembers: number;
  };
  memberDetails?: SuiteMemberWithProfile[];
  ownerProfile?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface SuiteMemberWithProfile extends SuiteMember {
  profile?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export type SuiteRole = 'owner' | 'admin' | 'member';

export interface SuiteAccess {
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  role: SuiteRole;
}