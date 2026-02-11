// ============================================
// lib/actions/members.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// ── Invite org member ─────────────────────────────────────────────────────────
// Delegates to /api/send-invite so email is always sent from one place.

export async function inviteOrgMember(
  organizationId: string,
  data: { email: string; role: 'admin' | 'manager' | 'member' }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Build absolute URL for the internal API call
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

  const response = await fetch(`${baseUrl}/api/send-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Forward the cookie so the route can authenticate the server-side user
      Cookie: headersList.get('cookie') || '',
    },
    body: JSON.stringify({
      type: 'organization',
      email: data.email,
      organizationId,
      role: data.role,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    return { error: result.error || 'Failed to send invitation' }
  }

  revalidatePath(`/settings/organization`)
  return { success: true, invitationId: result.invitationId }
}

// ── Update org member role ────────────────────────────────────────────────────

export async function updateOrgMemberRole(
  organizationId: string,
  userId: string,
  role: 'admin' | 'manager' | 'member'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

// ── Remove org member ─────────────────────────────────────────────────────────

export async function removeOrgMember(organizationId: string, userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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