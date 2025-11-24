// ============================================
// FILE: components/sprints/SprintsView.tsx
// Enhanced with search, filters, sorting, bulk actions, and pagination
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import { SprintBoard } from './SprintBoard';
import { Pagination } from '@/components/shared/Pagination';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import SprintForm from './SprintForm';
import { Plus, RefreshCw, Search, Filter, X } from 'lucide-react';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { toast } from 'sonner';

interface SprintsViewProps {
  suiteId: string;
  sprints: any[];
  onRefresh?: () => void;
}

export default function SprintsView({ suiteId, sprints, onRefresh }: SprintsViewProps) {
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
    setSelectedSprints([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
    setSelectedSprints([]); // Clear selection
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Sprints
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Organize and track your testing sprints
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="ml-2">Refresh</span>
            </button>
          )}
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
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sprints by name, description, or goals..."
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
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex-shrink-0">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at' | 'end_date')}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="created_at">Created Date</option>
              <option value="end_date">End Date</option>
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
          Showing {filteredAndSortedSprints.length} of {sprints.length} sprints
        </div>
      )}

      {/* Sprint Board */}
      {filteredAndSortedSprints.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'No sprints match your search or filters'
              : 'No sprints yet. Create your first sprint to get started.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <SprintBoard 
            sprints={paginatedSprints} 
            suiteId={suiteId}
            selectedSprints={selectedSprints}
            onSelectionChange={setSelectedSprints}
          />
          
          {/* Pagination */}
          {filteredAndSortedSprints.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedSprints.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </>
      )}

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