// ============================================
// FILE: lib/actions/auth.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: {
  email: string
  password: string
  name: string
  accountType: 'individual' | 'organization'
}) {
  const supabase = await createClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email: formData.email,
    name: formData.name,
    account_type: formData.accountType,
    registration_completed: false,
    created_by: authData.user.id,
  })

  if (profileError) {
    return { error: profileError.message }
  }

  // Create free subscription
  const { data: freeTier } = await supabase
    .from('subscription_tiers')
    .select('id')
    .eq('name', 'free')
    .single()

  if (freeTier) {
    await supabase.from('subscriptions').insert({
      user_id: authData.user.id,
      tier_id: freeTier.id,
      status: 'active',
    })
  }

  return { success: true }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}