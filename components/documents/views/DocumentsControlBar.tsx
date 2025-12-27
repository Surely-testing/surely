// ============================================
// FILE: components/documents/DocumentsControlBar.tsx
// Control bar with search, filters, sorting, and view toggle
// ============================================

import { Search, Filter, Grid, List } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import type { ViewMode, DocumentType, SortField, SortOrder, GroupBy, DocumentWithCreator } from './document-page.types'

interface DocumentsControlBarProps {
  search: string
  onSearchChange: (value: string) => void
  typeFilter: DocumentType
  onTypeFilterChange: (type: DocumentType) => void
  sortField: SortField
  sortOrder: SortOrder
  onSortChange: (field: SortField, order: SortOrder) => void
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  showFilters: boolean
  onToggleFilters: () => void
  activeFiltersCount: number
  onClearFilters: () => void
  isLoading: boolean
  selectedDocIds: string[]
  paginatedDocs: DocumentWithCreator[]
  onSelectAll: () => void
}

export function DocumentsControlBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sortField,
  sortOrder,
  onSortChange,
  groupBy,
  onGroupByChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onClearFilters,
  isLoading,
  selectedDocIds,
  paginatedDocs,
  onSelectAll
}: DocumentsControlBarProps) {
  const documentTypes = [
    { value: 'meeting_notes', label: '📝 Meeting Notes' },
    { value: 'test_plan', label: '📋 Test Plan' },
    { value: 'test_strategy', label: '🎯 Test Strategy' },
    { value: 'brainstorm', label: '💡 Brainstorm' },
    { value: 'general', label: '📄 General' }
  ]

  return (
    <div className="bg-card border-b border-border">
      <div className="px-3 py-2">
        <div className="flex flex-col gap-3 lg:gap-0">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            {/* Row 1: Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>

            {/* Row 2: Filter, Sort, Group By */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                  <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                  <SelectItem value="updated_at-asc">Least Recently Updated</SelectItem>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
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
                  <SelectItem value="type">Group by Type</SelectItem>
                  <SelectItem value="creator">Group by Creator</SelectItem>
                  <SelectItem value="date">Group by Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Select All + View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedDocIds.length === paginatedDocs.length && paginatedDocs.length > 0}
                  onChange={onSelectAll}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">Select All</span>
              </div>

              <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                <button
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
                  checked={selectedDocIds.length === paginatedDocs.length && paginatedDocs.length > 0}
                  onChange={onSelectAll}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">Select All</span>
              </div>

              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </div>

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
                    <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                    <SelectItem value="updated_at-asc">Least Recently Updated</SelectItem>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={groupBy}
                  onValueChange={(value) => onGroupByChange(value as GroupBy)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="type">Group by Type</SelectItem>
                    <SelectItem value="creator">Group by Creator</SelectItem>
                    <SelectItem value="date">Group by Date</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                  <button
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
                  Document Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {documentTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => onTypeFilterChange(typeFilter === type.value ? 'all' : type.value as DocumentType)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                        typeFilter === type.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      {type.label}
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