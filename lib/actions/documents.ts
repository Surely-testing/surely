// ============================================
// lib/actions/documents.ts
// ============================================

import type { DocumentFormData } from '@/types/document.types';
import { createClient } from '../supabase/client';

export async function createDocument(suiteId: string, data: DocumentFormData) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      suite_id: suiteId,
      created_by: user.id,
      title: data.title,
      content: data.content,
      file_url: data.file_url,
      file_type: data.file_type,
      sprint_id: data.sprint_id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/documents`);
  return { data: document };
}

export async function updateDocument(documentId: string, data: Partial<DocumentFormData>) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data: document, error } = await supabase
    .from('documents')
    .update(data)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/documents`);
  revalidatePath(`/[suiteId]/documents/[documentId]`);
  return { data: document };
}

export async function deleteDocument(documentId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/[suiteId]/documents`);
  return { success: true };
}

function revalidatePath(arg0: string) {
    throw new Error('Function not implemented.');
}
