// ============================================
// FILE: lib/actions/test-runs.ts
// Server actions for test runs - matches your schema exactly
// ============================================
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface TestRunFormData {
  name: string;
  description?: string | null;
  environment: 'development' | 'staging' | 'qa' | 'production';
  test_type?: 'manual' | 'automated' | 'exploratory' | 'regression' | 'smoke';
  status?: 'pending' | 'in-progress' | 'passed' | 'failed' | 'blocked' | 'skipped';
  assigned_to?: string | null;
  scheduled_date?: string | null;
  executed_at?: string | null;
  completed_at?: string | null;
  test_case_ids?: string[];
  total_count?: number;
  passed_count?: number;
  failed_count?: number;
  blocked_count?: number;
  skipped_count?: number;
  notes?: string | null;
  attachments?: any[];
  sprint_ids?: string[];
  additional_case_ids?: string[];
}

export async function createTestRun(suiteId: string, data: TestRunFormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: testRun, error } = await supabase
    .from('test_runs')
    .insert({
      suite_id: suiteId,
      created_by: user.id,
      name: data.name,
      description: data.description || null,
      environment: data.environment,
      test_type: data.test_type || 'manual',
      status: data.status || 'pending',
      assigned_to: data.assigned_to || null,
      scheduled_date: data.scheduled_date || null,
      executed_at: data.executed_at || null,
      completed_at: data.completed_at || null,
      test_case_ids: data.test_case_ids || [],
      total_count: data.total_count || 0,
      passed_count: data.passed_count || 0,
      failed_count: data.failed_count || 0,
      blocked_count: data.blocked_count || 0,
      skipped_count: data.skipped_count || 0,
      notes: data.notes || null,
      attachments: data.attachments || [],
      sprint_ids: data.sprint_ids || [],
      additional_case_ids: data.additional_case_ids || []
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/test-runs`);
  return { data: testRun };
}

export async function updateTestRun(testRunId: string, data: Partial<TestRunFormData>) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const updatePayload: any = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.environment !== undefined) updatePayload.environment = data.environment;
  if (data.test_type !== undefined) updatePayload.test_type = data.test_type;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.assigned_to !== undefined) updatePayload.assigned_to = data.assigned_to;
  if (data.scheduled_date !== undefined) updatePayload.scheduled_date = data.scheduled_date;
  if (data.executed_at !== undefined) updatePayload.executed_at = data.executed_at;
  if (data.completed_at !== undefined) updatePayload.completed_at = data.completed_at;
  if (data.test_case_ids !== undefined) updatePayload.test_case_ids = data.test_case_ids;
  if (data.total_count !== undefined) updatePayload.total_count = data.total_count;
  if (data.passed_count !== undefined) updatePayload.passed_count = data.passed_count;
  if (data.failed_count !== undefined) updatePayload.failed_count = data.failed_count;
  if (data.blocked_count !== undefined) updatePayload.blocked_count = data.blocked_count;
  if (data.skipped_count !== undefined) updatePayload.skipped_count = data.skipped_count;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.attachments !== undefined) updatePayload.attachments = data.attachments;
  if (data.sprint_ids !== undefined) updatePayload.sprint_ids = data.sprint_ids;
  if (data.additional_case_ids !== undefined) updatePayload.additional_case_ids = data.additional_case_ids;

  const { data: testRun, error } = await supabase
    .from('test_runs')
    .update(updatePayload)
    .eq('id', testRunId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/test-runs`);
  revalidatePath(`/[suiteId]/test-runs/[runId]`);
  return { data: testRun };
}

export async function deleteTestRun(testRunId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('test_runs')
    .delete()
    .eq('id', testRunId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/test-runs`);
  return { success: true };
}