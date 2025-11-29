// ============================================
// FILE 1: lib/actions/members.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function inviteOrgMember(
  organizationId: string,
  data: { email: string; role: 'admin' | 'manager' | 'member' }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'You do not have permission to invite members' }
  }

  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('type', 'organization')
    .eq('organization_id', organizationId)
    .eq('invitee_email', data.email)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return { error: 'An invitation has already been sent to this email' }
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.email)
    .single()

  if (profiles) {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', profiles.id)
      .single()

    if (existingMember) {
      return { error: 'This user is already a member of the organization' }
    }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase.from('invitations').insert({
    type: 'organization',
    organization_id: organizationId,
    invitee_email: data.email,
    invited_by: user.id,
    role: data.role,
    expires_at: expiresAt.toISOString(),
    status: 'pending',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/settings/organization`)
  return { success: true }
}

export async function updateOrgMemberRole(
  organizationId: string,
  userId: string,
  role: 'admin' | 'manager' | 'member'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'You do not have permission to update member roles' }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/settings/organization`)
  return { success: true }
}

export async function removeOrgMember(organizationId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'You do not have permission to remove members' }
  }

  const { data: targetMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  if (targetMember?.role === 'owner') {
    return { error: 'Cannot remove the organization owner' }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/settings/organization`)
  return { success: true }
}

