// ============================================
// FILE: lib/actions/organizations.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createOrganization(data: { name: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      owner_id: user.id,
      created_by: user.id,
    })
    .select()
    .single()

  if (orgError) {
    return { error: orgError.message }
  }

  // Add creator as owner member
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    return { error: memberError.message }
  }

  revalidatePath('/organizations')
  return { success: true, organization: org }
}

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
  return { success: true }
}