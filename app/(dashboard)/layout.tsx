// ============================================
// FILE: app/(dashboard)/layout.tsx
// ============================================
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get all accessible test suites
  const { data: suites } = await supabase
    .from('test_suites')
    .select('id, name, description, owner_type, owner_id, created_at')
    .order('created_at', { ascending: false })

  return (
    <DashboardShell user={user} profile={profile} suites={suites || []}>
      {children}
    </DashboardShell>
  )
}