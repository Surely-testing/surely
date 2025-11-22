// ==========================================
// FILE: proxy.ts (SIMPLIFIED FOR SESSION)
// ==========================================
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

  // Protected dashboard routes
  const isDashboardRoute = path.startsWith('/dashboard')
  const protectedRoutes = ['/subscription', '/settings', '/profile', '/suites', '/organizations', '/create-suite']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) || isDashboardRoute

  // Public auth routes
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(path)

  // Allow auth callback and verify-email
  if (path === '/auth/callback' || path === '/verify-email') {
    return response
  }

  // Protected routes - redirect to login if not authenticated
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to login if accessing onboarding without being authenticated
  if (!user && path === '/onboarding') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('registration_completed, status')
      .eq('id', user.id)
      .single()

    // Check if account is inactive
    if (profile?.status === 'inactive' && !path.startsWith('/auth/reactivate')) {
      return NextResponse.redirect(
        new URL(`/auth/reactivate?email=${encodeURIComponent(user.email || '')}`, request.url)
      )
    }

    // If registration not complete, redirect to onboarding
    if (profile && !profile.registration_completed && path !== '/onboarding' && isProtectedRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // If registration complete
    if (profile?.registration_completed) {
      // Redirect from onboarding/home/auth to dashboard
      if (path === '/onboarding' || path === '/' || isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // No profile
    if (!profile && !path.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/login?error=Profile not found', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|service-worker.js|register-sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}