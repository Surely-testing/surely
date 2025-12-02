// ============================================
// FILE: components/test-runs/TestRunsView.tsx
// Complete Test Runs View with Grid/Table Display Toggle
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import { TestRunsTable } from './TestRunsTable';
import { TestRunsGrid } from './TestRunsGrid';
import { Pagination } from '@/components/shared/Pagination';
import { BulkActionsBar } from '@/components/shared/BulkActionBar';
import TestRunForm from './TestRunsForm';
import { Plus, RefreshCw, Search, Filter, X, Play, Grid3x3, List } from 'lucide-react';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface TestRunsViewProps {
  suiteId: string;
  testRuns: any[];
  testCases: any[];
  sprints?: any[];
  onRefresh?: () => void;
}

export default function TestRunsView({ 
  suiteId, 
  testRuns, 
  testCases, 
  sprints = [],
  onRefresh 
}: TestRunsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRun, setEditingRun] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'executed_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const context = useSuiteContext();
  const canAdmin = context?.canAdmin ?? true;

  // Filter and sort test runs
  const filteredAndSortedRuns = useMemo(() => {
    let filtered = [...testRuns];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(run =>
        run.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.environment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(run => run.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
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

    return filtered;
  }, [testRuns, searchTerm, statusFilter, sortBy, sortOrder]);

  // Paginated runs
  const paginatedRuns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedRuns.slice(startIndex, endIndex);
  }, [filteredAndSortedRuns, currentPage, itemsPerPage]);

  const handleSuccess = () => {
    setShowForm(false);
    setEditingRun(null);
    toast.success(editingRun ? 'Test run updated successfully' : 'Test run created successfully');
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleCreateRun = () => {
    setEditingRun(null);
    setShowForm(true);
  };

  const handleEditRun = (run: any) => {
    setEditingRun(run);
    setShowForm(true);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success('Test runs refreshed');
    } catch (error) {
      toast.error('Failed to refresh test runs');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkAction = async (
    actionId: string,
    selectedIds: string[],
    actionConfig: any,
    selectedOption?: any
  ) => {
    setLoadingActions(prev => [...prev, actionId]);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (actionId) {
        case 'execute':
          toast.success(`Started ${selectedIds.length} test run(s)`);
          break;
        case 'complete':
          toast.success(`Completed ${selectedIds.length} test run(s)`);
          break;
        case 'abort':
          toast.success(`Aborted ${selectedIds.length} test run(s)`);
          break;
        case 'archive':
          toast.success(`Archived ${selectedIds.length} test run(s)`);
          break;
        case 'delete':
          toast.success(`Deleted ${selectedIds.length} test run(s)`);
          break;
        default:
          toast.success(`${actionConfig.label} completed for ${selectedIds.length} test run(s)`);
      }
      
      if (onRefresh) {
        await onRefresh();
      }
      setSelectedRuns([]);
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setLoadingActions(prev => prev.filter(id => id !== actionId));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc';

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRuns([]);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
    setSelectedRuns([]);
  };

  // If showing form, render it instead of the main view
  if (showForm) {
    // Use simple form without sprints if sprints is empty or undefined
    const formProps = {
      suiteId,
      testCases,
      initialData: editingRun,
      onSuccess: handleSuccess,
      onCancel: () => {
        setShowForm(false);
        setEditingRun(null);
      }
    };

    // Only add sprints if we have valid sprint data
    if (sprints && sprints.length > 0) {
      return (
        <TestRunForm
          {...formProps}
          sprints={sprints}
        />
      );
    }

    return (
      <TestRunForm
        {...formProps}
        sprints={[]}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Test Runs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Execute and track your test case executions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="ml-2">Refresh</span>
            </button>
          )}
          {canAdmin && (
            <button
              onClick={handleCreateRun}
              className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Test Run
            </button>
          )}
        </div>
      </div>

      {/* Search, Filters and View Toggle */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search test runs by name, description, or environment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex-shrink-0">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="created_at">Created Date</option>
              <option value="executed_at">Execution Date</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'table' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedRuns.length} of {testRuns.length} test runs
        </div>
      )}

      {/* Test Runs Content */}
      {filteredAndSortedRuns.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {hasActiveFilters 
              ? 'No test runs match your search or filters'
              : 'No test runs yet'
            }
          </h3>
          <p className="text-muted-foreground mb-6">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more results'
              : 'Create your first test run to start executing test cases.'
            }
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200"
            >
              Clear Filters
            </button>
          ) : canAdmin && (
            <button
              onClick={handleCreateRun}
              className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Test Run
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Test Runs Table or Grid */}
          {viewMode === 'table' ? (
            <TestRunsTable 
              testRuns={paginatedRuns}
              suiteId={suiteId}
              selectedRuns={selectedRuns}
              onSelectionChange={setSelectedRuns}
              onEdit={handleEditRun}
            />
          ) : (
            <TestRunsGrid
              testRuns={paginatedRuns}
              suiteId={suiteId}
              selectedRuns={selectedRuns}
              onSelectionChange={setSelectedRuns}
              onEdit={handleEditRun}
            />
          )}
          
          {/* Pagination */}
          {filteredAndSortedRuns.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedRuns.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </>
      )}

      {/* Bulk Actions Bar */}
      {selectedRuns.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedRuns}
          onClearSelection={() => setSelectedRuns([])}
          assetType="testRuns"
          onAction={handleBulkAction}
          loadingActions={loadingActions}
        />
      )}
    </div>
  );
}