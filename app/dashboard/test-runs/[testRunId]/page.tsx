// ============================================
// FILE: app/dashboard/test-runs/[testRunId]/page.tsx
// COMPLETE FIX - Proper status handling and display
// ============================================
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Pause, CheckCircle, XCircle,
  Clock, Calendar, User, Settings, FileText,
  Edit, Trash2, AlertCircle, Shield, Flag
} from 'lucide-react'
import Link from 'next/link'
import { useSupabase } from '@/providers/SupabaseProvider'
import { relationshipsApi } from '@/lib/api/relationships'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger';


export default function TestRunDetailsPage({
  params
}: {
  params: Promise<{ testRunId: string }>
}) {
  const { testRunId } = use(params)
  const router = useRouter()
  const { supabase } = useSupabase()
  const [testRun, setTestRun] = useState<any | null>(null)
  const [testCases, setTestCases] = useState<any[]>([])
  const [testRunResults, setTestRunResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchTestRunDetails()
  }, [testRunId])

  const fetchTestRunDetails = async () => {
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
      }

      // Fetch test run results if they exist
      const { data: resultsData } = await supabase
        .from('test_run_results')
        .select('*')
        .eq('test_run_id', testRunId)

      setTestRunResults(resultsData || [])

    } catch (error) {
      logger.log('Error fetching test run:', error)
      toast.error('Failed to load test run details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartExecution = async () => {
    setIsExecuting(true)
    try {
      // Create test_run_results for each test case if they don't exist
      if (testCases.length > 0) {
        const resultsToCreate = testCases.map(tc => ({
          test_run_id: testRunId,
          test_case_id: tc.id,
          status: 'pending', // FIXED: Changed from 'not_executed'
          executed_at: null,
          duration_seconds: null, // FIXED: Changed from 'duration'
          notes: null
        }))

        await supabase
          .from('test_run_results')
          .upsert(resultsToCreate, {
            onConflict: 'test_run_id,test_case_id',
            ignoreDuplicates: true
          })
      }

      const { error } = await supabase
        .from('test_runs')
        .update({
          status: 'in-progress',
          executed_at: new Date().toISOString()
        })
        .eq('id', testRunId)

      if (error) throw error

      toast.success('Starting test execution...')
      router.push(`/dashboard/test-runs/${testRunId}/execute`)

    } catch (error) {
      logger.log('Error starting test run:', error)
      toast.error('Failed to start test run')
      setIsExecuting(false)
    }
  }

  const handleDelete = async () => {
    try {
      // Delete relationships using the correct method
      await relationshipsApi.deleteAllForAsset('test_run' as any, testRunId)

      // Delete test run results
      await supabase
        .from('test_run_results')
        .delete()
        .eq('test_run_id', testRunId)

      // Delete test run
      const { error } = await supabase
        .from('test_runs')
        .delete()
        .eq('id', testRunId)

      if (error) throw error

      toast.success('Test run deleted')
      router.push('/dashboard/test-runs')
    } catch (error) {
      logger.log('Error deleting test run:', error)
      toast.error('Failed to delete test run')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'blocked':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'skipped':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      case 'pending': // FIXED: Added pending status
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      case 'in_progress':
      case 'in-progress':
        return <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'blocked':
        return <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      case 'skipped':
        return <Flag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      case 'pending': // FIXED: Added pending status
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!testRun) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Test run not found</p>
          <Link
            href="/dashboard/test-runs"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to Test Runs
          </Link>
        </div>
      </div>
    )
  }

  // FIXED: Calculate stats from results with proper status handling
  const passedCount = testRunResults.filter(r => r.status === 'passed').length
  const failedCount = testRunResults.filter(r => r.status === 'failed').length
  const blockedCount = testRunResults.filter(r => r.status === 'blocked').length
  const skippedCount = testRunResults.filter(r => r.status === 'skipped').length
  const pendingCount = testRunResults.filter(r => r.status === 'pending').length
  const totalCount = testCases.length
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/test-runs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Runs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{testRun.name}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium capitalize",
                getStatusColor(testRun.status)
              )}>
                {testRun.status.replace('_', ' ')}
              </span>
            </div>
            {testRun.description && (
              <p className="text-muted-foreground">{testRun.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {testRun.status === 'pending' && (
              <button
                onClick={handleStartExecution}
                disabled={isExecuting || testCases.length === 0}
                className="btn-primary inline-flex items-center px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Execution
              </button>
            )}
            <Link
              href={`/dashboard/test-runs/${testRun.id}/edit`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-card border border-border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Test Run</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{testRun.name}"? This will also delete all test results and relationships. 
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <button
                      onClick={() => setShowDeleteDialog(false)}
                      className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Progress Summary</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{passedCount}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {pendingCount}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pass Rate</span>
                <span className="font-medium text-foreground">{passRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-600 h-full transition-all duration-500"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Test Cases ({testCases.length})
            </h2>

            {testCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No test cases linked to this test run</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testCases.map((testCase: any) => {
                  // FIXED: Proper status handling with 'pending' as default
                  const result = testRunResults.find(r => r.test_case_id === testCase.id)
                  const status = result?.status || 'pending'

                  return (
                    <div
                      key={testCase.id}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        {getStatusIcon(status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{testCase.title}</h3>
                          {testCase.priority && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full capitalize",
                              getPriorityColor(testCase.priority)
                            )}>
                              {testCase.priority}
                            </span>
                          )}
                        </div>
                        {testCase.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{testCase.description}</p>
                        )}
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full capitalize flex-shrink-0",
                        getStatusColor(status)
                      )}>
                        {status === 'pending' ? 'Not Executed' : status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {testRun.notes && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{testRun.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Environment</div>
                  <div className="font-medium text-foreground capitalize">{testRun.environment}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Test Type</div>
                  <div className="font-medium text-foreground capitalize">{testRun.test_type}</div>
                </div>
              </div>

              {testRun.assigned_to && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned To</div>
                    <div className="font-medium text-foreground">{testRun.assigned_to}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium text-foreground">
                    {new Date(testRun.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {testRun.scheduled_date && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Scheduled</div>
                    <div className="font-medium text-foreground">
                      {new Date(testRun.scheduled_date).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {testRun.executed_at && (
                <div className="flex items-start gap-3">
                  <Play className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Executed</div>
                    <div className="font-medium text-foreground">
                      {new Date(testRun.executed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}