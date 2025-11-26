// ============================================
// FILE: app/dashboard/test-runs/[testRunId]/execute/page.tsx
// Test Run Execution Page
// ============================================
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import TestRunExecutionView from '@/components/test-runs/TestRunExecutionView'

export default function TestRunExecutionPage({ 
  params 
}: { 
  params: Promise<{ testRunId: string }> 
}) {
  const { testRunId } = use(params)
  const router = useRouter()
  const { supabase } = useSupabase()
  const [testRun, setTestRun] = useState<any | null>(null)
  const [testCases, setTestCases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTestRunData()
  }, [testRunId])

  const fetchTestRunData = async () => {
    try {
      setIsLoading(true)

      const { data: runData, error: runError } = await supabase
        .from('test_runs')
        .select('*')
        .eq('id', testRunId)
        .single()

      if (runError) throw runError

      const { data: resultsData, error: resultsError } = await supabase
        .from('test_run_results')
        .select(`
          *,
          test_case:test_cases(*)
        `)
        .eq('test_run_id', testRunId)

      if (resultsError) throw resultsError

      const cases = resultsData?.map((result: any) => result.test_case).filter(Boolean) || []

      setTestRun(runData)
      setTestCases(cases)

      if (runData.status === 'pending') {
        await supabase
          .from('test_runs')
          .update({ 
            status: 'in-progress',
            executed_at: new Date().toISOString()
          })
          .eq('id', testRunId)
      }

    } catch (error) {
      console.error('Error fetching test run data:', error)
      toast.error('Failed to load test run')
      router.push(`/dashboard/test-runs/${testRunId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateResult = async (testCaseId: string, result: any) => {
    try {
      const { data: resultData } = await supabase
        .from('test_run_results')
        .select('id')
        .eq('test_run_id', testRunId)
        .eq('test_case_id', testCaseId)
        .single()

      if (resultData) {
        await supabase
          .from('test_run_results')
          .update({
            status: result.status,
            notes: result.notes,
            duration: result.duration,
            executed_at: result.executed_at
          })
          .eq('id', resultData.id)
      }

      toast.success('Test result saved')
    } catch (error) {
      console.error('Error updating test result:', error)
      toast.error('Failed to save test result')
      throw error
    }
  }

  const handleCompleteRun = async () => {
    try {
      const { data: results } = await supabase
        .from('test_run_results')
        .select('status')
        .eq('test_run_id', testRunId)

      const hasFailed = results?.some(r => r.status === 'failed')
      const finalStatus = hasFailed ? 'failed' : 'passed'

      await supabase
        .from('test_runs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', testRunId)

      toast.success('Test run completed')
    } catch (error) {
      console.error('Error completing test run:', error)
      toast.error('Failed to complete test run')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!testRun || testCases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No test cases to execute</p>
          <button
            onClick={() => router.push(`/dashboard/test-runs/${testRunId}`)}
            className="btn-primary px-4 py-2"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <TestRunExecutionView
      testRunId={testRunId}
      testRun={testRun}
      testCases={testCases}
      onBack={() => router.push(`/dashboard/test-runs/${testRunId}`)}
      onUpdateResult={handleUpdateResult}
      onCompleteRun={handleCompleteRun}
    />
  )
}