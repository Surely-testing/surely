// ============================================
// TestCasesView.tsx - Cleaned up: Removed Test Runs button
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Upload, Sparkles, GitBranch, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { useBulkActions } from '@/hooks/useBulkActions'
import { TestCaseForm } from './TestCaseForm'
import { TestCaseTable } from './TestCaseTable'
import { TestCaseGrid } from './TestCaseGrid'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAI } from '@/components/ai/AIAssistantProvider'
import { TestCaseControlBar } from './views/TestCaseControlBar'
import { TestCaseDialogs } from './views/TestCaseDialogs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown'
import type { TestCase } from '@/types/test-case.types'
import type { ActionOption } from '@/components/shared/bulk-action/BulkActionBar'
import type {
  ViewMode,
  SortField,
  SortOrder,
  GroupBy,
  TestCasesViewProps,
} from '@/types/test-case-view.types'
import {
  convertToTestCaseRows,
  filterTestCases,
  sortTestCases,
  groupTestCases,
} from './views/test-case-utils'
import { FileQuestion } from 'lucide-react'

export function TestCasesView({ suiteId, canWrite = false }: TestCasesViewProps) {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { setIsOpen, sendMessage } = useAI()

  const { execute: executeBulkAction, isExecuting } = useBulkActions('test_cases', suiteId)

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('testCasesViewMode')
      return (saved as ViewMode) || 'grid'
    }
    return 'grid'
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; itemIds: string[] }>({
    open: false,
    itemIds: []
  })
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; itemIds: string[] }>({
    open: false,
    itemIds: []
  })

  const fetchTestCases = async (silent = false) => {
    if (!silent) setIsLoading(true)
    
    try {
      // Fetch test cases with their latest results in one query
      const { data: testCasesData, error: tcError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false })

      if (tcError) throw tcError
      
      const testCaseIds = testCasesData?.map(tc => tc.id) || []
      
      if (testCaseIds.length > 0) {
        // Fetch latest results for all test cases
        const { data: allResults } = await supabase
          .from('test_run_results')
          .select('test_case_id, status, created_at')
          .in('test_case_id', testCaseIds)
          .order('created_at', { ascending: false })

        // Build a map of latest results
        const latestByTestCase = new Map<string, string>()
        allResults?.forEach((result: any) => {
          if (!latestByTestCase.has(result.test_case_id)) {
            latestByTestCase.set(result.test_case_id, result.status)
          }
        })

        // Merge results into test cases data
        const testCasesWithResults = testCasesData?.map(tc => ({
          ...tc,
          last_result: latestByTestCase.get(tc.id) || tc.last_result
        })) || []

        setTestCases(testCasesWithResults)

        // Silently sync DB in background if there are updates needed
        if (!silent && latestByTestCase.size > 0) {
          const updates = Array.from(latestByTestCase.entries())
            .filter(([tcId, result]) => {
              const tc = testCasesData?.find(t => t.id === tcId)
              return tc && tc.last_result !== result
            })
            .map(([testCaseId, lastResult]) =>
              supabase
                .from('test_cases')
                .update({ last_result: lastResult })
                .eq('id', testCaseId)
            )

          if (updates.length > 0) {
            Promise.all(updates).catch(err => logger.log('Error syncing statuses:', err))
          }
        }
      } else {
        setTestCases([])
      }
    } catch (err: any) {
      logger.log('Error fetching test cases:', err)
      toast.error('Failed to load test cases', { description: err.message })
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTestCases()

    const testCasesChannel = supabase
      .channel(`test_cases:${suiteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'test_cases',
        filter: `suite_id=eq.${suiteId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTestCases(prev => [payload.new as TestCase, ...prev])
          toast.success('Test case created')
        } else if (payload.eventType === 'UPDATE') {
          setTestCases(prev => prev.map(tc => tc.id === payload.new.id ? payload.new as TestCase : tc))
        } else if (payload.eventType === 'DELETE') {
          setTestCases(prev => prev.filter(tc => tc.id !== payload.old.id))
        }
      })
      .subscribe()

    const testRunResultsChannel = supabase
      .channel(`test_run_results:suite:${suiteId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'test_run_results'
      }, async (payload) => {
        const result = payload.new as any

        const { data: testCase } = await supabase
          .from('test_cases')
          .select('id, suite_id')
          .eq('id', result.test_case_id)
          .eq('suite_id', suiteId)
          .single()

        if (testCase) {
          setTestCases(prev => prev.map(tc =>
            tc.id === result.test_case_id
              ? { ...tc, last_result: result.status }
              : tc
          ))

          await supabase
            .from('test_cases')
            .update({ last_result: result.status })
            .eq('id', result.test_case_id)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'test_run_results'
      }, async (payload) => {
        const result = payload.new as any

        const { data: testCase } = await supabase
          .from('test_cases')
          .select('id, suite_id')
          .eq('id', result.test_case_id)
          .eq('suite_id', suiteId)
          .single()

        if (testCase) {
          setTestCases(prev => prev.map(tc =>
            tc.id === result.test_case_id
              ? { ...tc, last_result: result.status }
              : tc
          ))

          await supabase
            .from('test_cases')
            .update({ last_result: result.status })
            .eq('id', result.test_case_id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(testCasesChannel)
      supabase.removeChannel(testRunResultsChannel)
    }
  }, [suiteId, supabase])

  // Show create form
  if (isCreateModalOpen) {
    return (
      <div className="space-y-4 md:space-y-6">
        <TestCaseForm
          suiteId={suiteId}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            fetchTestCases()
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </div>
    )
  }

  const filtered = filterTestCases(testCases, searchQuery, priorityFilter)
  const sorted = sortTestCases(filtered, sortField, sortOrder)
  const grouped = groupTestCases(sorted, groupBy)
  const activeFiltersCount = (priorityFilter !== 'all' ? 1 : 0)

  // Check for default environment
  const checkDefaultEnvironment = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('id')
        .eq('suite_id', suiteId)
        .eq('is_default', true)
        .single()

      if (error || !data) {
        toast.error('No default environment configured', {
          description: 'Please set a default environment in Test Runs page'
        })
        return false
      }
      return true
    } catch (err) {
      toast.error('No default environment configured', {
        description: 'Please set a default environment in Test Runs page'
      })
      return false
    }
  }

  // Handlers
  const handleBulkAction = async (
    actionId: string,
    testCaseIds: string[],
    actionConfig: any,
    option?: ActionOption | null
  ) => {
    try {
      // Handle run action differently based on selection count
      if (actionId === 'run') {
        if (testCaseIds.length > 1) {
          toast.info('Please create a test run to execute multiple test cases', {
            description: 'Use the Test Runs page to create and execute test runs with multiple cases',
            action: {
              label: 'Go to Test Runs',
              onClick: () => router.push('/dashboard/test-runs')
            }
          })
          return
        }

        // Single test case - run immediately
        if (testCaseIds.length === 1) {
          const hasDefaultEnv = await checkDefaultEnvironment()
          if (!hasDefaultEnv) return

          await handleRunSingle(testCaseIds[0])
          return
        }
      }

      // Map other actions
      const actionMap: Record<string, { action: string; options?: any }> = {
        'delete': { action: 'delete' },
        'pass': { action: 'pass' },
        'fail': { action: 'fail' },
        'block': { action: 'block' },
        'reset': { action: 'reset' },
        'archive': { action: 'archive' },
        'activate': { action: 'activate' },
        'assign': {
          action: 'assign',
          options: option?.data || { priority: option?.value }
        },
      }

      const mapping = actionMap[actionId]
      if (!mapping) {
        toast.info('Action not yet implemented')
        return
      }

      await executeBulkAction(
        mapping.action,
        testCaseIds,
        mapping.options,
        () => {
          fetchTestCases(true) // Silent refresh
          setSelectedIds([])
        }
      )
    } catch (error: any) {
      logger.log('Bulk action failed:', error)
      toast.error('Action failed', { description: error.message })
    }
  }

  const handleEdit = (testCaseId: string) => {
    router.push(`/dashboard/test-cases/${testCaseId}/edit`)
  }

  const handleDelete = async (testCaseId: string) => {
    setDeleteDialog({ open: true, itemIds: [testCaseId] })
  }

  const confirmDelete = async () => {
    if (deleteDialog.itemIds.length === 0) return

    await executeBulkAction(
      'delete',
      deleteDialog.itemIds,
      undefined,
      () => {
        setDeleteDialog({ open: false, itemIds: [] })
        fetchTestCases(true) // Silent refresh
      }
    )
  }

  const handleArchive = async (testCaseId: string) => {
    setArchiveDialog({ open: true, itemIds: [testCaseId] })
  }

  const confirmArchive = async () => {
    if (archiveDialog.itemIds.length === 0) return

    await executeBulkAction(
      'archive',
      archiveDialog.itemIds,
      undefined,
      () => {
        setArchiveDialog({ open: false, itemIds: [] })
        fetchTestCases(true) // Silent refresh
      }
    )
  }

  const handleDuplicate = async (testCaseId: string) => {
    try {
      const { data: original, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', testCaseId)
        .single()

      if (fetchError) throw fetchError

      const { id, created_at, updated_at, ...rest } = original

      const { error: insertError } = await supabase
        .from('test_cases')
        .insert({
          ...rest,
          title: `${original.title} (Copy)`,
        })

      if (insertError) throw insertError
      toast.success('Test case duplicated')
      fetchTestCases(true) // Silent refresh
    } catch (error: any) {
      logger.log('Duplicate failed:', error)
      toast.error('Failed to duplicate test case', { description: error.message })
    }
  }

  const handleRunSingle = async (testCaseId: string) => {
    try {
      if (!user) {
        toast.error('You must be logged in to run tests')
        return
      }

      // Get test case details
      const testCase = testCases.find(tc => tc.id === testCaseId)
      if (!testCase) {
        toast.error('Test case not found')
        return
      }

      // Determine if test is automated by checking steps
      const isAutomated = (() => {
        if (testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0) {
          const hasAutomatedSteps = testCase.steps.some((step: any) => step.action)
          if (hasAutomatedSteps) return true
        }
        return testCase.is_automated === true
      })()

      // Get default environment
      const { data: defaultEnv, error: envError } = await supabase
        .from('environments')
        .select('type')
        .eq('suite_id', suiteId)
        .eq('is_default', true)
        .single()

      if (envError || !defaultEnv) {
        toast.error('No default environment found')
        return
      }

      // Create a quick run with the test_type field set
      const { data: testRun, error: runError } = await supabase
        .from('test_runs')
        .insert({
          suite_id: suiteId,
          name: `Quick Run - ${testCase.title}`,
          environment: defaultEnv.type,
          test_type: isAutomated ? 'automated' : 'manual',
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (runError) throw runError

      // Create relationship
      const { error: relError } = await supabase
        .from('asset_relationships')
        .insert({
          source_type: 'test_run',
          source_id: testRun.id,
          target_type: 'test_case',
          target_id: testCaseId,
          relationship_type: 'tests',
          created_by: user.id,
          suite_id: suiteId
        })

      if (relError) throw relError

      // Always go to the same execution page
      router.push(`/dashboard/test-runs/${testRun.id}/execute`)

      toast.success(`${isAutomated ? 'Automated' : 'Manual'} test ready`, {
        description: isAutomated
          ? 'Click Start to begin automated execution'
          : 'Follow the steps to execute the test'
      })

    } catch (error: any) {
      logger.log('Run single failed:', error)
      toast.error('Failed to run test', { description: error.message })
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === sorted.length && sorted.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(sorted.map(tc => tc.id))
    }
  }

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds)
  }

  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('testCasesViewMode', newViewMode)
    }
  }

  const clearFilters = () => {
    setPriorityFilter('all')
    setSortField('created_at')
    setSortOrder('desc')
  }

  const handleAIGenerate = () => {
    setIsOpen(true)
    setTimeout(() => {
      sendMessage(
        `I need to generate test cases for suite ID: ${suiteId}. Please help me create comprehensive test cases. Ask me about the feature or functionality I want to test, and then generate appropriate test cases with titles, descriptions, steps, expected results, and priorities.`
      )
    }, 100)
  }

  const handleRefresh = async () => {
    await fetchTestCases(false)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (testCases.length === 0) {
    const emptyStateActions = canWrite ? [
      {
        label: 'Create Test Case',
        onClick: () => setIsCreateModalOpen(true),
        variant: 'primary' as const,
        icon: Plus,
      },
      {
        label: 'Import Test Cases',
        onClick: () => router.push('/dashboard/test-cases/import'),
        variant: 'secondary' as const,
        icon: Upload,
      },
      {
        label: 'AI Generate',
        onClick: handleAIGenerate,
        variant: 'accent' as const,
        icon: Sparkles,
      },
    ] : undefined

    return (
      <>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Test Cases
          </h1>
          <span className="text-sm text-muted-foreground">(0)</span>
        </div>
        <EmptyState
          icon={FileQuestion}
          iconSize={64}
          title="No test cases yet"
          description="Create your first test case to start testing"
          actions={emptyStateActions}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Test Cases
            </h1>
            <span className="text-sm text-muted-foreground">
              ({testCases.length})
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            {canWrite && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Actions</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Test Case
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/test-cases/import')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/traceability')}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Traceability
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canWrite && (
              <button
                type="button"
                onClick={handleAIGenerate}
                className="inline-flex items-center justify-center px-4 lg:px-4 py-2 text-sm font-semibold text-primary-foreground bg-gradient-accent rounded-lg hover:shadow-glow-accent transition-all duration-200 whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">AI Generate</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isExecuting}
              className="inline-flex items-center justify-center p-2 lg:px-4 lg:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading || isExecuting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <TestCaseControlBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeFiltersCount={activeFiltersCount}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortField(field)
            setSortOrder(order)
          }}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          selectAllChecked={selectedIds.length === sorted.length && sorted.length > 0}
          onSelectAllChange={handleSelectAll}
          isLoading={isLoading || isExecuting}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          onClearFilters={clearFilters}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} of {testCases.length} test cases
            {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
            {isExecuting && ' • Processing...'}
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Filter className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No test cases found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : groupBy === 'none' ? (
          viewMode === 'grid' ? (
            <TestCaseGrid
              testCases={convertToTestCaseRows(sorted)}
              suiteId={suiteId}
              onBulkAction={handleBulkAction}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate}
              onRun={handleRunSingle}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
            />
          ) : (
            <TestCaseTable
              testCases={convertToTestCaseRows(sorted)}
              suiteId={suiteId}
              onBulkAction={handleBulkAction}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate}
              onRun={handleRunSingle}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
            />
          )
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([groupName, groupTestCases]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase">
                    {groupName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({groupTestCases.length})
                  </span>
                </div>
                {viewMode === 'grid' ? (
                  <TestCaseGrid
                    testCases={convertToTestCaseRows(groupTestCases)}
                    suiteId={suiteId}
                    onBulkAction={handleBulkAction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    onDuplicate={handleDuplicate}
                    onRun={handleRunSingle}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <TestCaseTable
                    testCases={convertToTestCaseRows(groupTestCases)}
                    suiteId={suiteId}
                    onBulkAction={handleBulkAction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    onDuplicate={handleDuplicate}
                    onRun={handleRunSingle}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <TestCaseDialogs
        deleteDialog={{
          open: deleteDialog.open,
          testCaseId: deleteDialog.itemIds[0] || null
        }}
        onDeleteDialogChange={(state) => setDeleteDialog({
          open: state.open,
          itemIds: state.testCaseId ? [state.testCaseId] : []
        })}
        onConfirmDelete={confirmDelete}
        archiveDialog={{
          open: archiveDialog.open,
          testCaseId: archiveDialog.itemIds[0] || null
        }}
        onArchiveDialogChange={(state) => setArchiveDialog({
          open: state.open,
          itemIds: state.testCaseId ? [state.testCaseId] : []
        })}
        onConfirmArchive={confirmArchive}
        bulkDeleteDialog={{ open: false, count: 0 }}
        onBulkDeleteDialogChange={() => { }}
        onConfirmBulkDelete={() => { }}
        bulkArchiveDialog={{ open: false, count: 0 }}
        onBulkArchiveDialogChange={() => { }}
        onConfirmBulkArchive={() => { }}
      />
    </>
  )
}