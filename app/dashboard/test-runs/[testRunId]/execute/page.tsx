// ============================================
// FILE: app/dashboard/test-runs/[testRunId]/execute/page.tsx
// Fixed to use asset_relationships and correct status values
// ============================================
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { relationshipsApi } from '@/lib/api/relationships'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger';
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

      // Fetch test run
      const { data: runData, error: runError } = await supabase
        .from('test_runs')
        .select('*')
        .eq('id', testRunId)
        .single()

      if (runError) throw runError
      setTestRun(runData)

      // Fetch linked test cases from relationships
      const linkedAssets = await relationshipsApi.getLinkedAssets('test_run' as any, testRunId)
      const testCaseAssets = linkedAssets.filter(asset => asset.asset_type === 'test_case')
      
      if (testCaseAssets.length > 0) {
        const testCaseIds = testCaseAssets.map(asset => asset.asset_id)
        
        // Fetch full test case details
        const { data: casesData, error: casesError } = await supabase
          .from('test_cases')
          .select('*')
          .in('id', testCaseIds)

        if (casesError) throw casesError
        setTestCases(casesData || [])

        // Create test_run_results for each test case if they don't exist
        const resultsToCreate = (casesData || []).map(tc => ({
          test_run_id: testRunId,
          test_case_id: tc.id,
          status: 'not_executed',
          executed_at: null,
          duration: null,
          notes: null
        }))

        await supabase
          .from('test_run_results')
          .upsert(resultsToCreate, { 
            onConflict: 'test_run_id,test_case_id',
            ignoreDuplicates: true 
          })
      }

      // Update test run status if pending
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
      logger.log('Error fetching test run data:', error)
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
      logger.log('Error updating test result:', error)
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
      logger.log('Error completing test run:', error)
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