// ============================================
// FILE: app/dashboard/test-runs/page.tsx
// Simplified version matching test-cases pattern
// ============================================
'use client'

import TestRunsView from '@/components/test-runs/TestRunsView'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { Toaster } from 'sonner'

export default function TestRunsPage() {
  const { suite } = useSuiteContext()

  return (
    <>
      <Toaster />
      <TestRunsView suiteId={suite.id} />
    </>
  )
}