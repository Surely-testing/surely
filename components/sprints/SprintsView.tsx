// ============================================
// FILE: components/sprints/SprintsView.tsx
// Aligned with TestCasesView design for consistency
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import { SprintBoard } from './SprintBoard';
import { SprintTable } from './SprintTable';
import { Pagination } from '@/components/shared/Pagination';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import SprintForm from './SprintForm';
import { Plus, RefreshCw, Search, Filter, X, ChevronLeft, Grid, List } from 'lucide-react';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { toast } from 'sonner';

interface SprintsViewProps {
  suiteId: string;
  sprints: any[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

type ViewMode = 'grid' | 'table';

export default function SprintsView({ suiteId, sprints, onRefresh, isLoading = false }: SprintsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'end_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSprints, setSelectedSprints] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const context = useSuiteContext();
  const canAdmin = context?.canAdmin ?? true;

  // Filter and sort sprints
  const filteredAndSortedSprints = useMemo(() => {
    let filtered = [...sprints];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sprint =>
        sprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sprint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sprint.goals?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sprint => sprint.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'end_date':
          const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
          const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
          comparison = dateA - dateB;
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
  }, [sprints, searchTerm, statusFilter, sortBy, sortOrder]);

  // Paginated sprints
  const paginatedSprints = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedSprints.slice(startIndex, endIndex);
  }, [filteredAndSortedSprints, currentPage, itemsPerPage]);

  const handleSuccess = () => {
    setShowForm(false);
    setEditingSprint(null);
    toast.success(editingSprint ? 'Sprint updated successfully' : 'Sprint created successfully');
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleCreateSprint = () => {
    console.log('Create sprint clicked');
    setEditingSprint(null);
    setShowForm(true);
  };

  const handleEditSprint = (sprint: any) => {
    setEditingSprint(sprint);
    setShowForm(true);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success('Sprints refreshed');
    } catch (error) {
      toast.error('Failed to refresh sprints');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkAction = async (
    actionId: string,
    selectedIds: string[],
    actionConfig: BulkAction,
    selectedOption?: ActionOption | null
  ) => {
    setLoadingActions(prev => [...prev, actionId]);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Bulk action:', { actionId, selectedIds, actionConfig, selectedOption });

      // Handle different actions
      switch (actionId) {
        case 'start':
          toast.success(`Started ${selectedIds.length} sprint(s)`);
          break;
        case 'complete':
          toast.success(`Completed ${selectedIds.length} sprint(s)`);
          break;
        case 'close':
          toast.success(`Closed ${selectedIds.length} sprint(s)`);
          break;
        case 'archive':
          toast.success(`Archived ${selectedIds.length} sprint(s)`);
          break;
        case 'delete':
          toast.success(`Deleted ${selectedIds.length} sprint(s)`);
          break;
        default:
          toast.success(`${actionConfig.label} completed for ${selectedIds.length} sprint(s)`);
      }

      // Refresh data after action
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setLoadingActions(prev => prev.filter(id => id !== actionId));
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Are you sure you want to delete this sprint?')) return;

    try {
      // TODO: Implement actual delete API call
      toast.success('Sprint deleted');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast.error('Failed to delete sprint');
    }
  };

  const handleArchiveSprint = async (sprintId: string) => {
    try {
      // TODO: Implement actual archive API call
      toast.success('Sprint archived');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast.error('Failed to archive sprint');
    }
  };

  const handleDuplicateSprint = async (sprintId: string) => {
    try {
      // TODO: Implement actual duplicate API call
      toast.success('Sprint duplicated');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast.error('Failed to duplicate sprint');
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      // TODO: Implement actual start API call
      toast.success('Sprint started');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast.error('Failed to start sprint');
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
  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedSprints([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
    setSelectedSprints([]); // Clear selection
  };

  const handleToggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  const handleSelectAll = () => {
    if (selectedSprints.length === filteredAndSortedSprints.length && filteredAndSortedSprints.length > 0) {
      setSelectedSprints([]);
    } else {
      setSelectedSprints(filteredAndSortedSprints.map(s => s.id));
    }
  };

  // If showing form, render it instead of the main view
  if (showForm) {
    return (
      <SprintForm
        suiteId={suiteId}
        initialData={editingSprint}
        onSuccess={handleSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingSprint(null);
        }}
      />
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
              <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
              <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>

        {/* Content Card Skeleton */}
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Plus className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No sprints yet</h3>
        <p className="text-sm text-muted-foreground mb-6">Create your first sprint to organize your testing workflow</p>
        {canAdmin && (
          <button
            onClick={handleCreateSprint}
            className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sprint
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Action Buttons */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Sprints
            </h1>
            <span className="text-sm text-muted-foreground">
              ({sprints.length})
            </span>
          </div>

          {/* Action Buttons Container */}
          <div className="relative overflow-hidden">
            <div className="flex items-center justify-end gap-2">
              {/* Sliding Drawer */}
              {canAdmin && (
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
                    onClick={handleCreateSprint}
                    className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Sprint
                  </button>
                </div>
              )}

              {/* Always Visible Buttons */}
              {canAdmin && (
                <button
                  type="button"
                  onClick={handleToggleDrawer}
                  className="inline-flex items-center justify-center p-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 flex-shrink-0"
                  aria-label="Toggle menu"
                >
                  <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
              )}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div>
        {/* Unified Controls Bar */}
        {/* Controls Bar - Mobile First, Desktop Preserved */}
        <div className="bg-card border-b border-border">
          <div className="px-3 py-2">
            <div className="flex flex-col gap-3 lg:gap-0">
              {/* Mobile Layout (< lg screens) */}
              <div className="lg:hidden space-y-3">
                {/* Row 1: Search (Full Width) */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search sprints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

                {/* Row 2: Filter & Sort */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    disabled={isLoading}
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

                  {/* Sort Dropdown */}
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      setSortBy(field as 'name' | 'created_at' | 'end_date');
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="end_date-desc">End Date (Latest)</SelectItem>
                      <SelectItem value="end_date-asc">End Date (Earliest)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 3: Select All (Left) | View Toggle (Right) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSprints.length === filteredAndSortedSprints.length && filteredAndSortedSprints.length > 0}
                      onChange={handleSelectAll}
                      disabled={isLoading}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Select All
                    </span>
                  </div>

                  {/* View Toggle */}
                  <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      disabled={isLoading}
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
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
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
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

              {/* Desktop Layout (lg+ screens) */}
              <div className="hidden lg:flex lg:flex-col lg:gap-0">
                <div className="flex items-center justify-between gap-4">
                  {/* Left Side: Select All */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSprints.length === filteredAndSortedSprints.length && filteredAndSortedSprints.length > 0}
                      onChange={handleSelectAll}
                      disabled={isLoading}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Select All
                    </span>
                  </div>

                  {/* Right Side: Search, Filter, Sort, View Toggle */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search sprints..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                      Filter
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    {/* Sort Dropdown */}
                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split('-');
                        setSortBy(field as 'name' | 'created_at' | 'end_date');
                        setSortOrder(order as 'asc' | 'desc');
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="end_date-desc">End Date (Latest)</SelectItem>
                        <SelectItem value="end_date-asc">End Date (Earliest)</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* View Toggle */}
                    <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                      <button
                        onClick={() => setViewMode('grid')}
                        disabled={isLoading}
                        className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
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
                        className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
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
                      onClick={clearFilters}
                      className="px-3 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['planning', 'active', 'on-hold', 'completed', 'archived'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${statusFilter === status
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
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-6">
          {/* Stats Bar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedSprints.length} of {sprints.length} sprints
              {selectedSprints.length > 0 && ` • ${selectedSprints.length} selected`}
            </p>
          </div>

          {/* No Results */}
          {filteredAndSortedSprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Filter className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No sprints found
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
            <>
              <SprintBoard
                sprints={paginatedSprints}
                suiteId={suiteId}
                selectedSprints={selectedSprints}
                onSelectionChange={setSelectedSprints}
              />

              {/* Pagination */}
              {filteredAndSortedSprints.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredAndSortedSprints.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <SprintTable
                sprints={paginatedSprints}
                suiteId={suiteId}
                selectedSprints={selectedSprints}
                onSelectionChange={setSelectedSprints}
                onEdit={handleEditSprint}
                onDelete={handleDeleteSprint}
                onArchive={handleArchiveSprint}
                onDuplicate={handleDuplicateSprint}
                onStart={handleStartSprint}
              />

              {/* Pagination */}
              {filteredAndSortedSprints.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredAndSortedSprints.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedSprints}
        onClearSelection={() => setSelectedSprints([])}
        assetType="sprints"
        onAction={handleBulkAction}
        loadingActions={loadingActions}
      />
    </div>
  );
}