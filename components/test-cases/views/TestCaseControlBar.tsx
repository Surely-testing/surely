'use client'

import React from 'react'
import { Search, Filter, Grid, List } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import type { ViewMode, SortField, SortOrder, GroupBy } from '@/types/test-case-view.types'

interface TestCaseControlBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  activeFiltersCount: number
  sortField: SortField
  sortOrder: SortOrder
  onSortChange: (field: SortField, order: SortOrder) => void
  groupBy: GroupBy
  onGroupByChange: (value: GroupBy) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectAllChecked: boolean
  onSelectAllChange: () => void
  isLoading: boolean
  priorityFilter: string
  onPriorityFilterChange: (value: string) => void
  onClearFilters: () => void
}

export function TestCaseControlBar(props: TestCaseControlBarProps) {
  const {
    searchQuery,
    onSearchChange,
    showFilters,
    onToggleFilters,
    activeFiltersCount,
    sortField,
    sortOrder,
    onSortChange,
    groupBy,
    onGroupByChange,
    viewMode,
    onViewModeChange,
    selectAllChecked,
    onSelectAllChange,
    isLoading,
    priorityFilter,
    onPriorityFilterChange,
    onClearFilters,
  } = props

  return (
    <div className="bg-card border-b border-border">
      <div className="px-3 py-2">
        <div className="flex flex-col gap-3 lg:gap-0">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search test cases..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
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

              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-')
                  onSortChange(field as SortField, order as SortOrder)
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="priority-desc">Priority (High-Low)</SelectItem>
                  <SelectItem value="priority-asc">Priority (Low-High)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={groupBy}
                onValueChange={(value) => onGroupByChange(value as GroupBy)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                  <SelectValue placeholder="Group by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="priority">Group by Priority</SelectItem>
                  <SelectItem value="status">Group by Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

              <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
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
                  type="button"
                  onClick={() => onViewModeChange('table')}
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

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
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

              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search test cases..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
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

                <Select
                  value={`${sortField}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split('-')
                    onSortChange(field as SortField, order as SortOrder)
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="priority-desc">Priority (High-Low)</SelectItem>
                    <SelectItem value="priority-asc">Priority (Low-High)</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={groupBy}
                  onValueChange={(value) => onGroupByChange(value as GroupBy)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Group by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="priority">Group by Priority</SelectItem>
                    <SelectItem value="status">Group by Status</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                  <button
                    type="button"
                    onClick={() => onViewModeChange('grid')}
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
                    type="button"
                    onClick={() => onViewModeChange('table')}
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
                  onClick={onClearFilters}
                  className="px-3 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => onPriorityFilterChange(priorityFilter === priority ? 'all' : priority)}
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}