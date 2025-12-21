// ============================================
// FILE: app/dashboard/page.tsx
// ============================================
'use client'

import { SuiteOverview } from "@/components/suites/SuiteOverview"
import { useSuiteContext } from "@/providers/SuiteContextProvider"

export default function DashboardPage() {
  const { suite: currentSuite } = useSuiteContext()
  
  if (!currentSuite?.id) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Suite Selected</h2>
          <p className="text-sm text-muted-foreground">Please select a test suite from the sidebar</p>
        </div>
      </div>
    )
  }
  
  return <SuiteOverview suiteId={currentSuite.id} suiteName={currentSuite.name} />
}