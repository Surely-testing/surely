// ==========================================
// FILE: lib/suites/session.ts
// ==========================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger';

export async function getCurrentSuiteFromSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    logger.log('No user found in session check')
    return null
  }

  logger.log('Getting session for user:', user.id)

  // Get current suite from session
  const { data: session, error: sessionError } = await supabase
    .from('user_sessions')
    .select('current_suite_id')
    .eq('user_id', user.id)
    .single()

  // If no session or no suite set, get first suite and set it
  if (!session?.current_suite_id) {
    
    const { data: firstSuite, error: suiteError } = await supabase
      .from('test_suites')
      .select('id')
      .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()


    if (firstSuite) {
      await setCurrentSuite(firstSuite.id)
      return firstSuite.id
    }

    return null
  }
  return session.current_suite_id
}

export async function setCurrentSuite(suiteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  logger.log('Setting current suite:', suiteId, 'for user:', user.id)

  // Verify user has access to this suite
  const { data: suite, error: accessError } = await supabase
    .from('test_suites')
    .select('id')
    .eq('id', suiteId)
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .single()

  if (accessError || !suite) {
    return { error: 'Access denied' }
  }

  // Upsert session
  const { error: upsertError } = await supabase
    .from('user_sessions')
    .upsert({
      user_id: user.id,
      current_suite_id: suiteId,
      updated_at: new Date().toISOString()
    })

  if (upsertError) {
    logger.log('Error upserting session:', upsertError)
    return { error: upsertError.message }
  }

  logger.log('Suite set successfully')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function clearCurrentSuite() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', user.id)
}