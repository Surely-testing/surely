// ============================================
// lib/actions/members.ts
// ============================================

'use server'

import type { InviteMemberFormData } from '@/types/member.types';
import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteSuiteMember(suiteId: string, data: InviteMemberFormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      type: 'testSuite',
      suite_id: suiteId,
      invitee_email: data.email,
      invited_by: user.id,
      role: data.role as 'admin' | 'member',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/members`);
  return { data: invitation };
}

export async function removeSuiteMember(suiteId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Get current suite
  const { data: suite, error: fetchError } = await supabase
    .from('test_suites')
    .select('members, admins')
    .eq('id', suiteId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  // Remove from both arrays
  const newMembers = (suite.members || []).filter(id => id !== userId);
  const newAdmins = (suite.admins || []).filter(id => id !== userId);

  const { error } = await supabase
    .from('test_suites')
    .update({ members: newMembers, admins: newAdmins })
    .eq('id', suiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/members`);
  return { success: true };
}

export async function updateSuiteMemberRole(suiteId: string, userId: string, role: 'admin' | 'member') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Get current suite
  const { data: suite, error: fetchError } = await supabase
    .from('test_suites')
    .select('members, admins')
    .eq('id', suiteId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  let newMembers = suite.members || [];
  let newAdmins = suite.admins || [];

  if (role === 'admin') {
    // Move from members to admins
    newMembers = newMembers.filter(id => id !== userId);
    if (!newAdmins.includes(userId)) newAdmins.push(userId);
  } else {
    // Move from admins to members
    newAdmins = newAdmins.filter(id => id !== userId);
    if (!newMembers.includes(userId)) newMembers.push(userId);
  }

  const { error } = await supabase
    .from('test_suites')
    .update({ members: newMembers, admins: newAdmins })
    .eq('id', suiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/members`);
  return { success: true };
}

export async function inviteOrgMember(orgId: string, data: InviteMemberFormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      type: 'organization',
      organization_id: orgId,
      invitee_email: data.email,
      invited_by: user.id,
      role: data.role as 'admin' | 'manager' | 'member',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations/[orgId]`);
  return { data: invitation };
}

export async function removeOrgMember(orgId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations/[orgId]`);
  return { success: true };
}

export async function updateOrgMemberRole(orgId: string, userId: string, role: 'admin' | 'manager' | 'member') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations/[orgId]`);
  return { success: true };
}