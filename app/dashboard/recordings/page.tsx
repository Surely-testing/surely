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
      <RecordingsView
        suiteId={suite.id}
        suiteName={suite.name}
        accountId={suite.owner_id}  // Use owner_id instead of account_id
      />
    </>
  )
}