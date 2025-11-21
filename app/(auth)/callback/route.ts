// ============================================
// FILE: app/api/(auth)/callback/route.ts
// ============================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Auth callback received:', { code: code?.slice(0, 8) })

  // Case 1: No code provided
  if (!code) {
    console.log('No verification code provided')
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
  }

  // Case 2: Process verification code
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange failed:', exchangeError)
      return NextResponse.redirect(
        new URL('/login?error=invalid_code', requestUrl.origin)
      )
    }
    
    // Get user and profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user after code exchange')
      return NextResponse.redirect(new URL('/login?error=no_user', requestUrl.origin))
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Still redirect to dashboard even if profile fetch fails
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
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
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    }

    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))

  } catch (error) {
    // Case 3: Unexpected error
    console.error('Unexpected auth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected', requestUrl.origin)
    )
  }
}

// Handle POST requests (some OAuth providers use POST)
export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  // Redirect POST to GET handler
  return NextResponse.redirect(requestUrl, 307)
}