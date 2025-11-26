// ============================================
// FILE: app/dashboard/test-runs/page.tsx
// Fixed version with proper sprint fetching
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { useTestRuns } from '@/lib/hooks/useTestRuns'
import { useTestCases } from '@/lib/hooks/useTestCases'
import { useSprints } from '@/lib/hooks/useSprints' // Use existing hook
import { toast } from 'sonner'
import TestRunsView from '@/components/test-runs/TestRunsView'
import { Loader2 } from 'lucide-react'

export default function TestRunsPage() {
  const { supabase } = useSupabase()
  const [suiteId, setSuiteId] = useState<string>('')
  const [isLoadingSuite, setIsLoadingSuite] = useState(true)

  // Fetch suite ID first
  useEffect(() => {
    const fetchSuiteId = async () => {
      try {
        const { data: suites } = await supabase
          .from('test_suites')
          .select('id')
          .limit(1)
          .single()
        
        if (suites?.id) {
          setSuiteId(suites.id)
        }
      } catch (error) {
        console.error('Error fetching suite:', error)
        toast.error('Failed to load test suite')
      } finally {
        setIsLoadingSuite(false)
      }
    }

    fetchSuiteId()
  }, [supabase])

  // Use React Query hooks - they will wait until suiteId is set
  const { data: testRuns, isLoading: runsLoading, refetch: refetchRuns } = useTestRuns(suiteId)
  const { data: testCases, isLoading: casesLoading } = useTestCases(suiteId)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(suiteId)

  const isLoading = isLoadingSuite || runsLoading || casesLoading || sprintsLoading

  const handleRefresh = async () => {
    await refetchRuns()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!suiteId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          No test suite found. Please create a test suite first.
        </div>
      </div>
    )
  }

  console.log('Sprints data:', sprints) // Debug log to see what's being fetched

  return (
    <div className="container mx-auto px-4 py-8">
      <TestRunsView
        suiteId={suiteId}
        testRuns={testRuns || []}
        testCases={testCases || []}
        sprints={sprints || []}
        onRefresh={handleRefresh}
      />
    </div>
  )
}