// ============================================
// FILE: app/dashboard/traceability/page.tsx
// ============================================
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { TraceabilityMatrix } from '@/components/traceability/TraceabilityMatrix'
import { useSuiteContext } from '@/providers/SuiteContextProvider'

export default function TraceabilityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { suite } = useSuiteContext()
  
  // Get the source from query params (bugs or test-cases)
  const source = searchParams.get('from') || 'bugs'

  const handleClose = () => {
    // Navigate back to the source page
    router.push(`/dashboard/${source}`)
  }

  return <TraceabilityMatrix suiteId={suite.id} onClose={handleClose} />
}