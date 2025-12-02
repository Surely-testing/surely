// ============================================
// FILE: app/dashboard/test-cases/traceability/page.tsx
// ============================================
'use client'

import { ArrowLeft, GitBranch } from 'lucide-react'
import Link from 'next/link'

export default function TraceabilityPage({ params }: { params: { suiteId: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/dashboard/test-cases`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Cases
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Traceability Matrix</h1>
            <p className="text-muted-foreground mt-1">
              Track relationships between requirements, test cases, and defects
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Traceability Matrix</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          View and manage the relationships between your requirements, test cases, and bugs to ensure complete test coverage
        </p>
        <p className="text-sm text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}