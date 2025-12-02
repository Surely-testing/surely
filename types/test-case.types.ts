// ============================================
// types/test-case.types.ts
// ============================================

import type { Tables } from './database.types';

export type TestCase = Tables<'test_cases'>;

export type TestCaseWithCreator = TestCase & {
  creator?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export type TestCasePriority = 'low' | 'medium' | 'high' | 'critical';
export type TestCaseStatus = 'active' | 'archived' | 'deleted';

export interface TestCaseStep {
  id: string;
  order: number;
  action: string;
  expected?: string;
}

export interface TestCaseFormData {
  title: string;
  description?: string;
  steps?: TestCaseStep[];
  expected_result?: string;
  priority?: TestCasePriority;
  sprint_id?: string | null;
}

export interface TestCaseFilters {
  status?: TestCaseStatus[];
  priority?: TestCasePriority[];
  sprint_id?: string | null;
  created_by?: string;
  search?: string;
}

export type TestCaseSortBy = 'created_at' | 'updated_at' | 'title' | 'priority';
export type TestCaseSortOrder = 'asc' | 'desc';

export interface TestCaseSort {
  by: TestCaseSortBy;
  order: TestCaseSortOrder;
}

export interface TestCaseStats {
  total: number;
  by_priority: Record<TestCasePriority, number>;
  by_status: Record<TestCaseStatus, number>;
  by_sprint: Record<string, number>;
}

