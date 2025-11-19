// ==========================================
// FILE: proxy.ts (CORRECTED for Next.js 15)
// ==========================================
// Proxy for authentication and protected routes in Next.js 15

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/subscription', '/settings', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  // Public auth routes
  const authRoutes = ['/login', '/signup', '/', '/auth']
  const isAuthRoute = authRoutes.some(route => path === route || path.startsWith('/auth'))

  // Protected routes - redirect to login if not authenticated
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated, check onboarding status
  if (user) {
    // Fetch user's profile to check onboarding completion and account status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, account_status, deletion_scheduled_at')
      .eq('id', user.id)
      .single()

    // Check if account is hibernated or deleted
    if (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted') {
      if (!path.startsWith('/auth/reactivate')) {
        const redirectUrl = new URL(
          `/auth/reactivate?email=${encodeURIComponent(user.email || '')}&status=${profile.account_status}`,
          request.url
        )
        return NextResponse.redirect(redirectUrl)
      }
    }

    // CRITICAL: Enforce onboarding completion for protected routes
    if (isProtectedRoute && !profile?.onboarding_completed) {
      // User trying to access protected route without completing onboarding
      if (path.startsWith('/subscription')) {
        const redirectUrl = new URL('/onboarding?redirect=/subscription', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      const redirectUrl = new URL('/onboarding', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user completed onboarding but trying to access onboarding page, redirect to dashboard
    if (path.startsWith('/onboarding') && profile?.onboarding_completed) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Auth routes - redirect to dashboard if already authenticated with completed onboarding
    if (isAuthRoute && profile?.onboarding_completed) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Auth routes - redirect to onboarding if authenticated but onboarding not completed
    if (isAuthRoute && !profile?.onboarding_completed && path !== '/onboarding') {
      const redirectUrl = new URL('/onboarding', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, manifest, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|service-worker.js|register-sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}