// ============================================
// FILE: lib/actions/organizations.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// REMOVED: createOrganization function - orgs are created during registration only

export async function updateOrganization(orgId: string, data: { name?: string }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/organizations/${orgId}`)
  revalidatePath('/settings/account')
  return { success: true }
}

export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'manager' | 'member'
) {
  const supabase = await createClient()

  const { error } = await supabase.from('organization_members').insert({
    organization_id: orgId,
    user_id: userId,
    role,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/organizations/${orgId}/members`)
  revalidatePath('/settings/account')
  return { success: true }
}

export async function updateOrganizationMemberRole(
  orgId: string,
  userId: string,
  role: 'admin' | 'manager' | 'member'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/organizations/${orgId}/members`)
  revalidatePath('/settings/account')
  return { success: true }
}

export async function removeOrganizationMember(orgId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/organizations/${orgId}/members`)
  revalidatePath('/settings/account')
  return { success: true }
}