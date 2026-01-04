'use client'

import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Upload, Sparkles, Play, GitBranch, Filter } from 'lucide-react'
import Link from 'next/link'
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
  DialogState,
  BulkDialogState,
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
  
  // Use bulk actions hook
  const { execute: executeBulkAction, isExecuting } = useBulkActions('test_cases', suiteId)

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage or default to 'grid'
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

  // Dialog states - ONLY for single-item operations
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; itemIds: string[] }>({ 
    open: false, 
    itemIds: [] 
  })
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; itemIds: string[] }>({ 
    open: false, 
    itemIds: [] 
  })

  const fetchTestCases = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestCases(data || [])
    } catch (err: any) {
      logger.log('Error fetching test cases:', err)
      toast.error('Failed to load test cases', { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Sync all test case statuses from latest test run results
  const syncAllTestCaseStatuses = async () => {
    try {
      const { data: currentTestCases, error: tcError } = await supabase
        .from('test_cases')
        .select('id')
        .eq('suite_id', suiteId)
      
      if (tcError) throw tcError
      if (!currentTestCases || currentTestCases.length === 0) return

      const testCaseIds = currentTestCases.map(tc => tc.id)

      const { data: allResults, error } = await supabase
        .from('test_run_results')
        .select('test_case_id, status, created_at')
        .in('test_case_id', testCaseIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!allResults || allResults.length === 0) return

      const latestByTestCase = new Map<string, string>()
      allResults.forEach((result: any) => {
        if (!latestByTestCase.has(result.test_case_id)) {
          latestByTestCase.set(result.test_case_id, result.status)
        }
      })

      if (latestByTestCase.size > 0) {
        const updates = Array.from(latestByTestCase.entries()).map(([testCaseId, lastResult]) => 
          supabase
            .from('test_cases')
            .update({ last_result: lastResult })
            .eq('id', testCaseId)
        )

        await Promise.all(updates)
        await fetchTestCases()
        logger.log(`Synced last_result for ${latestByTestCase.size} test cases`)
      }
    } catch (error: any) {
      logger.log('Error syncing test case statuses:', error)
    }
  }

  // Sync individual test case status
  const syncTestCaseStatus = async (testCaseId: string) => {
    try {
      const { data: latestRun, error: fetchError } = await supabase
        .from('test_run_results')
        .select('status')
        .eq('test_case_id', testCaseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (latestRun) {
        const { error: updateError } = await supabase
          .from('test_cases')
          .update({ last_result: latestRun.status })
          .eq('id', testCaseId)

        if (updateError) throw updateError

        setTestCases(prev => prev.map(tc => 
          tc.id === testCaseId 
            ? { ...tc, last_result: latestRun.status }
            : tc
        ))
      }
    } catch (error: any) {
      logger.log('Error syncing test case status:', error)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      await fetchTestCases()
      await syncAllTestCaseStatuses()
    }
    
    initialize()

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

  // Handlers
  const handleBulkAction = async (
    actionId: string,
    testCaseIds: string[],
    actionConfig: any,
    option?: ActionOption | null
  ) => {
    try {
      // NOTE: BulkActionsBar already handles confirmation dialogs,
      // so we just execute the action directly here
      const actionMap: Record<string, { action: string; options?: any }> = {
        'delete': { action: 'delete' },
        'pass': { action: 'pass' },
        'fail': { action: 'fail' },
        'block': { action: 'block' },
        'run': { action: 'run' },
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
          fetchTestCases()
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

  // Single-item delete - shows dialog
  const handleDelete = async (testCaseId: string) => {
    setDeleteDialog({ open: true, itemIds: [testCaseId] })
  }

  // Confirm single-item delete
  const confirmDelete = async () => {
    if (deleteDialog.itemIds.length === 0) return
    
    await executeBulkAction(
      'delete',
      deleteDialog.itemIds,
      undefined,
      () => {
        setDeleteDialog({ open: false, itemIds: [] })
        fetchTestCases()
      }
    )
  }

  // Single-item archive - shows dialog
  const handleArchive = async (testCaseId: string) => {
    setArchiveDialog({ open: true, itemIds: [testCaseId] })
  }

  // Confirm single-item archive
  const confirmArchive = async () => {
    if (archiveDialog.itemIds.length === 0) return
    
    await executeBulkAction(
      'archive',
      archiveDialog.itemIds,
      undefined,
      () => {
        setArchiveDialog({ open: false, itemIds: [] })
        fetchTestCases()
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
      fetchTestCases()
    } catch (error: any) {
      logger.log('Duplicate failed:', error)
      toast.error('Failed to duplicate test case', { description: error.message })
    }
  }

  const handleRun = (testCaseId: string) => {
    router.push(`/dashboard/test-runs/new?testCaseId=${testCaseId}`)
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

  // Handler to persist view mode changes
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

  // Manual refresh with sync
  const handleRefresh = async () => {
    await fetchTestCases()
    await syncAllTestCaseStatuses()
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
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
          <span className="text-sm text-muted-foreground">
            (0)
          </span>
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
        {/* Header with Action Buttons */}
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

            <Link
              href="/dashboard/test-runs"
              className="inline-flex items-center justify-center px-4 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
            >
              <Play className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Test Runs</span>
            </Link>

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

        {/* Control Bar */}
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

        {/* Stats Bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} of {testCases.length} test cases
            {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
            {isExecuting && ' • Processing...'}
          </p>
        </div>

        {/* Content Area */}
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
              onRun={handleRun}
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
              onRun={handleRun}
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
                    onRun={handleRun}
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
                    onRun={handleRun}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs - ONLY for single-item operations from row actions */}
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
        onBulkDeleteDialogChange={() => {}}
        onConfirmBulkDelete={() => {}}
        bulkArchiveDialog={{ open: false, count: 0 }}
        onBulkArchiveDialogChange={() => {}}
        onConfirmBulkArchive={() => {}}
      />
    </>
  )
}