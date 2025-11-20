// ============================================
// FILE: app/auth/callback/route.ts
// ============================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Case 1: No code provided
  if (!code) {
    console.log('No verification code provided')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  // Case 2: Process verification code
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange failed:', exchangeError)
      return NextResponse.redirect(
        new URL('/login?error=invalid_code', request.url)
      )
    }
    
    // Get user and profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user after code exchange')
      return NextResponse.redirect(new URL('/login?error=no_user', request.url))
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Still redirect to dashboard even if profile fetch fails
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Mark registration as completed
    await supabase
      .from('profiles')
      .update({ registration_completed: true })
      .eq('id', user.id)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'email_verified',
      resource_type: 'profile',
      resource_id: user.id,
      metadata: { verification_method: 'email' },
    })

    // Smart routing based on account type
    const isOrganization = profile.account_type === 'organization'
    const hasCompletedOnboarding = profile.organization_website || profile.registration_completed

    if (isOrganization && !hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch (error) {
    // Case 3: Unexpected error
    console.error('Unexpected auth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected', request.url)
    )
  }

  // This line is now unreachable but good practice to include
  // (TypeScript compiler will be happy)
  return NextResponse.redirect(new URL('/login', request.url))
}
