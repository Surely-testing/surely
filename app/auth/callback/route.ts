// ============================================
// FILE: app/auth/callback/route.ts (FIXED)
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`, request.url)
    )
  }

  // No code provided
  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(
      new URL('/login?error=missing_code&error_description=No%20verification%20code%20provided', request.url)
    )
  }

  // Create response to set cookies
  const response = NextResponse.next()
  const cookieStore = await cookies()

  // Create Supabase client with proper cookie handling
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

  // Exchange code for session
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

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_type, registration_completed, status')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    // Still redirect to dashboard even if profile fetch fails
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check account status
  if (profile.status === 'inactive') {
    return NextResponse.redirect(
      new URL(`/auth/reactivate?email=${encodeURIComponent(user.email || '')}`, request.url)
    )
  }

  // Redirect to onboarding if organization account not completed
  if (profile.account_type === 'organization' && !profile.registration_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Success - redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}