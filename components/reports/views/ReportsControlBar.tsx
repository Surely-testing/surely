// ============================================
// FILE: components/reports/ReportsControlBar.tsx
// Unified control bar for both Reports and Schedules tabs
// ============================================

import { Search, Filter, Grid, List } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

type TabType = 'reports' | 'schedules';
type SortField = 'created_at' | 'name' | 'type' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'type' | 'status' | 'date';
type ViewMode = 'grid' | 'table';

interface ReportsControlBarProps {
  // Tab
  activeTab: TabType;
  
  // Search
  search: string;
  onSearchChange: (value: string) => void;
  
  // Filters - Reports
  filterStatus?: string[];
  onFilterStatusChange?: (status: string[]) => void;
  filterType?: string[];
  onFilterTypeChange?: (types: string[]) => void;
  
  // Filters - Schedules
  filterScheduleStatus?: string[];
  onFilterScheduleStatusChange?: (status: string[]) => void;
  filterFrequency?: string[];
  onFilterFrequencyChange?: (frequency: string[]) => void;
  
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  
  // Sort & Group (Reports only)
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSortChange?: (field: SortField, order: SortOrder) => void;
  groupBy?: GroupBy;
  onGroupByChange?: (groupBy: GroupBy) => void;
  
  // View
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Selection
  selectedIds: string[];
  paginatedItems: any[];
  onSelectAll: () => void;
  
  // Loading state
  isLoading: boolean;
}

export function ReportsControlBar({
  activeTab,
  search,
  onSearchChange,
  filterStatus = [],
  onFilterStatusChange,
  filterType = [],
  onFilterTypeChange,
  filterScheduleStatus = [],
  onFilterScheduleStatusChange,
  filterFrequency = [],
  onFilterFrequencyChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onClearFilters,
  sortField,
  sortOrder,
  onSortChange,
  groupBy,
  onGroupByChange,
  viewMode,
  onViewModeChange,
  selectedIds,
  paginatedItems,
  onSelectAll,
  isLoading
}: ReportsControlBarProps) {
  const reportStatusOptions = ['completed', 'pending', 'failed'];
  const reportTypeOptions = ['test_execution', 'bug_summary', 'coverage', 'performance'];
  const scheduleStatusOptions = ['active', 'inactive'];
  const frequencyOptions = ['daily', 'weekly', 'monthly', 'custom'];

  const toggleReportStatusFilter = (status: string) => {
    if (onFilterStatusChange) {
      onFilterStatusChange(
        filterStatus.includes(status)
          ? filterStatus.filter(s => s !== status)
          : [...filterStatus, status]
      );
    }
  };

  const toggleReportTypeFilter = (type: string) => {
    if (onFilterTypeChange) {
      onFilterTypeChange(
        filterType.includes(type)
          ? filterType.filter(t => t !== type)
          : [...filterType, type]
      );
    }
  };

  const toggleScheduleStatusFilter = (status: string) => {
    if (onFilterScheduleStatusChange) {
      onFilterScheduleStatusChange(
        filterScheduleStatus.includes(status)
          ? filterScheduleStatus.filter(s => s !== status)
          : [...filterScheduleStatus, status]
      );
    }
  };

  const toggleFrequencyFilter = (frequency: string) => {
    if (onFilterFrequencyChange) {
      onFilterFrequencyChange(
        filterFrequency.includes(frequency)
          ? filterFrequency.filter(f => f !== frequency)
          : [...filterFrequency, frequency]
      );
    }
  };

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
                placeholder={activeTab === 'reports' ? "Search reports..." : "Search schedules..."}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>

            {/* Row 2: Filter, Sort, Group */}
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

              {/* Sort and Group - Only for Reports */}
              {activeTab === 'reports' && sortField && sortOrder && onSortChange && (
                <>
                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      onSortChange(field as SortField, order as SortOrder);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>

                  {groupBy && onGroupByChange && (
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
                        <SelectItem value="status">Group by Status</SelectItem>
                        <SelectItem value="date">Group by Date</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </div>

            {/* Row 3: Select All + View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
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
                  checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
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
                    placeholder={activeTab === 'reports' ? "Search reports..." : "Search schedules..."}
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

                {/* Sort and Group - Only for Reports */}
                {activeTab === 'reports' && sortField && sortOrder && onSortChange && (
                  <>
                    <Select
                      value={`${sortField}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split('-');
                        onSortChange(field as SortField, order as SortOrder);
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                        <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>

                    {groupBy && onGroupByChange && (
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
                          <SelectItem value="status">Group by Status</SelectItem>
                          <SelectItem value="date">Group by Date</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </>
                )}

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

            {activeTab === 'reports' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {reportStatusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => toggleReportStatusFilter(status)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          filterStatus.includes(status)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {reportTypeOptions.map(type => (
                      <button
                        key={type}
                        onClick={() => toggleReportTypeFilter(type)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          filterType.includes(type)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Filter for Schedules */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {scheduleStatusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => toggleScheduleStatusFilter(status)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          filterScheduleStatus.includes(status)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Frequency
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {frequencyOptions.map(frequency => (
                      <button
                        key={frequency}
                        onClick={() => toggleFrequencyFilter(frequency)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          filterFrequency.includes(frequency)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                        }`}
                      >
                        {frequency}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}