// ============================================
// FILE: app/dashboard/documents/page.tsx (FIXED - CLIENT COMPONENT)
// ============================================
'use client'

import { DocumentsPageView } from '@/components/documents/DocumentsPageView'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { Toaster } from 'sonner'

export default function DocumentsPage() {
  const { suite } = useSuiteContext()

  if (!suite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Loading suite...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster />
      <DocumentsPageView suiteId={suite.id} />
    </>
  )
}