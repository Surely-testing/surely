// ============================================
// TestRunsView.tsx - Updated: Removed createRun handling, added Manual/Automated execution
// ============================================
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Search, Filter, Play, Grid3x3, List, Settings, PlayCircle, UserCog } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { toast } from 'sonner';
import { useBulkActions } from '@/hooks/useBulkActions';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';

import { TestRunsTable } from './TestRunsTable';
import { TestRunsGrid } from './TestRunsGrid';
import { Pagination } from '@/components/shared/Pagination';
import { BulkActionsBar } from '@/components/shared/bulk-action/BulkActionBar';
import TestRunForm from './TestRunsForm';
import { EnvironmentSettings } from './EnvironmentSettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { ActionOption } from '@/components/shared/bulk-action/BulkActionBar';

interface TestRunsViewProps {
  suiteId: string;
}

type SortField = 'name' | 'created_at' | 'executed_at';
type SortOrder = 'asc' | 'desc';
type ViewSection = 'runs' | 'form' | 'environments';

export default function TestRunsView({ suiteId }: TestRunsViewProps) {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const { execute: executeBulkAction, isExecuting } = useBulkActions('test_runs', suiteId);
  
  // State
  const [currentView, setCurrentView] = useState<ViewSection>('runs');
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [editingRun, setEditingRun] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const context = useSuiteContext();
  const canAdmin = context?.canAdmin ?? true;

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
          description: 'Please set a default environment before running tests',
          action: {
            label: 'Configure Now',
            onClick: () => setCurrentView('environments')
          }
        })
        return false
      }
      return true
    } catch (err) {
      toast.error('No default environment configured', {
        description: 'Please set a default environment before running tests',
        action: {
          label: 'Configure Now',
          onClick: () => setCurrentView('environments')
        }
      })
      return false
    }
  }

  // Fetch test runs
  const fetchTestRuns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_runs')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestRuns(data || []);
    } catch (err: any) {
      logger.log('Error fetching test runs:', err);
      toast.error('Failed to load test runs', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    fetchTestRuns();

    const channel = supabase
      .channel(`test_runs:${suiteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'test_runs',
        filter: `suite_id=eq.${suiteId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTestRuns(prev => [payload.new as any, ...prev]);
          toast.success('Test run created');
        } else if (payload.eventType === 'UPDATE') {
          setTestRuns(prev => prev.map(tr => tr.id === payload.new.id ? payload.new as any : tr));
        } else if (payload.eventType === 'DELETE') {
          setTestRuns(prev => prev.filter(tr => tr.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [suiteId, supabase]);

  // Computed values
  const filtered = useMemo(() => {
    let result = [...testRuns];
    if (searchQuery) {
      result = result.filter(run =>
        run.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.environment?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(run => run.status === statusFilter);
    }
    return result;
  }, [testRuns, searchQuery, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'executed_at':
          const execA = a.executed_at ? new Date(a.executed_at).getTime() : 0;
          const execB = b.executed_at ? new Date(b.executed_at).getTime() : 0;
          comparison = execA - execB;
          break;
        case 'created_at':
        default:
          const createdA = new Date(a.created_at).getTime();
          const createdB = new Date(b.created_at).getTime();
          comparison = createdA - createdB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [sorted, currentPage, itemsPerPage]);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0);

  // Handlers
  const handleBulkAction = async (
    actionId: string,
    testRunIds: string[],
    actionConfig: any,
    option?: ActionOption | null
  ) => {
    try {
      await executeBulkAction(
        actionId,
        testRunIds,
        actionConfig,
        () => {
          fetchTestRuns();
          setSelectedRuns([]);
        }
      );
    } catch (error: any) {
      logger.log('Bulk action failed:', error);
      toast.error('Action failed', { description: error.message });
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSortField('created_at');
    setSortOrder('desc');
  };

  const handleSelectAll = () => {
    if (selectedRuns.length === paginated.length && paginated.length > 0) {
      setSelectedRuns([]);
    } else {
      setSelectedRuns(paginated.map(run => run.id));
    }
  };

  const handleFormSuccess = () => {
    setCurrentView('runs');
    setEditingRun(null);
    fetchTestRuns();
  };

  const handleFormCancel = () => {
    setCurrentView('runs');
    setEditingRun(null);
  };

  const handleRunAutomated = async (testRun: any) => {
    const hasDefaultEnv = await checkDefaultEnvironment()
    if (!hasDefaultEnv) return

    try {
      // Update status to in-progress (or keep as pending if API will update it)
      const { error: updateError } = await supabase
        .from('test_runs')
        .update({ status: 'pending' })
        .eq('id', testRun.id)

      if (updateError) throw updateError

      // Navigate to test run details page
      router.push(`/dashboard/test-runs/${testRun.id}`)

      // Get test case IDs from relationships
      const { data: relationships, error: relError } = await supabase
        .from('asset_relationships')
        .select('target_id')
        .eq('source_type', 'test_run')
        .eq('source_id', testRun.id)
        .eq('target_type', 'test_case')

      if (relError) throw relError

      const testCaseIds = relationships?.map(r => r.target_id) || []

      // Trigger execution
      const response = await fetch('/api/test-execution/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: testRun.id,
          testCaseIds,
          suiteId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger test execution')
      }

      toast.success('Automated test run started', {
        description: `Executing ${testCaseIds.length} test case(s)...`
      })

    } catch (error: any) {
      logger.log('Run automated failed:', error)
      toast.error('Failed to start automated run', { description: error.message })
    }
  }

  const handleRunManual = async (testRun: any) => {
    const hasDefaultEnv = await checkDefaultEnvironment()
    if (!hasDefaultEnv) return

    // Navigate to manual execution view
    router.push(`/dashboard/test-runs/${testRun.id}/execute`)
  }

  // Render environment settings
  if (currentView === 'environments') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Environment Settings
            </h1>
          </div>
          <button
            onClick={() => setCurrentView('runs')}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Back to Test Runs
          </button>
        </div>
        <EnvironmentSettings suiteId={suiteId} />
      </div>
    );
  }

  // Render form if creating/editing
  if (currentView === 'form') {
    return (
      <div className="space-y-4 md:space-y-6">
        <TestRunForm
          suiteId={suiteId}
          initialData={editingRun}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
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
    );
  }

  // Empty state
  if (testRuns.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Test Runs
            </h1>
            <span className="text-sm text-muted-foreground">(0)</span>
          </div>
          <button
            onClick={() => setCurrentView('environments')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            Environments
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Play className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No test runs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first test run to get started
          </p>
          {canAdmin && (
            <button
              type="button"
              onClick={() => setCurrentView('form')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Test Run
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Test Runs
            </h1>
            <span className="text-sm text-muted-foreground">
              ({testRuns.length})
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentView('environments')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Environments</span>
            </button>

            {canAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingRun(null);
                  setCurrentView('form');
                }}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Test Run</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
            <button
              type="button"
              onClick={fetchTestRuns}
              disabled={isLoading || isExecuting}
              className="inline-flex items-center justify-center p-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={cn('h-4 w-4', (isLoading || isExecuting) && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-card border-b border-border">
          <div className="px-3 py-2">
            <div className="flex flex-col gap-3 lg:gap-0">
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search test runs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isExecuting}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    disabled={isExecuting}
                    className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      setSortField(field as SortField);
                      setSortOrder(order as SortOrder);
                    }}
                    disabled={isExecuting}
                  >
                    <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="executed_at-desc">Recently Executed</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRuns.length === paginated.length && paginated.length > 0}
                      onChange={handleSelectAll}
                      disabled={isExecuting}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Select All
                    </span>
                  </div>

                  <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      disabled={isExecuting}
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        viewMode === 'grid'
                          ? 'bg-primary text-primary-foreground shadow-theme-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      disabled={isExecuting}
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

              {/* Desktop Layout */}
              <div className="hidden lg:flex lg:flex-col lg:gap-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRuns.length === paginated.length && paginated.length > 0}
                      onChange={handleSelectAll}
                      disabled={isExecuting}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Select All
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search test runs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isExecuting}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      disabled={isExecuting}
                      className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50"
                    >
                      <Filter className="w-4 h-4" />
                      Filter
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    <Select
                      value={`${sortField}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split('-');
                        setSortField(field as SortField);
                        setSortOrder(order as SortOrder);
                      }}
                      disabled={isExecuting}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="executed_at-desc">Recently Executed</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        disabled={isExecuting}
                        className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          viewMode === 'grid'
                            ? 'bg-primary text-primary-foreground shadow-theme-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        title="Grid View"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        disabled={isExecuting}
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
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-3 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'in-progress', 'passed', 'failed', 'blocked', 'skipped'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                          statusFilter === status
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} of {testRuns.length} test runs
            {selectedRuns.length > 0 && ` • ${selectedRuns.length} selected`}
            {isExecuting && ' • Processing...'}
          </p>
        </div>

        {/* Content Area */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Filter className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No test runs found
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
        ) : (
          <>
            {viewMode === 'table' ? (
              <TestRunsTable 
                testRuns={paginated}
                suiteId={suiteId}
                selectedRuns={selectedRuns}
                onSelectionChange={setSelectedRuns}
                onEdit={(run) => {
                  setEditingRun(run);
                  setCurrentView('form');
                }}
                onRunAutomated={handleRunAutomated}
                onRunManual={handleRunManual}
              />
            ) : (
              <TestRunsGrid
                testRuns={paginated}
                suiteId={suiteId}
                selectedRuns={selectedRuns}
                onSelectionChange={setSelectedRuns}
                onEdit={(run) => {
                  setEditingRun(run);
                  setCurrentView('form');
                }}
                onRunAutomated={handleRunAutomated}
                onRunManual={handleRunManual}
              />
            )}
            
            {sorted.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalItems={sorted.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setSelectedRuns([]);
                }}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setCurrentPage(1);
                  setSelectedRuns([]);
                }}
              />
            )}
          </>
        )}
      </div>

      {selectedRuns.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedRuns}
          onClearSelection={() => setSelectedRuns([])}
          assetType="testRuns"
          onAction={handleBulkAction}
        />
      )}
    </>
  );
}