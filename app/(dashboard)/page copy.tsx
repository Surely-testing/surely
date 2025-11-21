// ============================================
// FILE: app/(dashboard)/page.tsx
// ============================================
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's first accessible suite
  const { data: firstSuite } = await supabase
    .from('test_suites')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // If user has suites, redirect to first one
  if (firstSuite) {
    redirect(`/${firstSuite.id}`)
  }

  // If no suites, redirect to suite selector
  redirect('/suites')
}