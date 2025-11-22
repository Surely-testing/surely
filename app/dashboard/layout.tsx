// ============================================
// FILE: app/dashboard/layout.tsx
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

  console.log('🔍 Dashboard Layout - User:', user.id)

  // Get current suite from session
  const suiteId = await getCurrentSuiteFromSession()

  console.log('📋 Suite ID from session:', suiteId)

  if (!suiteId) {
    console.log('❌ No suite found, redirecting to create-suite')
    redirect('/create-suite')
  }

  // Fetch the full suite details
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select('*')
    .eq('id', suiteId)
    .single()

  console.log('📋 Suite details:', suite?.id, suite?.name, 'Error:', suiteError)

  if (suiteError || !suite) {
    console.log('❌ Could not fetch suite, redirecting to create-suite')
    redirect('/create-suite')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get all accessible test suites for suite switcher
  const { data: suites, error: suitesError } = await supabase
    .from('test_suites')
    .select('id, name, description, owner_type, owner_id, created_at')
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .order('created_at', { ascending: false })

  console.log('📦 All suites:', suites?.length || 0, 'Error:', suitesError)

  return (
    <SuiteContextProvider suite={suite} userId={user.id}>
      <DashboardShell user={user} profile={profile} suites={suites || []}>
        {children}
      </DashboardShell>
    </SuiteContextProvider>
  )
}