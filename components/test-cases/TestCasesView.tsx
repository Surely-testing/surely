'use client'

import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Upload, Sparkles, Play, GitBranch, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
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
import type { TestCaseRow } from './TestCaseTable'
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

  // State
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ open: false, testCaseId: null })
  const [archiveDialog, setArchiveDialog] = useState<DialogState>({ open: false, testCaseId: null })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<BulkDialogState>({ open: false, count: 0 })
  const [bulkArchiveDialog, setBulkArchiveDialog] = useState<BulkDialogState>({ open: false, count: 0 })

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

  useEffect(() => {
    fetchTestCases()

    const channel = supabase
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

    return () => { supabase.removeChannel(channel) }
  }, [suiteId, supabase])

  // Show form if creating/editing
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

  // Computed values
  const filtered = filterTestCases(testCases, searchQuery, priorityFilter, statusFilter)
  const sorted = sortTestCases(filtered, sortField, sortOrder)
  const grouped = groupTestCases(sorted, groupBy)
  const activeFiltersCount = (priorityFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)

  // Handlers
  const moveToTrash = async (testCaseId: string) => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    try {
      const { data: testCase, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', testCaseId)
        .single()

      if (fetchError) throw fetchError

      // Set expiration to 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { error: trashError } = await supabase
        .from('trash')
        .insert({
          suite_id: suiteId,
          asset_type: 'testCases',
          asset_id: testCaseId,
          asset_data: testCase,
          deleted_by: user.id,
          expires_at: expiresAt.toISOString()
        })

      if (trashError) throw trashError

      const { error: deleteError } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', testCaseId)

      if (deleteError) throw deleteError

      toast.success('Test case moved to trash')
    } catch (error: any) {
      logger.log('Move to trash failed:', error)
      toast.error('Failed to delete test case', { description: error.message })
    }
  }

  const moveToArchive = async (testCaseId: string) => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    try {
      const { data: testCase, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', testCaseId)
        .single()

      if (fetchError) throw fetchError

      const { error: archiveError } = await supabase
        .from('archived_items')
        .insert({
          suite_id: suiteId,
          asset_type: 'testCases',
          asset_id: testCaseId,
          asset_data: testCase,
          archived_by: user.id
        })

      if (archiveError) throw archiveError

      const { error: deleteError } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', testCaseId)

      if (deleteError) throw deleteError

      toast.success('Test case archived')
    } catch (error: any) {
      logger.log('Archive failed:', error)
      toast.error('Failed to archive test case', { description: error.message })
    }
  }

  const handleBulkAction = async (
    actionId: string,
    testCaseIds: string[],
    actionConfig: any,
    option?: ActionOption | null
  ) => {
    try {
      switch (actionId) {
        case 'delete':
          setBulkDeleteDialog({ open: true, count: testCaseIds.length })
          return

        case 'archive':
          setBulkArchiveDialog({ open: true, count: testCaseIds.length })
          return

        case 'change_priority':
          if (!option?.value) return
          const { error: priorityError } = await supabase
            .from('test_cases')
            .update({ priority: option.value })
            .in('id', testCaseIds)

          if (priorityError) throw priorityError
          toast.success(`Updated priority for ${testCaseIds.length} test case${testCaseIds.length > 1 ? 's' : ''}`)
          break

        case 'change_status':
          if (!option?.value) return
          const { error: statusError } = await supabase
            .from('test_cases')
            .update({ status: option.value })
            .in('id', testCaseIds)

          if (statusError) throw statusError
          toast.success(`Updated status for ${testCaseIds.length} test case${testCaseIds.length > 1 ? 's' : ''}`)
          break

        default:
          toast.info('Action not yet implemented')
      }

      await fetchTestCases()
      setSelectedIds([])
    } catch (error: any) {
      logger.log('Bulk action failed:', error)
      toast.error('Action failed', { description: error.message })
    }
  }

  const confirmBulkDelete = async () => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    try {
      const { data: testCasesData, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .in('id', selectedIds)

      if (fetchError) throw fetchError

      // Set expiration to 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const trashItems = testCasesData.map(tc => ({
        suite_id: suiteId,
        asset_type: 'testCases' as const,
        asset_id: tc.id,
        asset_data: tc,
        deleted_by: user.id,
        expires_at: expiresAt.toISOString()
      }))

      const { error: trashError } = await supabase
        .from('trash')
        .insert(trashItems)

      if (trashError) throw trashError

      const { error: deleteError } = await supabase
        .from('test_cases')
        .delete()
        .in('id', selectedIds)

      if (deleteError) throw deleteError

      toast.success(`Moved ${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} to trash`)
      setSelectedIds([])
      setBulkDeleteDialog({ open: false, count: 0 })
      await fetchTestCases()
    } catch (error: any) {
      logger.log('Bulk delete failed:', error)
      toast.error('Failed to delete test cases', { description: error.message })
    }
  }

  const confirmBulkArchive = async () => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    try {
      const { data: testCasesData, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .in('id', selectedIds)

      if (fetchError) throw fetchError

      const archiveItems = testCasesData.map(tc => ({
        suite_id: suiteId,
        asset_type: 'testCases' as const,
        asset_id: tc.id,
        asset_data: tc,
        archived_by: user.id
      }))

      const { error: archiveError } = await supabase
        .from('archived_items')
        .insert(archiveItems)

      if (archiveError) throw archiveError

      const { error: deleteError } = await supabase
        .from('test_cases')
        .delete()
        .in('id', selectedIds)

      if (deleteError) throw deleteError

      toast.success(`Archived ${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''}`)
      setSelectedIds([])
      setBulkArchiveDialog({ open: false, count: 0 })
      await fetchTestCases()
    } catch (error: any) {
      logger.log('Bulk archive failed:', error)
      toast.error('Failed to archive test cases', { description: error.message })
    }
  }

  const handleEdit = (testCaseId: string) => {
    router.push(`/dashboard/test-cases/${testCaseId}/edit`)
  }

  const handleDelete = async (testCaseId: string) => {
    setDeleteDialog({ open: true, testCaseId })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.testCaseId) return
    await moveToTrash(deleteDialog.testCaseId)
    setDeleteDialog({ open: false, testCaseId: null })
  }

  const handleArchive = async (testCaseId: string) => {
    setArchiveDialog({ open: true, testCaseId })
  }

  const confirmArchive = async () => {
    if (!archiveDialog.testCaseId) return
    await moveToArchive(archiveDialog.testCaseId)
    setArchiveDialog({ open: false, testCaseId: null })
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

  const clearFilters = () => {
    setPriorityFilter('all')
    setStatusFilter('all')
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

          {/* Action Buttons Container */}
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
              onClick={fetchTestCases}
              disabled={isLoading}
              className="inline-flex items-center justify-center p-2 lg:px-4 lg:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
          onViewModeChange={setViewMode}
          selectAllChecked={selectedIds.length === sorted.length && sorted.length > 0}
          onSelectAllChange={handleSelectAll}
          isLoading={isLoading}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearFilters}
        />

        {/* Stats Bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} of {testCases.length} test cases
            {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
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

      {/* Dialogs */}
      <TestCaseDialogs
        deleteDialog={deleteDialog}
        onDeleteDialogChange={setDeleteDialog}
        onConfirmDelete={confirmDelete}
        archiveDialog={archiveDialog}
        onArchiveDialogChange={setArchiveDialog}
        onConfirmArchive={confirmArchive}
        bulkDeleteDialog={bulkDeleteDialog}
        onBulkDeleteDialogChange={setBulkDeleteDialog}
        onConfirmBulkDelete={confirmBulkDelete}
        bulkArchiveDialog={bulkArchiveDialog}
        onBulkArchiveDialogChange={setBulkArchiveDialog}
        onConfirmBulkArchive={confirmBulkArchive}
      />
    </>
  )
}