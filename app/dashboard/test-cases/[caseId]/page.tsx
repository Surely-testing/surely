// ============================================
// FILE: app/(dashboard)/[suiteId]/test-cases/[caseId]/page.tsx
// ============================================
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TestCaseDetail } from '@/components/test-cases/TestCaseDetails';

interface TestCaseDetailPageProps {
  params: { suiteId: string; caseId: string }
}

export async function generateMetadata({ params }: TestCaseDetailPageProps) {
  const supabase = await createClient()
  const { data: testCase } = await supabase
    .from('test_cases')
    .select('title')
    .eq('id', params.caseId)
    .eq('suite_id', params.suiteId)
    .single()

  return {
    title: testCase?.title || 'Test Case',
  }
}

export default async function TestCaseDetailPage({ params }: TestCaseDetailPageProps) {
  const supabase = await createClient()

  const { data: testCase, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('id', params.caseId)
    .eq('suite_id', params.suiteId)
    .single()

  if (error || !testCase) {
    notFound()
  }

  return <TestCaseDetail testCase={testCase} suiteId={params.suiteId} />
}