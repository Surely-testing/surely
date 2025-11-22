// ============================================
// FILE: lib/actions/test-suites.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTestSuite(data: {
  name: string
  description?: string
  owner_type: 'individual' | 'organization'
  owner_id: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: suite, error } = await supabase
    .from('test_suites')
    .insert({
      name: data.name,
      description: data.description || null,
      owner_type: data.owner_type,
      owner_id: data.owner_id,
      created_by: user.id,
      admins: [user.id],
      members: [user.id],
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/suites')
  return { success: true, suite }
}

export async function getTestSuite(suiteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: suite, error } = await supabase
    .from('test_suites')
    .select('*')
    .eq('id', suiteId)
    .single()

  if (error) {
    return { error: error.message }
  }

  if (!suite) {
    return { error: 'Suite not found' }
  }

  // Verify user has access (is owner, admin, or member)
  const hasAccess = 
    (suite.owner_type === 'individual' && suite.owner_id === user.id) ||
    suite.admins?.includes(user.id) ||
    suite.members?.includes(user.id)

  if (!hasAccess) {
    return { error: 'Access denied' }
  }

  return { success: true, suite }
}

// Also add a function to get all suites for a user
export async function getUserTestSuites() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: suites, error } = await supabase
    .from('test_suites')
    .select('*')
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { success: true, suites: suites || [] }
}

export async function updateTestSuite(
  suiteId: string,
  data: { name?: string; description?: string }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('test_suites')
    .update(data)
    .eq('id', suiteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${suiteId}`)
  return { success: true }
}

export async function deleteTestSuite(suiteId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('test_suites')
    .update({ status: 'archived' })
    .eq('id', suiteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/suites')
  return { success: true }
}

export async function addSuiteMember(suiteId: string, userId: string, role: 'admin' | 'member') {
  const supabase = await createClient()

  const { data: suite } = await supabase
    .from('test_suites')
    .select('admins, members')
    .eq('id', suiteId)
    .single()

  if (!suite) {
    return { error: 'Suite not found' }
  }

  // Add null checks and provide default empty arrays
  const currentAdmins = suite.admins ?? []
  const currentMembers = suite.members ?? []

  const updatedAdmins = role === 'admin' ? [...currentAdmins, userId] : currentAdmins
  const updatedMembers = [...currentMembers, userId]

  const { error } = await supabase
    .from('test_suites')
    .update({
      admins: updatedAdmins,
      members: updatedMembers,
    })
    .eq('id', suiteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${suiteId}/members`)
  return { success: true }
}

export async function removeSuiteMember(suiteId: string, userId: string) {
  const supabase = await createClient()

  const { data: suite } = await supabase
    .from('test_suites')
    .select('admins, members')
    .eq('id', suiteId)
    .single()

  if (!suite) {
    return { error: 'Suite not found' }
  }

  // Add null checks and provide default empty arrays
  const currentAdmins = suite.admins ?? []
  const currentMembers = suite.members ?? []

  const { error } = await supabase
    .from('test_suites')
    .update({
      admins: currentAdmins.filter(id => id !== userId),
      members: currentMembers.filter(id => id !== userId),
    })
    .eq('id', suiteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${suiteId}/members`)
  return { success: true }
}