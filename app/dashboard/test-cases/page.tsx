// ============================================
// FILE: app/dashboard/test-cases/page.tsx
// ============================================
'use client'

import { TestCasesView } from '@/components/test-cases/TestCasesView'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { Toaster } from 'sonner'

export default function TestCasesPage() {
  const { suite } = useSuiteContext()

  return (
    <>
      <Toaster />
      <TestCasesView suiteId={suite.id} canWrite={true} />
    </>
  )
}