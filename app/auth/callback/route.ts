import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url)
    )
  }

  const supabase = await createClient()

  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.session?.user) {
    console.error('Auth exchange failed:', exchangeError)
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    )
  }

  const user = data.session.user

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_type, registration_completed')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch failed:', profileError)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (profile.account_type === 'organization' && !profile.registration_completed) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
