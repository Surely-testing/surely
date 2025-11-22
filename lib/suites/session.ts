// ==========================================
// FILE: lib/suites/session.ts
// ==========================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCurrentSuiteFromSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('No user found in session check')
    return null
  }

  console.log('Getting session for user:', user.id)

  // Get current suite from session
  const { data: session, error: sessionError } = await supabase
    .from('user_sessions')
    .select('current_suite_id')
    .eq('user_id', user.id)
    .single()

  console.log('Session data:', session, 'Error:', sessionError)

  // If no session or no suite set, get first suite and set it
  if (!session?.current_suite_id) {
    console.log('No suite in session, getting first suite...')
    
    const { data: firstSuite, error: suiteError } = await supabase
      .from('test_suites')
      .select('id')
      .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('First suite:', firstSuite?.id, 'Error:', suiteError)

    if (firstSuite) {
      await setCurrentSuite(firstSuite.id)
      return firstSuite.id
    }

    console.log('No suites found for user')
    return null
  }

  console.log('Current suite from session:', session.current_suite_id)
  return session.current_suite_id
}

export async function setCurrentSuite(suiteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('No user found, cannot set suite')
    return { error: 'Not authenticated' }
  }

  console.log('Setting current suite:', suiteId, 'for user:', user.id)

  // Verify user has access to this suite
  const { data: suite, error: accessError } = await supabase
    .from('test_suites')
    .select('id')
    .eq('id', suiteId)
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .single()

  if (accessError || !suite) {
    console.log('User does not have access to suite:', suiteId)
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
    console.log('Error upserting session:', upsertError)
    return { error: upsertError.message }
  }

  console.log('Suite set successfully')
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