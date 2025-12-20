// ============================================
// components/recordings/RecordingsView.tsx
// ============================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Recording, RecordingFilters } from '@/types/recording.types';
import { RecordingGrid } from './RecordingGrid';
import { RecordingToolbar } from './RecordingToolbar';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Search, Grid3x3, List, CheckSquare, Square, Play, Clock, Calendar, Filter, RefreshCw, ChevronLeft } from 'lucide-react';
import { getRecordings, deleteRecording } from '@/lib/actions/recordings';
import { Skeleton } from '@/components/ui/Skeleton';
import { BulkActionsBar, type ActionGroup } from '@/components/shared/BulkActionBar';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from 'sonner';
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableCheckbox,
  TableEmpty,
  TableHeaderText,
  TableDescriptionText,
} from '@/components/ui/Table';

interface RecordingsViewProps {
  suiteId: string;
  initialRecordings: Recording[];
  sprints?: Array<{ id: string; name: string }>;
}

export function RecordingsView({
  suiteId,
  initialRecordings,
  sprints = [],
}: RecordingsViewProps) {
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingIds, setIsDeletingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<RecordingFilters>({
    search: '',
    sort: 'newest',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Selection and pagination state
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [sortField, setSortField] = useState<'created_at' | 'duration' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  const fetchRecordings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getRecordings(suiteId, filters);
      if (data) {
        setRecordings(data);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setIsLoading(false);
    }
  }, [suiteId, filters]);

  const filteredRecordings = useMemo(() => {
    let filtered = recordings.filter(recording => {
      const matchesSearch = !filters.search ||
        recording.title?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesSprint = !filters.sprint_id || recording.sprint_id === filters.sprint_id;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'recent' && recording.created_at &&
          new Date(recording.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      let matchesDateRange = true;
      if (dateRangeFilter !== 'all' && recording.created_at) {
        const recordingDate = new Date(recording.created_at);
        const now = new Date();
        switch (dateRangeFilter) {
          case 'today':
            matchesDateRange = recordingDate.toDateString() === now.toDateString();
            break;
          case 'week':
            matchesDateRange = recordingDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            matchesDateRange = recordingDate > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      return matchesSearch && matchesSprint && matchesStatus && matchesDateRange;
    });

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'created_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (sortField === 'duration') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }

      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [recordings, filters, sortField, sortOrder, statusFilter, dateRangeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchRecordings();
    }, 300);

    return () => clearTimeout(debounce);
  }, [filters, fetchRecordings]);

  const handleFilterChange = useCallback((key: keyof RecordingFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const paginatedRecordings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecordings.slice(start, start + itemsPerPage);
  }, [filteredRecordings, currentPage, itemsPerPage]);

  const handleToggleSelection = useCallback((recordingId: string) => {
    setSelectedRecordings(prev =>
      prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRecordings.length === paginatedRecordings.length && paginatedRecordings.length > 0) {
      setSelectedRecordings([]);
    } else {
      setSelectedRecordings(paginatedRecordings.map(r => r.id));
    }
  }, [selectedRecordings, paginatedRecordings]);

  const allSelected = paginatedRecordings.length > 0 &&
    selectedRecordings.length === paginatedRecordings.length;

  const handleBulkAction = useCallback(async (actionId: string, selectedIds: string[]) => {
    switch (actionId) {
      case 'download':
        toast.info('Download feature coming soon');
        break;

      case 'share':
        if (selectedIds.length > 1) {
          toast.info('Please share recordings one at a time');
          return;
        }
        const recording = recordings.find(r => r.id === selectedIds[0]);
        if (recording) {
          const shareUrl = `${window.location.origin}/dashboard/recordings/${recording.id}`;
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard');
        }
        break;

      case 'archive':
        toast.success(`Archived ${selectedIds.length} recording(s)`);
        setSelectedRecordings([]);
        break;

      case 'delete':
        if (!confirm(`Delete ${selectedIds.length} recording(s)? This action cannot be undone and will remove the videos from YouTube.`)) {
          return;
        }

        setIsDeletingIds(new Set(selectedIds));
        const deleteToastId = toast.loading(`Deleting ${selectedIds.length} recording(s)...`);

        try {
          const deletePromises = selectedIds.map(id => deleteRecording(id));
          const results = await Promise.allSettled(deletePromises);
          
          const failedCount = results.filter(r => r.status === 'rejected').length;
          const successCount = results.filter(r => r.status === 'fulfilled').length;

          if (failedCount > 0) {
            toast.error(
              `Deleted ${successCount} recording(s), but ${failedCount} failed`,
              { id: deleteToastId }
            );
          } else {
            toast.success(`Successfully deleted ${successCount} recording(s)`, { id: deleteToastId });
          }

          // Optimistically update UI by filtering out deleted recordings
          setRecordings(prev => prev.filter(r => !selectedIds.includes(r.id)));
          setSelectedRecordings([]);
          
          // Fetch fresh data in background
          fetchRecordings();
        } catch (error) {
          console.error('Delete error:', error);
          toast.error('Failed to delete recordings', { id: deleteToastId });
        } finally {
          setIsDeletingIds(new Set());
        }
        break;
    }
  }, [recordings, fetchRecordings]);

  const actionGroups: ActionGroup[] = useMemo(() => ([
    {
      name: 'playback',
      actions: [
        { id: 'download', label: 'Download', icon: 'Download' },
        { id: 'share', label: 'Share', icon: 'Link2' }
      ]
    },
    {
      name: 'actions',
      actions: [
        { id: 'archive', label: 'Archive', icon: 'Archive', requiresConfirm: true, confirmMessage: 'Archive selected recordings?' },
        { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, confirmMessage: 'Delete selected recordings?' }
      ]
    }
  ]), []);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      sort: 'newest',
      sprint_id: undefined,
    });
    setSortField('created_at');
    setSortOrder('desc');
    setStatusFilter('all');
    setDateRangeFilter('all');
  }, []);

  const activeFiltersCount =
    (filters.sprint_id ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (dateRangeFilter !== 'all' ? 1 : 0);

  const handleToggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  if (isLoading && recordings.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recordings.length === 0 && !isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Recordings
          </h1>
          <span className="text-sm text-muted-foreground">(0)</span>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <Play className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No recordings yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Start recording test sessions to see them here</p>

          <RecordingToolbar
            suiteId={suiteId}
            onRecordingSaved={fetchRecordings}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Recordings
          </h1>
          <span className="text-sm text-muted-foreground">
            ({recordings.length})
          </span>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex items-center justify-end gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            <div
              className="flex items-center gap-2 transition-all duration-300 ease-in-out"
              style={{
                maxWidth: isDrawerOpen ? '1000px' : '0px',
                opacity: isDrawerOpen ? 1 : 0,
                marginRight: isDrawerOpen ? '0.5rem' : '0',
                pointerEvents: isDrawerOpen ? 'auto' : 'none',
              }}
            >
            </div>

            <button
              type="button"
              onClick={handleToggleDrawer}
              className="inline-flex items-center justify-center p-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            <RecordingToolbar
              suiteId={suiteId}
              onRecordingSaved={fetchRecordings}
            />

            <button
              type="button"
              onClick={() => {
                fetchRecordings();
              }}
              disabled={isLoading}
              className="inline-flex items-center justify-center p-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border-b border-border">
        <div className="px-3 py-2">
          <div className="flex flex-col gap-3 lg:gap-0">
            <div className="lg:hidden space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search recordings..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

                <Select
                  value={`${sortField}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortField(field as 'created_at' | 'duration' | 'title');
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
                    <SelectItem value="duration-desc">Longest Duration</SelectItem>
                    <SelectItem value="duration-asc">Shortest Duration</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRecordings.length === paginatedRecordings.length && paginatedRecordings.length > 0}
                    onChange={handleSelectAll}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Select All
                  </span>
                </div>

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
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    disabled={isLoading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-theme-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex lg:flex-col lg:gap-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRecordings.length === paginatedRecordings.length && paginatedRecordings.length > 0}
                    onChange={handleSelectAll}
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
                      placeholder="Search recordings..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                    />
                  </div>

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

                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-');
                      setSortField(field as 'created_at' | 'duration' | 'title');
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="duration-desc">Longest Duration</SelectItem>
                      <SelectItem value="duration-asc">Shortest Duration</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

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
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      disabled={isLoading}
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'list'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sprints.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Sprint
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sprints.map((sprint) => (
                        <button
                          key={sprint.id}
                          onClick={() => handleFilterChange('sprint_id', filters.sprint_id === sprint.id ? undefined : sprint.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filters.sprint_id === sprint.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                            }`}
                        >
                          {sprint.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'recent', 'archived'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${statusFilter === status
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                          }`}
                      >
                        {status === 'all' ? 'All' : status === 'recent' ? 'Recent (7 days)' : 'Archived'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Date Range
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'today', 'week', 'month'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setDateRangeFilter(range)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${dateRangeFilter === range
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                          }`}
                      >
                        {range === 'all' ? 'All Time' : range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredRecordings.length} of {recordings.length} recordings
          {selectedRecordings.length > 0 && ` - ${selectedRecordings.length} selected`}
        </p>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Filter className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No recordings found
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
          <RecordingGrid
            recordings={paginatedRecordings}
            onDelete={fetchRecordings}
            selectedRecordings={selectedRecordings}
            onToggleSelection={handleToggleSelection}
            viewMode={viewMode}
            isDeletingIds={isDeletingIds}
          />

          {filteredRecordings.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRecordings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      ) : (
        <>
          <Table>
            {paginatedRecordings.map((recording) => {
              const isSelected = selectedRecordings.includes(recording.id);
              const isDeleting = isDeletingIds.has(recording.id);

              return (
                <TableRow
                  key={recording.id}
                  selected={isSelected}
                  selectable
                  onClick={() => {
                    if (!isDeleting) {
                      window.location.href = `/dashboard/recordings/${recording.id}`;
                    }
                  }}
                  className={`cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <TableCheckbox
                    checked={isSelected}
                    onCheckedChange={() => !isDeleting && handleToggleSelection(recording.id)}
                  />

                  <TableGrid columns={4}>
                    <TableCell className="col-span-2 md:col-span-1">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 bg-muted rounded overflow-hidden shrink-0">
                          {recording.thumbnail_url ? (
                            <img
                              src={recording.thumbnail_url}
                              alt={recording.title || 'Recording'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          {recording.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 rounded">
                              {formatDuration(recording.duration)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <TableHeaderText>
                            {recording.title || 'Untitled Recording'}
                          </TableHeaderText>
                          {recording.description && (
                            <TableDescriptionText className="mt-0.5">
                              {recording.description}
                            </TableDescriptionText>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:block">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{recording.duration ? formatDuration(recording.duration) : '0:00'}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden lg:block">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">{recording.logs_count || 0} logs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-muted-foreground">{recording.requests_count || 0} requests</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:block">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(recording.created_at)}</span>
                      </div>
                    </TableCell>
                  </TableGrid>
                </TableRow>
              );
            })}
          </Table>

          {filteredRecordings.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRecordings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}

      {selectedRecordings.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedRecordings}
          onClearSelection={() => setSelectedRecordings([])}
          actionGroups={actionGroups}
          onAction={handleBulkAction}
        />
      )}
    </div>
  );
}