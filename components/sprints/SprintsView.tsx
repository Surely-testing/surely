// ============================================
// FILE: components/sprints/SprintsView.tsx
// Main component - orchestrates toolbar, content, and actions
// FIXED: No duplicate toasts + proper status-based actions
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import { SprintsToolbar } from './views/SprintsToolbar';
import { SprintsContent } from './views/SprintsContent';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import SprintForm from './SprintForm';
import { Plus, RefreshCw, ChevronLeft } from 'lucide-react';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { deleteSprint } from '@/lib/actions/sprints';

interface SprintsViewProps {
  suiteId: string;
  sprints: any[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

type ViewMode = 'grid' | 'table';
type SortField = 'name' | 'created_at' | 'end_date';
type SortOrder = 'asc' | 'desc';

export default function SprintsView({ suiteId, sprints, onRefresh, isLoading = false }: SprintsViewProps) {
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any | null>(null);
  
  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Selection and pagination state
  const [selectedSprints, setSelectedSprints] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk actions state
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const context = useSuiteContext();
  const canAdmin = context?.canAdmin ?? true;

  // Helper functions for status-based permissions
  const canDeleteSprint = (sprint: any) => {
    return sprint.status === 'planning' || sprint.status === 'on-hold';
  };

  const canArchiveSprint = (sprint: any) => {
    return sprint.status === 'completed';
  };

  const canStartSprint = (sprint: any) => {
    return sprint.status === 'planning';
  };

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

  // Active filters count
  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0);

  // FIXED: Only ONE toast here, not in the hook
  const handleSuccess = async () => {
    setShowForm(false);
    setEditingSprint(null);
    
    // Refresh data first
    if (onRefresh) {
      await onRefresh();
    }
    
    // Then show ONE toast
    toast.success(editingSprint ? 'Sprint updated successfully' : 'Sprint created successfully');
  };

  const handleCreateSprint = () => {
    logger.log('Create sprint clicked');
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

  const handleDeleteSprint = (sprintId: string) => {
    logger.log('handleDeleteSprint called with ID:', sprintId);
    
    // Find the sprint
    const sprint = sprints.find(s => s.id === sprintId);
    
    // Check if it can be deleted
    if (!sprint || !canDeleteSprint(sprint)) {
      toast.error(
        `Cannot delete this sprint. Only 'planning' or 'on-hold' sprints can be deleted. This sprint is '${sprint?.status}'.`
      );
      return;
    }
    
    setSprintToDelete(sprintId);
    setDeleteDialogOpen(true);
  };

  // FIXED: Only ONE toast here
  const confirmDelete = async () => {
    if (!sprintToDelete) return;

    logger.log('Confirming delete for sprint:', sprintToDelete);
    setIsDeleting(true);

    try {
      const result = await deleteSprint(sprintToDelete);
      logger.log('Result from deleteSprint:', result);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      // Refresh first
      if (onRefresh) {
        logger.log('Calling onRefresh...');
        await onRefresh();
      }
      
      // Then show ONE toast
      toast.success('Sprint deleted successfully');
    } catch (error) {
      logger.log('Delete error:', error);
      toast.error('Failed to delete sprint');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSprintToDelete(null);
    }
  };

  const cancelDelete = () => {
    logger.log('Cancel delete clicked');
    setDeleteDialogOpen(false);
    setSprintToDelete(null);
  };

  const handleArchiveSprint = async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    
    if (!sprint || !canArchiveSprint(sprint)) {
      toast.error(
        `Cannot archive this sprint. Only 'completed' sprints can be archived. This sprint is '${sprint?.status}'.`
      );
      return;
    }
    
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
    const sprint = sprints.find(s => s.id === sprintId);
    
    if (!sprint || !canStartSprint(sprint)) {
      toast.error(
        `Cannot start this sprint. Only 'planning' sprints can be started. This sprint is '${sprint?.status}'.`
      );
      return;
    }
    
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

  const handleBulkAction = async (
    actionId: string,
    selectedIds: string[],
    actionConfig: BulkAction,
    selectedOption?: ActionOption | null
  ) => {
    setLoadingActions(prev => [...prev, actionId]);

    try {
      // Get selected sprints
      const selectedSprintObjs = sprints.filter(s => selectedIds.includes(s.id));

      // Validate based on action
      if (actionId === 'delete') {
        const cannotDelete = selectedSprintObjs.filter(s => !canDeleteSprint(s));
        if (cannotDelete.length > 0) {
          toast.error(
            `Cannot delete ${cannotDelete.length} sprint(s). Only 'planning' or 'on-hold' sprints can be deleted.`
          );
          return;
        }
      }

      if (actionId === 'archive') {
        const cannotArchive = selectedSprintObjs.filter(s => !canArchiveSprint(s));
        if (cannotArchive.length > 0) {
          toast.error(
            `Cannot archive ${cannotArchive.length} sprint(s). Only 'completed' sprints can be archived.`
          );
          return;
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.log('Bulk action:', { actionId, selectedIds, actionConfig, selectedOption });

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedSprints([]);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
    setSelectedSprints([]);
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

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortBy(field);
    setSortOrder(order);
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
      <div className="space-y-6 pb-24">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Sprints
              </h1>
              <span className="text-sm text-muted-foreground">(0)</span>
            </div>
          </div>
        </div>

        <EmptyState
          icon={Plus}
          iconSize={64}
          title="No sprints yet"
          description="Create your first sprint to organize your testing workflow"
          actions={canAdmin ? [
            {
              label: 'Create Sprint',
              onClick: handleCreateSprint,
              variant: 'primary',
              icon: Plus
            }
          ] : undefined}
          minHeight="400px"
        />
      </div>
    );
  }

  return (
    <>
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
                    <ChevronLeft 
                      className={`h-5 w-5 transition-transform duration-300 ${
                        isDrawerOpen ? 'rotate-180' : 'rotate-0'
                      }`} 
                    />
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
        <div className="rounded-lg overflow-hidden">
          {/* Toolbar */}
          <SprintsToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectAllChecked={
              selectedSprints.length === filteredAndSortedSprints.length && 
              filteredAndSortedSprints.length > 0
            }
            onSelectAllChange={handleSelectAll}
            isLoading={isLoading}
            totalCount={sprints.length}
            filteredCount={filteredAndSortedSprints.length}
            selectedCount={selectedSprints.length}
          />

          {/* Content */}
          <SprintsContent
            viewMode={viewMode}
            sprints={paginatedSprints}
            suiteId={suiteId}
            selectedSprints={selectedSprints}
            onSelectionChange={setSelectedSprints}
            onEdit={handleEditSprint}
            onDelete={handleDeleteSprint}
            onArchive={handleArchiveSprint}
            onDuplicate={handleDuplicateSprint}
            onStart={handleStartSprint}
            currentPage={currentPage}
            totalItems={filteredAndSortedSprints.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onClearFilters={clearFilters}
            isLoading={isLoading}
          />
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

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={cancelDelete}
          />
          
          <div 
            className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6 z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-foreground mb-2">
              Delete Sprint
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this sprint? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}