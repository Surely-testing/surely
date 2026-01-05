// ============================================
// FILE: app/dashboard/test-runs/[testRunId]/execute/page.tsx
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
          status: 'pending',
          executed_at: null,
          duration_seconds: null,
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
      logger.log('Saving test result:', { testCaseId, result })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      // Update the main test_run_results record
      const { error: updateError } = await supabase
        .from('test_run_results')
        .update({
          status: result.status,
          notes: result.notes || null,
          duration_seconds: result.duration_seconds || null,
          executed_at: result.executed_at,
          executed_by: user.id
        })
        .eq('test_run_id', testRunId)
        .eq('test_case_id', testCaseId)

      if (updateError) {
        logger.log('Error updating test result:', updateError)
        throw updateError
      }

      logger.log('Test result updated successfully')
      
      // Update the test case status accordingly
      const { data: currentTestCase } = await supabase
        .from('test_cases')
        .select('execution_count, pass_count, fail_count')
        .eq('id', testCaseId)
        .single()

      const updateData: any = {
        status: result.status,
        last_result: result.status,
        last_executed_at: result.executed_at,
        last_executed_by: user.id,
        updated_at: new Date().toISOString(),
        execution_count: (currentTestCase?.execution_count || 0) + 1
      }

      if (result.status === 'passed') {
        updateData.pass_count = (currentTestCase?.pass_count || 0) + 1
        updateData.last_pass_date = result.executed_at
      }

      if (result.status === 'failed') {
        updateData.fail_count = (currentTestCase?.fail_count || 0) + 1
        updateData.last_fail_date = result.executed_at
      }

      const { error: testCaseUpdateError } = await supabase
        .from('test_cases')
        .update(updateData)
        .eq('id', testCaseId)

      if (testCaseUpdateError) {
        logger.log('Error updating test case status:', testCaseUpdateError)
        // Don't throw - this is secondary update
      } else {
        logger.log('Test case status updated to:', result.status)
      }

      // Create/update execution history record
      const durationMinutes = result.duration_seconds 
        ? Math.round(result.duration_seconds / 60) 
        : null;

      try {
        const { error: historyError } = await supabase
          .from('test_execution_history')
          .upsert({
            test_run_id: testRunId,
            test_case_id: testCaseId,
            status: result.status,
            executed_at: result.executed_at,
            duration_minutes: durationMinutes,
            notes: result.notes || null,
            executed_by: user.id
          }, {
            onConflict: 'test_case_id,test_run_id'
          })

        if (historyError) {
          logger.log('History save error (non-critical):', historyError)
        }
      } catch (historyError) {
        logger.log('Execution history error (non-critical):', historyError)
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

      // Determine final status based on results
      const hasFailed = results?.some(r => r.status === 'failed')
      const hasBlocked = results?.some(r => r.status === 'blocked')
      const hasPending = results?.some(r => r.status === 'pending')
      const allPassed = results?.every(r => r.status === 'passed' || r.status === 'skipped')
      
      let finalStatus = 'passed'
      if (hasFailed) {
        finalStatus = 'failed'
      } else if (hasBlocked) {
        finalStatus = 'blocked'
      } else if (hasPending) {
        finalStatus = 'in-progress'
      } else if (!allPassed) {
        finalStatus = 'in-progress'
      }

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