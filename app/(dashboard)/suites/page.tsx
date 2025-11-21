// ============================================
// FILE: app/(dashboard)/suites/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { SuiteSelectorView } from '@/components/suites/SuiteSelectorView'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Select Test Suite',
  description: 'Choose a test suite to work with',
}

export default async function SuitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Select all fields with *
  const { data: suites } = await supabase
    .from('test_suites')
    .select('*')
    .order('created_at', { ascending: false })

  return <SuiteSelectorView suites={suites || []} userId={user.id} />
}