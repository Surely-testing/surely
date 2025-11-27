// ============================================
// FILE: lib/actions/security.ts
// ============================================
'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}