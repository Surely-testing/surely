// ============================================
// FILE: app/dashboard/test-cases/test-runs/page.tsx
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Play, ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'

export default function TestRunsPage({ params }: { params: { suiteId: string } }) {
  const { supabase } = useSupabase()
  const [testRuns, setTestRuns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch test runs from database
    setIsLoading(false)
  }, [params.suiteId])

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Test Runs</h1>
            <p className="text-muted-foreground mt-1">
              Execute and track your test cases
            </p>
          </div>
          <Link
            href={`/dashboard/${params.suiteId}/test-runs/new`}
            className="btn-primary inline-flex items-center px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Test Run
          </Link>
        </div>
      </div>

      {testRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Play className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No test runs yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start executing your test cases by creating a new test run
          </p>
          <Link
            href={`/dashboard/${params.suiteId}/test-runs/new`}
            className="btn-primary inline-flex items-center px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Test Run
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          {/* Test runs table will go here */}
          <p className="text-muted-foreground">Test runs will be displayed here</p>
        </div>
      )}
    </div>
  )
}