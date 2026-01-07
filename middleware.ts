// ============================================
// FILE: middleware.ts (ROOT LEVEL - SINGLE SOURCE OF TRUTH)
// Replaces both middleware.ts and proxy.ts
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ===================================
  // ROUTE DEFINITIONS (Single Source)
  // ===================================
  
  // Always allow these paths (no auth check)
  const alwaysPublicPaths = [
    '/auth/callback',
    '/verify-email',
    '/auth/reactivate',
    '/select-account-type',
  ]
  
  // Public marketing pages (accessible to everyone, auth or not)
  const publicMarketingPaths = [
    '/',
    '/features',
    '/pricing',
    '/about',
    '/contact',
  ]
  
  // Auth pages (login/signup - redirect to dashboard if authenticated)
  const authPaths = ['/login', '/signup']
  
  // Protected routes (require authentication)
  const protectedPaths = [
    '/dashboard',
    '/subscription',
    '/settings',
    '/profile',
    '/suites',
    '/organizations',
    '/create-suite',
    '/test-suites',
  ]

  // Check route types
  const isAlwaysPublic = alwaysPublicPaths.includes(path)
  const isPublicMarketing = publicMarketingPaths.includes(path)
  const isAuthPage = authPaths.includes(path)
  const isProtected = protectedPaths.some(route => path.startsWith(route))

  // ===================================
  // EARLY RETURNS (No Auth Needed)
  // ===================================
  
  // Always allow callback and verify-email
  if (isAlwaysPublic) {
    return response
  }

  // Allow public marketing pages for everyone
  if (isPublicMarketing) {
    return response
  }

  // ===================================
  // NOT AUTHENTICATED
  // ===================================
  
  if (!user) {
    // Block protected routes
    if (isProtected || path === '/onboarding') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Allow auth pages and other public routes
    return response
  }

  // ===================================
  // AUTHENTICATED - Profile Check
  // ===================================
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('registration_completed, status')
    .eq('id', user.id)
    .single()

  // No profile found
  if (!profile && !path.startsWith('/auth')) {
    return NextResponse.redirect(
      new URL('/login?error=Profile%20not%20found', request.url)
    )
  }

  // Account is inactive
  if (profile?.status === 'inactive' && !path.startsWith('/auth/reactivate')) {
    return NextResponse.redirect(
      new URL(`/auth/reactivate?email=${encodeURIComponent(user.email || '')}`, request.url)
    )
  }

  // Registration incomplete - force onboarding
  if (profile && !profile.registration_completed) {
    if (path !== '/onboarding' && isProtected) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return response
  }

  // Registration complete
  if (profile?.registration_completed) {
    // Redirect auth pages to dashboard
    if (isAuthPage || path === '/onboarding') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}