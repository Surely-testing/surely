// ============================================
// FILE: app/dashboard/test-runs/[testRunId]/page.tsx
// Test Run Details View with Execution Tracking
// ============================================
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Play, Pause, CheckCircle, XCircle, 
  Clock, Calendar, User, Settings, FileText, 
  Edit, Trash2, AlertCircle 
} from 'lucide-react'
import Link from 'next/link'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export default function TestRunDetailsPage({ 
  params 
}: { 
  params: Promise<{ testRunId: string }> 
}) {
  const { testRunId } = use(params)
  const router = useRouter()
  const { supabase } = useSupabase()
  const [testRun, setTestRun] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    fetchTestRunDetails()
  }, [testRunId])

  const fetchTestRunDetails = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('test_runs')
        .select(`
          *,
          test_run_results (
            *,
            test_case:test_cases (*)
          )
        `)
        .eq('id', testRunId)
        .single()

      if (error) throw error
      setTestRun(data)
    } catch (error) {
      console.error('Error fetching test run:', error)
      toast.error('Failed to load test run details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartExecution = async () => {
  setIsExecuting(true)
  try {
    const { error } = await supabase
      .from('test_runs')
      .update({ 
        status: 'in-progress',
        executed_at: new Date().toISOString()
      })
      .eq('id', testRunId)

    if (error) throw error
    
    toast.success('Starting test execution...')
    
    // Navigate to execution interface
    router.push(`/dashboard/test-runs/${testRunId}/execute`)
    
  } catch (error) {
    console.error('Error starting test run:', error)
    toast.error('Failed to start test run')
    setIsExecuting(false)
  }
}

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test run?')) return

    try {
      const { error } = await supabase
        .from('test_runs')
        .delete()
        .eq('id', testRunId)

      if (error) throw error
      
      toast.success('Test run deleted')
      router.push('/dashboard/test-runs')
    } catch (error) {
      console.error('Error deleting test run:', error)
      toast.error('Failed to delete test run')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'blocked':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'skipped':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
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
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'in-progress':
        return <Play className="h-5 w-5 text-blue-600" />
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
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

  const passedCount = testRun.test_run_results?.filter((r: any) => r.status === 'passed').length || 0
  const failedCount = testRun.test_run_results?.filter((r: any) => r.status === 'failed').length || 0
  const totalCount = testRun.test_run_results?.length || 0
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
                {testRun.status}
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
                disabled={isExecuting}
                className="btn-primary inline-flex items-center px-4 py-2 text-sm font-semibold"
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
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-card border border-border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
                  {totalCount - passedCount - failedCount}
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
              Test Cases ({testRun.test_run_results?.length || 0})
            </h2>
            
            <div className="space-y-3">
              {testRun.test_run_results?.map((result: any) => (
                <div
                  key={result.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{result.test_case?.title || 'Unknown Test Case'}</h3>
                      {result.test_case?.priority && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full capitalize",
                          getPriorityColor(result.test_case.priority)
                        )}>
                          {result.test_case.priority}
                        </span>
                      )}
                    </div>
                    {result.test_case?.description && (
                      <p className="text-sm text-muted-foreground">{result.test_case.description}</p>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full capitalize flex-shrink-0",
                    getStatusColor(result.status)
                  )}>
                    {result.status}
                  </span>
                </div>
              ))}
            </div>
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