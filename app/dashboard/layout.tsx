// ============================================
// FILE: app/dashboard/layout.tsx (FIXED - No Suite Check)
// ============================================
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSuiteFromSession } from '@/lib/suites/session'
import { SuiteContextProvider } from '@/providers/SuiteContextProvider'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  console.log('Dashboard Layout - User:', user.id)

  // ✅ Get user profile to check registration status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // ✅ If registration not complete, redirect to onboarding
  // This should never happen if login/middleware work correctly, but it's a safety check
  if (!profile || !profile.registration_completed) {
    console.log('Registration not complete, redirecting to onboarding')
    redirect('/onboarding')
  }

  // ✅ Get current suite from session
  const suiteId = await getCurrentSuiteFromSession()

  console.log('uite ID from session:', suiteId)

  // ✅ Get all accessible test suites for suite switcher
  const { data: suites, error: suitesError } = await supabase
    .from('test_suites')
    .select('id, name, description, owner_type, owner_id, created_at')
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .order('created_at', { ascending: false })

  console.log('All suites:', suites?.length || 0, 'Error:', suitesError)

  // ✅ If no suites exist at all, something went wrong - redirect to onboarding
  if (!suites || suites.length === 0) {
    console.log('No suites found, redirecting to onboarding')
    redirect('/onboarding')
  }

  // ✅ Determine which suite to use
  let suiteIdToFetch = suiteId

  if (!suiteIdToFetch || !suites.find(s => s.id === suiteIdToFetch)) {
    // Use the first available suite if no valid suite from session
    suiteIdToFetch = suites[0].id
    console.log('Using first available suite:', suiteIdToFetch)
  }

  // ✅ Fetch full suite details with all required fields
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select('*')
    .eq('id', suiteIdToFetch)
    .single()

  console.log('Suite details:', suite?.id, suite?.name, 'Error:', suiteError)

  if (!suite) {
    console.log('Failed to fetch suite details')
    redirect('/onboarding')
  }

  const finalSuite = suite

  return (
    <SuiteContextProvider suite={finalSuite} userId={user.id}>
      <DashboardShell user={user} profile={profile} suites={suites}>
        {children}
      </DashboardShell>
    </SuiteContextProvider>
  )
}