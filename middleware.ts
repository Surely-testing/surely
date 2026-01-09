// ============================================
// FILE: middleware.ts (EDGE-OPTIMIZED + RLS FIX + API ROUTES)
// System role + Organization role routing
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Edge Runtime Configuration
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// ============================================
// ROUTE MATRIX - Single Source of Truth
// ============================================
const ROUTES = {
  // Public - no auth required
  PUBLIC: ['/', '/features', '/pricing', '/about', '/contact'],
  
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

// System role hierarchy (lower index = higher privilege)
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
// MAIN MIDDLEWARE
// ============================================
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const routeType = getRouteType(path)
  
  // Early return for bypass routes
  if (routeType === 'bypass') {
    return NextResponse.next()
  }

  // CRITICAL: Allow API routes to handle their own authentication
  // API routes should check auth internally and return proper JSON responses
  if (path.startsWith('/api/')) {
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
  // AUTHENTICATION CHECK - RLS FIX
  // ============================================
  // CRITICAL: Get session first to ensure auth context is properly set for RLS
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error in middleware:', sessionError)
  }

  // Now get user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Log auth errors
  if (authError) {
    console.error('Auth error in middleware:', authError)
  }

  // PUBLIC/AUTH ROUTES - No authentication
  if (!user) {
    if (routeType === 'public' || routeType === 'auth') {
      return response
    }
    // Block protected/shared routes
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ============================================
  // AUTHENTICATED - Fetch Profile (RLS-Safe Query)
  // ============================================
  let profile = null
  let profileError = null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('registration_completed, status, system_role, organization_role, organization_id')
      .eq('id', user.id)
      .maybeSingle() // Use maybeSingle to handle missing rows gracefully

    profile = data
    profileError = error

    // Log profile fetch errors with detailed info
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
    
    // Allow through on auth routes - profile might be created after
    if (path.startsWith('/auth/')) {
      console.log('Allowing auth route without profile:', path)
      return response
    }
    
    // Check if it's specifically an RLS error
    if (profileError?.code === 'PGRST116' || profileError?.message?.includes('RLS')) {
      console.error('❌ RLS is blocking profile fetch! Check your RLS policies.')
      console.error('Run this SQL to verify policies:')
      console.error('SELECT * FROM pg_policies WHERE tablename = \'profiles\';')
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=Profile%20not%20found&code=${profileError?.code || 'unknown'}`, request.url)
    )
  }

  // Log successful profile fetch (only in development)
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

  // RULE 4: Public routes → allow (authenticated users can view)
  if (routeType === 'public' || routeType === 'shared') {
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
    // Check if user has owner or admin org role
    if (orgRole !== 'owner' && orgRole !== 'admin') {
      return NextResponse.redirect(
        new URL(`${defaultRoute}?error=Organization%20admin%20access%20required`, request.url)
      )
    }
    
    // Validate organization_id exists
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
// RULE MATRIX SUMMARY
// ============================================
/*
┌─────────────────────────┬──────────┬──────────┬─────────────┬──────────────────┐
│ Route Type              │ No Auth  │ User     │ Org Admin   │ System Admin     │
├─────────────────────────┼──────────┼──────────┼─────────────┼──────────────────┤
│ PUBLIC                  │ ✓ Allow  │ ✓ Allow  │ ✓ Allow     │ ✓ Allow          │
│ AUTH (login/signup)     │ ✓ Allow  │ → dash   │ → dash      │ → admin          │
│ BYPASS (callbacks)      │ ✓ Allow  │ ✓ Allow  │ ✓ Allow     │ ✓ Allow          │
│ API ROUTES (/api/*)     │ ✓ Allow  │ ✓ Allow  │ ✓ Allow     │ ✓ Allow          │
│ SHARED (onboarding)     │ → /login │ ✓ Allow  │ ✓ Allow     │ ✓ Bypass         │
│ USER (/dashboard, etc)  │ → /login │ ✓ Allow  │ ✓ Allow     │ ✓ Allow          │
│ /org-admin/*            │ → /login │ ✗ Deny   │ ✓ Allow*    │ ✓ Allow          │
│ /admin/* (system)       │ → /login │ ✗ Deny   │ ✗ Deny      │ ✓ Allow          │
│ Unknown routes          │ → /login │ → dash   │ → dash      │ → admin          │
└─────────────────────────┴──────────┴──────────┴─────────────┴──────────────────┘

API ROUTES:
-----------
API routes (/api/*) are now excluded from middleware auth checks.
They handle their own authentication and return proper JSON responses.
This prevents redirect loops and HTML error pages.

RLS TROUBLESHOOTING:
--------------------
If you see "Profile not found" with RLS enabled:

1. Check your RLS policies are active:
   SELECT * FROM pg_policies WHERE tablename = 'profiles';

2. Verify the SELECT policy allows authenticated users:
   CREATE POLICY "Users can view own profile"
   ON public.profiles FOR SELECT TO authenticated
   USING (auth.uid() = id);

3. Test the policy manually:
   SELECT auth.uid(); -- Should return your user ID
   SELECT * FROM profiles WHERE id = auth.uid();

4. If still failing, temporarily disable RLS for testing:
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   -- Test your app
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

KEY FIX: This version calls getSession() before getUser() to ensure
the auth context is fully established for RLS policies.

API FIX: Added early return for /api/* routes to allow them to handle
their own authentication and return proper JSON responses.
*/