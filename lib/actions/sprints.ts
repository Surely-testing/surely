// ============================================
// lib/actions/sprints.ts
// FIXED - Removed revalidatePath for client component compatibility
// ============================================

import type { SprintFormData } from '@/types/sprint.types';
import { createClient } from '../supabase/client';

export async function createSprint(suiteId: string, data: SprintFormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: sprint, error } = await supabase
    .from('sprints')
    .insert({
      suite_id: suiteId,
      created_by: user.id,
      name: data.name,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status || 'planning',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: sprint };
}

export async function updateSprint(sprintId: string, data: Partial<SprintFormData>) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: sprint, error } = await supabase
    .from('sprints')
    .update(data)
    .eq('id', sprintId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: sprint };
}

export async function deleteSprint(sprintId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Check sprint status before deletion
  const { data: sprint, error: fetchError } = await supabase
    .from('sprints')
    .select('status')
    .eq('id', sprintId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!sprint) {
    return { error: 'Sprint not found' };
  }

  // Handle null status and validate
  if (!sprint.status || !['planning', 'archived', 'on-hold'].includes(sprint.status)) {
    return { error: 'Cannot delete active or completed sprints' };
  }

  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', sprintId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateSprintStatus(sprintId: string, status: 'planning' | 'active' | 'completed' | 'archived') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: sprint, error } = await supabase
    .from('sprints')
    .update({ status })
    .eq('id', sprintId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: sprint };
}

export async function assignToSprint(itemType: 'test_case' | 'bug', itemId: string, sprintId: string | null) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const table = itemType === 'test_case' ? 'test_cases' : 'bugs';
  
  const { error } = await supabase
    .from(table)
    .update({ sprint_id: sprintId })
    .eq('id', itemId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}