// ============================================
// FILE: proxy.ts (Next.js 15+ Proxy Format)
// System role + Organization role routing
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================
// ROUTE MATRIX - Single Source of Truth
// ============================================
const ROUTES = {
  // Public - no auth required (marketing pages)
  PUBLIC: [
    '/',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/contact-sales',
    '/events',
    '/careers',
    '/blog',
    '/help',
    '/privacy',
    '/terms',
    '/security',
    '/reviews',
  ],

  // Auth pages - redirect to role-specific dashboard if authenticated
  AUTH: ['/login', '/signup'],

  // Always accessible (bypass all checks)
  BYPASS: ['/auth/callback', '/verify-email', '/auth/reactivate', '/select-account-type'],

  // System role protected routes
  SYSTEM: {
    system_admin: ['/admin'],
  },

  // Organization role protected routes
  ORGANIZATION: {
    owner: ['/org-admin'],
    admin: ['/org-admin'],
  },

  // Shared routes (all authenticated users)
  USER: [
    '/dashboard',
    '/subscription',
    '/settings',
    '/profile',
    '/suites',
    '/organizations',
    '/create-suite',
    '/test-suites',
  ],

  // Special routes
  SHARED: ['/onboarding'],
} as const

// System role hierarchy
type SystemRole = 'system_admin' | 'user'
type OrgRole = 'owner' | 'admin' | 'member' | 'viewer' | null

// Default landing pages
const DEFAULT_ROUTES = {
  system_admin: '/admin',
  user: '/dashboard',
} as const

// ============================================
// ROUTE MATCHING HELPERS
// ============================================
function matchesPath(path: string, routes: readonly string[]): boolean {
  return routes.some(route => path === route || path.startsWith(`${route}/`))
}

function getRouteType(path: string) {
  if (matchesPath(path, ROUTES.BYPASS)) return 'bypass'
  if (matchesPath(path, ROUTES.PUBLIC)) return 'public'
  if (matchesPath(path, ROUTES.AUTH)) return 'auth'
  if (matchesPath(path, ROUTES.SHARED)) return 'shared'
  if (matchesPath(path, ROUTES.USER)) return 'user'

  // Check system admin routes
  if (matchesPath(path, ROUTES.SYSTEM.system_admin)) {
    return { type: 'system', role: 'system_admin' as const }
  }

  // Check organization admin routes
  if (matchesPath(path, ROUTES.ORGANIZATION.owner)) {
    return { type: 'organization', role: 'owner' as const }
  }

  return 'unknown'
}

// ============================================
// MAIN PROXY HANDLER (Named Export)
// ============================================
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const routeType = getRouteType(path)

  // Early return for bypass routes
  if (routeType === 'bypass') {
    return NextResponse.next()
  }

  // CRITICAL: Allow API routes to handle their own authentication
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // CRITICAL: Public routes should pass through WITHOUT auth checks
  // This prevents any authentication flow from being triggered
  if (routeType === 'public') {
    return NextResponse.next()
  }

  // Initialize Supabase client
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ============================================
  // AUTHENTICATION CHECK
  // ============================================
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error in proxy:', sessionError)
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in proxy:', authError)
  }

  // AUTH ROUTES - Allow if not authenticated, redirect if authenticated
  if (!user) {
    if (routeType === 'auth') {
      return response
    }
    // Block protected/shared routes - PRESERVE ORIGINAL URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // ============================================
  // AUTHENTICATED - Fetch Profile
  // ============================================
  let profile = null
  let profileError = null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('registration_completed, status, system_role, organization_role, organization_id')
      .eq('id', user.id)
      .maybeSingle()

    profile = data
    profileError = error

    if (error) {
      console.error('Profile fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId: user.id,
        userEmail: user.email,
        path: path,
      })
    }
  } catch (err) {
    console.error('Profile fetch exception:', err)
    profileError = err as any
  }

  // Profile validation
  if (!profile) {
    console.error('No profile returned for user:', {
      userId: user.id,
      userEmail: user.email,
      error: profileError,
      errorCode: profileError?.code,
      errorMessage: profileError?.message,
      path: path,
    })

    if (path.startsWith('/auth/')) {
      console.log('Allowing auth route without profile:', path)
      return response
    }

    if (profileError?.code === 'PGRST116' || profileError?.message?.includes('RLS')) {
      console.error('❌ RLS is blocking profile fetch! Check your RLS policies.')
    }

    return NextResponse.redirect(
      new URL(`/login?error=Profile%20not%20found&code=${profileError?.code || 'unknown'}`, request.url)
    )
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✓ Profile fetched:', {
      userId: user.id,
      email: user.email,
      systemRole: profile.system_role,
      orgRole: profile.organization_role,
      status: profile.status
    })
  }

  // ============================================
  // ROLE DETERMINATION
  // ============================================
  const systemRole: SystemRole = (profile.system_role as SystemRole) || 'user'
  const orgRole: OrgRole = profile.organization_role as OrgRole
  const defaultRoute = DEFAULT_ROUTES[systemRole]

  // ============================================
  // RULE MATRIX APPLICATION
  // ============================================

  // RULE 1: Inactive accounts → reactivation page
  if (profile.status === 'inactive' && !path.startsWith('/auth/reactivate')) {
    return NextResponse.redirect(
      new URL(`/auth/reactivate?email=${encodeURIComponent(user.email || '')}`, request.url)
    )
  }

  // RULE 2: Incomplete registration → onboarding (system_admin can bypass)
  if (!profile.registration_completed && path !== '/onboarding') {
    if (systemRole !== 'system_admin') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // RULE 3: Auth pages → redirect to role-specific dashboard
  if (routeType === 'auth' || (path === '/onboarding' && profile.registration_completed)) {
    return NextResponse.redirect(new URL(defaultRoute, request.url))
  }

  // RULE 4: Shared routes → allow
  if (routeType === 'shared') {
    return response
  }

  // RULE 5: User routes → all authenticated users can access
  if (routeType === 'user') {
    return response
  }

  // RULE 6: System admin routes → system_role check
  if (typeof routeType === 'object' && routeType.type === 'system') {
    if (systemRole !== 'system_admin') {
      return NextResponse.redirect(
        new URL(`${defaultRoute}?error=System%20admin%20access%20required`, request.url)
      )
    }
    return response
  }

  // RULE 7: Organization admin routes → organization_role check
  if (typeof routeType === 'object' && routeType.type === 'organization') {
    if (orgRole !== 'owner' && orgRole !== 'admin') {
      return NextResponse.redirect(
        new URL(`${defaultRoute}?error=Organization%20admin%20access%20required`, request.url)
      )
    }

    if (!profile.organization_id) {
      return NextResponse.redirect(
        new URL(`${defaultRoute}?error=No%20organization%20assigned`, request.url)
      )
    }

    return response
  }

  // RULE 8: System admins can access org routes
  if (systemRole === 'system_admin' && matchesPath(path, ROUTES.ORGANIZATION.owner)) {
    return response
  }

  // RULE 9: Unknown routes → redirect to role-specific default
  return NextResponse.redirect(new URL(defaultRoute, request.url))
}

// ============================================
// Default Export (Alternative Format)
// ============================================
export default proxy

// ============================================
// Configuration
// ============================================
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// ============================================
// KEY CHANGES
// ============================================
/*
NEXT.JS 15 PROXY FORMAT:
------------------------
1. Function renamed from "middleware" to "proxy"
2. Added both named export and default export
3. Config remains the same

PUBLIC ROUTE FIX:
-----------------
Public routes now bypass ALL auth checks before Supabase client
is even initialized.

MIGRATION STEPS:
----------------
1. Delete your old middleware.ts file (if it exists)
2. Use this as your proxy.ts file
3. Restart your dev server
4. Test public routes (/features, /pricing, etc.)

If you still have middleware.ts and proxy.ts:
- Keep ONLY proxy.ts
- Delete middleware.ts
- Next.js 15 uses proxy.ts as the new convention
*/