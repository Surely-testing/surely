// ============================================
// FILE: lib/actions/document-collaboration.ts
// Server actions for document collaboration
// ============================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDocumentVisibility(
  documentId: string,
  visibility: 'private' | 'public'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ visibility })
      .eq('id', documentId)
      .eq('created_by', user.id) // Only owner can change visibility
      .select()
      .single()

    if (error) return { error: error.message, data: null }

    revalidatePath('/dashboard/documents')
    return { data, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}

export async function addCollaborator(
  documentId: string,
  userId: string,
  permission: 'view' | 'edit'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  try {
    // Check if user is document owner
    const { data: doc } = await supabase
      .from('documents')
      .select('created_by')
      .eq('id', documentId)
      .single()

    if (!doc || doc.created_by !== user.id) {
      return { error: 'Only document owner can add collaborators', data: null }
    }

    const { data, error } = await supabase
      .from('document_collaborators')
      .insert({
        document_id: documentId,
        user_id: userId,
        permission,
        added_by: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'User is already a collaborator', data: null }
      }
      return { error: error.message, data: null }
    }

    revalidatePath('/dashboard/documents')
    return { data, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}

export async function removeCollaborator(
  documentId: string,
  userId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  try {
    const { error } = await supabase
      .from('document_collaborators')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', userId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/documents')
    return { error: null }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateCollaboratorPermission(
  documentId: string,
  userId: string,
  permission: 'view' | 'edit'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  try {
    const { data, error } = await supabase
      .from('document_collaborators')
      .update({ permission })
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { error: error.message, data: null }

    revalidatePath('/dashboard/documents')
    return { data, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}

export async function getDocumentCollaborators(documentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  try {
    const { data, error } = await supabase
      .from('document_collaborators')
      .select(`
        *,
        user:profiles!document_collaborators_user_id_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('document_id', documentId)

    if (error) return { error: error.message, data: null }

    return { data, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}

export async function getSuiteMembers(suiteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  try {
    // Get suite with members
    const { data: suite, error: suiteError } = await supabase
      .from('test_suites')
      .select('owner_id, admins, members')
      .eq('id', suiteId)
      .single()

    if (suiteError) return { error: suiteError.message, data: null }

    // Collect all user IDs
    const userIds = [
      suite.owner_id,
      ...(suite.admins || []),
      ...(suite.members || [])
    ].filter(Boolean)

    // Get profiles for all members
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds)

    if (profilesError) return { error: profilesError.message, data: null }

    return { data: profiles, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}