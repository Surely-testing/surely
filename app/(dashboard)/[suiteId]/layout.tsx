// ============================================
// FILE: app/(dashboard)/[suiteId]/layout.tsx
// ============================================
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuiteContextProvider } from '@/providers/SuiteContextProvider'

interface SuiteLayoutProps {
  children: React.ReactNode
  params: { suiteId: string }
}

export default async function SuiteLayout({ children, params }: SuiteLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get suite details - RLS will automatically check access
  const { data: suite, error } = await supabase
    .from('test_suites')
    .select(`
      id,
      name,
      description,
      owner_type,
      owner_id,
      admins,
      members,
      created_at,
      updated_at
    `)
    .eq('id', params.suiteId)
    .single()

  // If suite not found or user doesn't have access
  if (error || !suite) {
    notFound()
  }

  return (
    <SuiteContextProvider suite={suite} userId={user.id}>
      {children}
    </SuiteContextProvider>
  )
}