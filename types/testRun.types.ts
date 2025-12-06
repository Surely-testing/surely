// ============================================
// types/testRun.types.ts
// ============================================

export interface TestRun {
  id: string;
  suite_id: string;
  name: string;
  description: string | null;
  environment: 'development' | 'staging' | 'qa' | 'production';
  test_type: 'manual' | 'automated' | 'exploratory' | 'regression' | 'smoke';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assigned_to: string | null;
  scheduled_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  id: string;
  suite_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  sprint_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Sprint {
  id: string;
  suite_id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  goals: string | null;
  test_case_ids: string[] | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}