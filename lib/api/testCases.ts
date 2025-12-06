// ============================================
// lib/api/testCases.ts
// ============================================

import { createClient } from '@/lib/supabase/client';
import { TestCase, Sprint } from '@/types/testRun.types';

export async function getTestCases(suiteId: string): Promise<TestCase[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSprints(suiteId: string): Promise<Sprint[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get test cases that belong to a sprint
export async function getSprintTestCases(sprintId: string): Promise<TestCase[]> {
  const supabase = createClient();
  
  // Query test cases that have this sprint_id
  const { data: testCases, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('sprint_id', sprintId);

  if (error) {
    console.error('Error fetching sprint test cases:', error);
    throw error;
  }

  return testCases || [];
}