// ============================================
// app/dashboard/recordings/page.tsx
// ============================================
'use client'

import { RecordingsView } from '@/components/Recordings/RecordingsView'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { Toaster } from 'sonner'

export default function RecordingsPage() {
  const { suite } = useSuiteContext()

  return (
    <>
      <Toaster />
      <RecordingsView suiteId={suite.id} />
    </>
  )
}