// ============================================
// FILE: lib/actions/account.ts
// ============================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAccountEmail(email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({ email })
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Delete user data (cascading deletes will handle related records)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}