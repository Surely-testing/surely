// ============================================
// FILE: lib/actions/documents.ts
// ============================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDocument(data: {
  title: string
  content: any
  file_type: string
  suite_id: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: null }

  try {
    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        title: data.title,
        content: data.content,
        file_type: data.file_type,
        suite_id: data.suite_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { error: error.message, data: null }

    revalidatePath('/dashboard/documents')
    return { data: doc, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}

export async function updateDocument(
  documentId: string,
  updates: { title?: string; content?: any; file_type?: string }
) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    if (error) return { error: error.message, data: null }

    revalidatePath('/dashboard/documents')
    return { data, error: null }
  } catch (err: any) {
    return { error: err.message, data: null }
  }
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/documents')
    return { error: null }
  } catch (err: any) {
    return { error: err.message }
  }
}