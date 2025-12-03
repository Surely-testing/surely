// ============================================
// FILE: components/test-cases/TestCasesView.tsx
// Mobile-First Responsive - Standard Page Layout
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, RefreshCw, Filter, Upload, Sparkles, Play, GitBranch, ChevronLeft, Grid, List } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { TestCaseForm } from './TestCaseForm'
import { TestCaseTable } from './TestCaseTable'
import { TestCaseGrid } from './TestCaseGrid'
import type { TestCase, TestCasePriority, TestCaseStatus } from '@/types/test-case.types'
import type { TestCaseRow } from './TestCaseTable'
import type { ActionOption } from '@/components/shared/BulkActionBar'

interface TestCasesViewProps {
  suiteId: string
  canWrite?: boolean
}

type ViewMode = 'grid' | 'table'

export function TestCasesView({ suiteId, canWrite = false }: TestCasesViewProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
      console.error('Error fetching test cases:', err)
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
          toast.success('Test case updated')
        } else if (payload.eventType === 'DELETE') {
          setTestCases(prev => prev.filter(tc => tc.id !== payload.old.id))
          toast.success('Test case deleted')
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [suiteId, supabase])

  const filteredTestCases = testCases.filter(tc => {
    const matchesSearch = tc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  const testCaseRows: TestCaseRow[] = filteredTestCases.map(tc => ({
    id: tc.id,
    suite_id: tc.suite_id,
    title: tc.title,
    description: tc.description,
    steps: tc.steps,
    expected_result: tc.expected_result,
    priority: tc.priority,
    status: tc.status,
    sprint_id: tc.sprint_id || null,
    created_by: tc.created_by,
    created_at: tc.created_at,
    updated_at: tc.updated_at,
    last_result: (tc as any).last_result || null,
    assigned_to: (tc as any).assigned_to || null,
    module: (tc as any).module || null,
    type: (tc as any).type || null,
    is_automated: (tc as any).is_automated || null,
    tags: (tc as any).tags || null,
  }))

  const handleBulkAction = async (
    actionId: string,
    testCaseIds: string[],
    actionConfig: any,
    option?: ActionOption | null
  ) => {
    try {
      switch (actionId) {
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${testCaseIds.length} test case${testCaseIds.length > 1 ? 's' : ''}?`)) {
            return
          }
          const { error: deleteError } = await supabase
            .from('test_cases')
            .delete()
            .in('id', testCaseIds)
          
          if (deleteError) throw deleteError
          toast.success(`Deleted ${testCaseIds.length} test case${testCaseIds.length > 1 ? 's' : ''}`)
          break

        case 'archive':
          const { error: archiveError } = await supabase
            .from('test_cases')
            .update({ status: 'archived' })
            .in('id', testCaseIds)
          
          if (archiveError) throw archiveError
          toast.success(`Archived ${testCaseIds.length} test case${testCaseIds.length > 1 ? 's' : ''}`)
          break

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
      console.error('Bulk action failed:', error)
      toast.error('Action failed', { description: error.message })
    }
  }

  const handleEdit = (testCaseId: string) => {
    router.push(`/dashboard/test-cases/${testCaseId}/edit`)
  }

  const handleDelete = async (testCaseId: string) => {
    if (!confirm('Are you sure you want to delete this test case?')) return
    
    try {
      const { error } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', testCaseId)
      
      if (error) throw error
      toast.success('Test case deleted')
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete test case', { description: error.message })
    }
  }

  const handleArchive = async (testCaseId: string) => {
    try {
      const { error } = await supabase
        .from('test_cases')
        .update({ status: 'archived' })
        .eq('id', testCaseId)
      
      if (error) throw error
      toast.success('Test case archived')
    } catch (error: any) {
      console.error('Archive failed:', error)
      toast.error('Failed to archive test case', { description: error.message })
    }
  }

  const handleDuplicate = async (testCaseId: string) => {
    try {
      const { data: original, error: fetchError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', testCaseId)
        .single()
      
      if (fetchError) throw fetchError

      const { error: insertError } = await supabase
        .from('test_cases')
        .insert({
          ...original,
          id: undefined,
          title: `${original.title} (Copy)`,
          created_at: undefined,
          updated_at: undefined,
        })
      
      if (insertError) throw insertError
      toast.success('Test case duplicated')
    } catch (error: any) {
      console.error('Duplicate failed:', error)
      toast.error('Failed to duplicate test case', { description: error.message })
    }
  }

  const handleRun = (testCaseId: string) => {
    router.push(`/dashboard/test-runs/new?testCaseId=${testCaseId}`)
  }

  const handleToggleDrawer = () => {
    setIsDrawerOpen(prev => !prev)
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTestCases.length && filteredTestCases.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredTestCases.map(tc => tc.id))
    }
  }

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds)
  }

  const clearFilters = () => {
    setPriorityFilter('all')
    setStatusFilter('all')
  }

  const activeFiltersCount = (priorityFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header Skeleton */}
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

        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (testCases.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <Plus className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No test cases yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first test case to start testing</p>
          {canWrite && (
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Test Case
              </button>
              <Link
                href={`/dashboard/test-cases/import`}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Test Cases
              </Link>
              <Link
                href={`/dashboard/test-cases/ai-generate`}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-primary-foreground bg-gradient-accent rounded-lg hover:shadow-glow-accent transition-all duration-200 w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </Link>
            </div>
          )}
        </div>
        {isCreateModalOpen && (
          <TestCaseForm
            suiteId={suiteId}
            onSuccess={() => setIsCreateModalOpen(false)}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        )}
      </>
    )
  }

  return (
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
        <div className="relative overflow-hidden">
          <div className="flex items-center justify-end gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {/* Sliding Drawer */}
            {canWrite && (
              <div
                className="flex items-center gap-2 transition-all duration-300 ease-in-out"
                style={{
                  maxWidth: isDrawerOpen ? '1000px' : '0px',
                  opacity: isDrawerOpen ? 1 : 0,
                  marginRight: isDrawerOpen ? '0.5rem' : '0',
                  pointerEvents: isDrawerOpen ? 'auto' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-semibold whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">New Test Case</span>
                </button>

                <Link
                  href="/dashboard/test-cases/import"
                  className="inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
                >
                  <Upload className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Import</span>
                </Link>

                <Link
                  href="/dashboard/test-runs"
                  className="inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
                >
                  <Play className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Test Runs</span>
                </Link>

                <Link
                  href="/dashboard/traceability"
                  className="inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
                >
                  <GitBranch className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Traceability</span>
                </Link>
              </div>
            )}

            {/* Always Visible Buttons */}
            {canWrite && (
              <>
                <button
                  type="button"
                  onClick={handleToggleDrawer}
                  className="inline-flex items-center justify-center p-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 flex-shrink-0"
                  aria-label="Toggle menu"
                >
                  <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                <Link
                  href="/dashboard/test-cases/ai-generate"
                  className="inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-semibold text-primary-foreground bg-gradient-accent rounded-lg hover:shadow-glow-accent transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">AI Generate</span>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={fetchTestCases}
              disabled={isLoading}
              className="inline-flex items-center justify-center p-2 lg:px-4 lg:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-2 border-b border-border">
        {/* Left Side: Select All */}
        <div className="flex items-center gap-3 order-2 lg:order-1">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredTestCases.length && filteredTestCases.length > 0}
            onChange={handleSelectAll}
            disabled={isLoading}
            className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
          <span className="text-sm font-medium text-muted-foreground">
            Select All
          </span>
        </div>

        {/* Right Side: Search, Filters, View Toggle */}
        <div className="flex items-center gap-3 flex-1 justify-end order-1 lg:order-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search test cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoading}
            className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
            <button
              onClick={() => setViewMode('grid')}
              disabled={isLoading}
              className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              disabled={isLoading}
              className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(priority => (
                  <button
                    key={priority}
                    onClick={() => setPriorityFilter(priorityFilter === priority ? 'all' : priority)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                      priorityFilter === priority
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['active', 'archived'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTestCases.length} of {testCases.length} test cases
          {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
        </p>
      </div>

      {/* Content Area */}
      {filteredTestCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Filter className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No test cases found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <TestCaseGrid
          testCases={testCaseRows}
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
          testCases={testCaseRows} 
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <TestCaseForm
          suiteId={suiteId}
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  )
}