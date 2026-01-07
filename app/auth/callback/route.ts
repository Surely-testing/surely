// ============================================
// FILE: app/auth/callback/route.ts
// SIMPLIFIED - Works WITHOUT custom_access_token_hook
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

  console.log('🔐 Auth callback:', { hasCode: !!code, error })

  // Handle OAuth errors (IGNORE hook errors for now)
  if (error && !error_description?.includes('custom_access_token_hook')) {
    console.error('❌ Auth error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // If it's a hook error, just log it and continue
  if (error_description?.includes('custom_access_token_hook')) {
    console.warn('⚠️ Hook not configured (this is OK - using database queries instead)')
  }

  if (!code) {
    console.error('❌ No code provided')
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url)
    )
  }

  // Initialize Supabase client
  const cookieStore = await cookies()
  const response = NextResponse.next()

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
            // Ignore cookie errors in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore cookie errors
          }
        },
      },
    }
  )

  // Exchange code for session
  console.log('🔄 Exchanging code...')
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    // IMPORTANT: Ignore hook-related errors
    if (exchangeError.message.includes('custom_access_token_hook')) {
      console.warn('⚠️ Hook error (expected) - continuing anyway...')
      // Try to get the session anyway
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        console.log('✅ Session exists despite hook error')
        // Continue with profile setup below
      } else {
        console.error('❌ No session after code exchange')
        return NextResponse.redirect(
          new URL('/login?error=session_failed', request.url)
        )
      }
    } else {
      console.error('❌ Code exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=verification_failed`, request.url)
      )
    }
  }

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('❌ No user in session')
    return NextResponse.redirect(
      new URL('/login?error=no_user', request.url)
    )
  }

  const userEmail = user.email || ''
  console.log('✅ User authenticated:', userEmail)

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, registration_completed, status, organization_id')
    .eq('id', user.id)
    .maybeSingle()

  // Create profile for new OAuth users
  if (!profile) {
    console.log('📝 Creating new profile...')
    
    const isPublicEmail = isCommonEmailProvider(userEmail)
    const accountType = isPublicEmail ? 'individual' : 'organization'
    const tierName = accountType === 'individual' ? 'Freelancer' : 'Pro'
    
    console.log(`Account type: ${accountType}`)

    // Create profile
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: userEmail,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        status: 'active',
        registration_completed: false,
        account_type: accountType,
        system_role: 'user',
      })

    if (createError) {
      console.error('❌ Profile creation failed:', createError)
      return NextResponse.redirect(
        new URL(`/login?error=profile_creation_failed`, request.url)
      )
    }

    console.log('✅ Profile created')

    // Create organization for business emails
    if (accountType === 'organization') {
      const orgName = extractDomainName(userEmail) || 'My Organization'
      
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          owner_id: user.id,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .maybeSingle()

      if (org) {
        await supabase
          .from('profiles')
          .update({ 
            organization_id: org.id,
            organization_role: 'owner'
          })
          .eq('id', user.id)
        
        console.log('✅ Organization created')
      }
    }

    // Create trial subscription
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14)

    await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier_name: tierName,
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
      })

    console.log('🎯 Redirecting to onboarding')
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Handle existing profiles
  if (!profile.account_type) {
    const isPublicEmail = isCommonEmailProvider(userEmail)
    const accountType = isPublicEmail ? 'individual' : 'organization'
    
    await supabase
      .from('profiles')
      .update({ account_type: accountType })
      .eq('id', user.id)
    
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (profile.status === 'inactive') {
    return NextResponse.redirect(
      new URL(`/auth/reactivate?email=${encodeURIComponent(userEmail)}`, request.url)
    )
  }

  if (!profile.registration_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  console.log('✅ Redirecting to dashboard')
  return NextResponse.redirect(new URL('/dashboard', request.url))
}