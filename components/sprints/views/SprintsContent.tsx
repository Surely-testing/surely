// ============================================
// FILE: components/sprints/SprintsContent.tsx
// Content area with grid/table views and pagination
// ============================================
'use client';

import React from 'react';
import { SprintBoard } from '../SprintBoard';
import { SprintTable } from '../SprintTable';
import { Pagination } from '@/components/shared/Pagination';
import { Filter } from 'lucide-react';

type ViewMode = 'grid' | 'table';

interface SprintsContentProps {
  // View mode
  viewMode: ViewMode;
  
  // Data
  sprints: any[];
  suiteId: string;
  
  // Selection
  selectedSprints: string[];
  onSelectionChange: (ids: string[]) => void;
  
  // Actions
  onEdit: (sprint: any) => void;
  onDelete: (sprintId: string) => void;
  onArchive: (sprintId: string) => void;
  onDuplicate: (sprintId: string) => void;
  onStart: (sprintId: string) => void;
  
  // Pagination
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  
  // Filters
  onClearFilters: () => void;
  
  // State
  isLoading?: boolean;
}

export function SprintsContent({
  viewMode,
  sprints,
  suiteId,
  selectedSprints,
  onSelectionChange,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onStart,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onClearFilters,
  isLoading = false,
}: SprintsContentProps) {
  
  // No results state
  if (sprints.length === 0) {
    return (
      <div className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Filter className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No sprints found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  // Show pagination only if needed
  const showPagination = totalItems > itemsPerPage;

  return (
    <div className="pt-6">
      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          <SprintBoard
            sprints={sprints}
            suiteId={suiteId}
            selectedSprints={selectedSprints}
            onSelectionChange={onSelectionChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          {showPagination && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          <SprintTable
            sprints={sprints}
            suiteId={suiteId}
            selectedSprints={selectedSprints}
            onSelectionChange={onSelectionChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            onDuplicate={onDuplicate}
            onStart={onStart}
          />

          {showPagination && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}