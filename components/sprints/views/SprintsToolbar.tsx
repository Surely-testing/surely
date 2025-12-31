// ============================================
// FILE: components/sprints/SprintsToolbar.tsx
// Toolbar with search, filters, sort, and view toggle
// ============================================
'use client';

import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

type ViewMode = 'grid' | 'table';
type SortField = 'name' | 'created_at' | 'end_date';
type SortOrder = 'asc' | 'desc';

interface SprintsToolbarProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  
  // Filters
  showFilters: boolean;
  onToggleFilters: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  
  // Sort
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Select all
  selectAllChecked: boolean;
  onSelectAllChange: () => void;
  
  // State
  isLoading?: boolean;
  
  // Counts
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
}

const SPRINT_STATUSES = ['planning', 'active', 'on-hold', 'completed', 'archived'] as const;

export function SprintsToolbar({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  statusFilter,
  onStatusFilterChange,
  activeFiltersCount,
  onClearFilters,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectAllChecked,
  onSelectAllChange,
  isLoading = false,
  totalCount,
  filteredCount,
  selectedCount,
}: SprintsToolbarProps) {
  
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    onSortChange(field as SortField, order as SortOrder);
  };

  return (
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
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>

            {/* Row 2: Filter & Sort */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {/* Filter Button */}
              <button
                onClick={onToggleFilters}
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
                onValueChange={handleSortChange}
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
                  checked={selectAllChecked}
                  onChange={onSelectAllChange}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Select All
                </span>
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-sm">
                <button
                  onClick={() => onViewModeChange('grid')}
                  disabled={isLoading}
                  className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewModeChange('table')}
                  disabled={isLoading}
                  className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    viewMode === 'table'
                      ? 'bg-primary text-primary-foreground shadow-sm'
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
                  checked={selectAllChecked}
                  onChange={onSelectAllChange}
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
                    onChange={(e) => onSearchChange(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={onToggleFilters}
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
                  onValueChange={handleSortChange}
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
                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-sm">
                  <button
                    onClick={() => onViewModeChange('grid')}
                    disabled={isLoading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      viewMode === 'grid'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('table')}
                    disabled={isLoading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      viewMode === 'table'
                        ? 'bg-primary text-primary-foreground shadow-sm'
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
                  onClick={onClearFilters}
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
                  {SPRINT_STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => onStatusFilterChange(statusFilter === status ? 'all' : status)}
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
      </div>
    </div>
  );
}