// ============================================
// FILE: lib/actions/auth.ts
// Updated to implement "Taste the Premium" model
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface SignUpData {
  email: string
  password: string
  name: string
  accountType: 'individual' | 'organization'
  organizationName?: string
  organizationIndustry?: string
  organizationSize?: string
}

export async function signUp(formData: SignUpData) {
  const supabase = await createClient()

  // 1. Create auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.name,
        account_type: formData.accountType,
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // 2. Get the appropriate tier based on account type
  const tierName = formData.accountType === 'individual' ? 'Freelancer' : 'Pro'
  
  const { data: tier, error: tierError } = await supabase
    .from('subscription_tiers')
    .select('id, name, price_monthly')
    .eq('name', tierName)
    .single()

  if (tierError || !tier) {
    return { error: 'Failed to get subscription tier' }
  }

  // 3. Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email: formData.email,
    name: formData.name,
    account_type: formData.accountType,
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    created_by: authData.user.id,
  })

  if (profileError) {
    return { error: `Profile creation failed: ${profileError.message}` }
  }

  // 4. Create organization if account type is organization
  let organizationId = null
  if (formData.accountType === 'organization' && formData.organizationName) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: formData.organizationName,
        industry: formData.organizationIndustry,
        size: formData.organizationSize,
        owner_id: authData.user.id,
        status: 'active',
        created_by: authData.user.id,
      })
      .select('id')
      .single()

    if (orgError) {
      console.error('Organization creation failed:', orgError)
      return { error: 'Failed to create organization' }
    }

    organizationId = org.id

    // Add user as admin member
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: authData.user.id,
      role: 'admin',
      status: 'active',
    })
  }

  // 5. Create TRIAL subscription (not free!)
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

  const periodEndDate = new Date(trialEndDate)
  periodEndDate.setMonth(periodEndDate.getMonth() + 1) // First billing cycle

  const { error: subscriptionError } = await supabase.from('subscriptions').insert({
    user_id: authData.user.id,
    tier_id: tier.id,
    status: 'trialing',
    trial_start: new Date().toISOString(),
    trial_end: trialEndDate.toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: periodEndDate.toISOString(),
    billing_cycle: 'monthly',
    cancel_at_period_end: false,
  })

  if (subscriptionError) {
    console.error('Subscription creation failed:', subscriptionError)
    return { error: 'Failed to create subscription' }
  }

  // 6. TODO: Create DodoPayments customer (do this in webhook or separate step)
  // This will be handled when trial ends and they need to add payment method

  // 7. Log activity
  await supabase.from('activity_logs').insert({
    user_id: authData.user.id,
    action: 'user_registered',
    entity_type: 'user',
    entity_id: authData.user.id,
    metadata: {
      account_type: formData.accountType,
      tier: tierName,
      trial_days: 14,
      organization_id: organizationId,
    },
  })

  return { 
    success: true, 
    userId: authData.user.id,
    tier: tierName,
    trialDays: 14 
  }
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