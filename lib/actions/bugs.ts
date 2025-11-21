// ============================================
// lib/actions/bugs.ts
// ============================================

import type { BugFormData } from '@/types/bug.types';
import type { Json } from '@/types/database.types';
import { createClient } from '../supabase/client';
import { revalidatePath } from 'next/cache';

export async function createBug(suiteId: string, data: BugFormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: bug, error } = await supabase
    .from('bugs')
    .insert({
      suite_id: suiteId,
      created_by: user.id,
      title: data.title,
      description: data.description,
      severity: data.severity || 'medium',
      status: data.status || 'open',
      steps_to_reproduce: (data.steps_to_reproduce || []) as unknown as Json,
      sprint_id: data.sprint_id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/bugs`);
  return { data: bug };
}

export async function updateBug(bugId: string, data: Partial<BugFormData>) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Prepare the update payload with proper type casting
  const updatePayload: {
    title?: string;
    description?: string | null;
    severity?: string | null;
    status?: string | null;
    steps_to_reproduce?: Json;
    sprint_id?: string | null;
  } = {};

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.severity !== undefined) updatePayload.severity = data.severity;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.steps_to_reproduce !== undefined) updatePayload.steps_to_reproduce = data.steps_to_reproduce as unknown as Json;
  if (data.sprint_id !== undefined) updatePayload.sprint_id = data.sprint_id;

  const { data: bug, error } = await supabase
    .from('bugs')
    .update(updatePayload)
    .eq('id', bugId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/bugs`);
  revalidatePath(`/[suiteId]/bugs/[bugId]`);
  return { data: bug };
}

export async function deleteBug(bugId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('bugs')
    .delete()
    .eq('id', bugId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/bugs`);
  return { success: true };
}

export async function updateBugStatus(bugId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: bug, error } = await supabase
    .from('bugs')
    .update({ status })
    .eq('id', bugId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/bugs`);
  return { data: bug };
}