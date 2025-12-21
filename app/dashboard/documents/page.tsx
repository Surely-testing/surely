// ============================================
// app/dashboard/documents/page.tsx
// ============================================
'use client'

import { DocumentsPageView } from '@/components/documents/DocumentsPageView'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { Toaster } from 'sonner'

export default function DocumentsPage() {
  const { suite } = useSuiteContext()

  return (
    <>
      <Toaster />
      <DocumentsPageView suiteId={suite.id} />
    </>
  )
}