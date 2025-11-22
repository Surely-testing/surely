// ============================================
// FILE: lib/actions/onboarding.ts
// ============================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Update profile to mark registration as complete
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ registration_completed: true })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'onboarding_completed',
    resource_type: 'profile',
    resource_id: user.id,
  })

  revalidatePath('/')
  return { success: true }
}