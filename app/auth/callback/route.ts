// ============================================
// FILE: app/auth/callback/route.ts (UPDATED WITH AUTO-DETECTION)
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { isCommonEmailProvider, extractDomainName } from '@/utils/domainValidator'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const provider = requestUrl.searchParams.get('provider')

  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`, request.url)
    )
  }

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(
      new URL('/login?error=missing_code&error_description=No%20verification%20code%20provided', request.url)
    )
  }

  const response = NextResponse.next()
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(
      new URL(`/login?error=verification_failed&error_description=${encodeURIComponent(exchangeError.message)}`, request.url)
    )
  }

  if (!data.session?.user) {
    console.error('No session or user after code exchange')
    return NextResponse.redirect(
      new URL('/login?error=verification_failed&error_description=Session%20creation%20failed', request.url)
    )
  }

  const user = data.session.user
  const userEmail = user.email || ''

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_type, registration_completed, status, organization_id')
    .eq('id', user.id)
    .single()

  // AUTO-DETECT account type for OAuth users
  if (!profile && (provider === 'google' || provider === 'github')) {
    console.log('OAuth user - auto-detecting account type from email domain')
    
    // Auto-detect account type based on email domain
    const isPublicEmail = isCommonEmailProvider(userEmail)
    const accountType = isPublicEmail ? 'individual' : 'organization'
    const tierName = accountType === 'individual' ? 'Freelancer' : 'Pro'
    
    console.log(`Detected account type: ${accountType} for email: ${userEmail}`)

    // Create profile with auto-detected account type
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: userEmail,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        status: 'active',
        registration_completed: false,
        account_type: accountType, // AUTO-DETECTED
      })

    if (createError) {
      console.error('Profile creation error:', createError)
      return NextResponse.redirect(
        new URL(`/login?error=profile_creation_failed&error_description=${encodeURIComponent(createError.message)}`, request.url)
      )
    }

    // If organization account, create organization
    let organizationId = null
    if (accountType === 'organization') {
      const orgName = extractDomainName(userEmail) || 'My Organization'
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          owner_id: user.id,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single()

      if (orgError) {
        console.error('Organization creation error:', orgError)
        // Don't fail the whole flow, just log it
      } else {
        organizationId = org.id
        
        // Update profile with organization_id
        await supabase
          .from('profiles')
          .update({ organization_id: organizationId })
          .eq('id', user.id)
      }
    }

    // Create trial subscription
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier_name: tierName,
        status: 'trialing',
        trial_end: trialEndDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndDate.toISOString(),
      })

    if (subError) {
      console.error('Subscription creation error:', subError)
      // Don't fail the whole flow
    }

    // Redirect to onboarding
    console.log('Redirecting new OAuth user to onboarding')
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Profile exists but no account_type set (edge case - shouldn't happen with new flow)
  if (profile && !profile.account_type) {
    console.log('Profile exists without account_type - auto-detecting')
    
    const isPublicEmail = isCommonEmailProvider(userEmail)
    const accountType = isPublicEmail ? 'individual' : 'organization'
    
    // Update profile with detected account type
    await supabase
      .from('profiles')
      .update({ account_type: accountType })
      .eq('id', user.id)
    
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Check account status
  if (profile?.status === 'inactive') {
    return NextResponse.redirect(
      new URL(`/auth/reactivate?email=${encodeURIComponent(userEmail)}`, request.url)
    )
  }

  // Registration not completed - go to onboarding
  if (profile && !profile.registration_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // All good - go to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}