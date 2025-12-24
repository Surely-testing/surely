// ============================================
// FILE: app/(protected)/dashboard/archive-trash/page.tsx
// ============================================
'use client'

import { ArchiveTrashView } from '@/components/archive-trash/ArchiveTrashView'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { Toaster } from 'sonner'

export default function ArchiveTrashPage() {
  const { suite } = useSuiteContext()

  return (
    <>
      <Toaster />
      <ArchiveTrashView suiteId={suite.id} />
    </>
  )
}