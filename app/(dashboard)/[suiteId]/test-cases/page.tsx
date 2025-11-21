// ============================================
// FILE: app/(dashboard)/[suiteId]/test-cases/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import TestCasesView from '@/components/test-cases/TestCasesView'

interface TestCasesPageProps {
  params: { suiteId: string }
}

export const metadata = {
  title: 'Test Cases',
  description: 'Manage your test cases',
}

export default async function TestCasesPage({ params }: TestCasesPageProps) {
  const supabase = await createClient()

  // Fetch test cases for this suite
  const { data: testCases } = await supabase
    .from('test_cases')
    .select('*')
    .eq('suite_id', params.suiteId)
    .order('created_at', { ascending: false })

  return <TestCasesView suiteId={params.suiteId} testCases={testCases || []} />
}