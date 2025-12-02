// ============================================
// FILE: app/auth/callback/route.ts
// ============================================
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    console.log('Callback received with code:', code ? 'present' : 'missing')

    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.redirect(
        new URL('/login?error=No verification code provided', request.url)
      )
    }

    const supabase = await createClient()
    
    console.log('Exchanging code for session...')
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    console.log('Session created, getting user...')
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.redirect(
        new URL('/login?error=Could not get user information', request.url)
      )
    }

    console.log('User found:', user.id, 'Checking profile...')
    
    // Check registration status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('registration_completed')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Profile might not exist yet, redirect to login
      return NextResponse.redirect(
        new URL('/login?error=Profile not found. Please try signing up again.', request.url)
      )
    }

    console.log('Profile found, registration_completed:', profile?.registration_completed)
    
    // If registration not complete, go to onboarding
    if (!profile?.registration_completed) {
      console.log('Redirecting to onboarding')
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    
    // Registration complete, go to dashboard
    console.log('Redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
    
  } catch (error: any) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('An unexpected error occurred')}`, request.url)
    )
  }
}