// ============================================
// components/recordings/RecordingsView.tsx
// Parent component managing selection and pagination
// ============================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Recording, RecordingFilters } from '@/types/recording.types';
import { RecordingGrid } from './RecordingGrid';
import { RecordingToolbar } from './RecordingToolbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Search, Grid3x3, List, CheckSquare, Square, Play, Clock, Calendar } from 'lucide-react';
import { getRecordings } from '@/lib/actions/recordings';
import { Skeleton } from '@/components/ui/Skeleton';
import { BulkActionsBar, type ActionGroup } from '@/components/shared/BulkActionBar';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from 'sonner';
import { deleteRecording } from '@/lib/actions/recordings';
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
  const [filters, setFilters] = useState<RecordingFilters>({
    search: '',
    sort: 'newest',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Selection and pagination state
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const fetchRecordings = async () => {
    setIsLoading(true);
    const { data } = await getRecordings(suiteId, filters);
    if (data) {
      setRecordings(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchRecordings();
    }, 300);

    return () => clearTimeout(debounce);
  }, [filters]);

  const handleFilterChange = (key: keyof RecordingFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Filter recordings based on search/filters
  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => {
      const matchesSearch = !filters.search || 
        recording.title?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesSprint = !filters.sprint_id || recording.sprint_id === filters.sprint_id;
      return matchesSearch && matchesSprint;
    });
  }, [recordings, filters]);

  // Paginate filtered recordings
  const paginatedRecordings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecordings.slice(start, start + itemsPerPage);
  }, [filteredRecordings, currentPage, itemsPerPage]);

  // Selection handlers
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

  // Bulk actions handler
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
        // Implement archive logic
        setSelectedRecordings([]);
        break;
        
      case 'delete':
        if (!confirm(`Delete ${selectedIds.length} recording(s)? This cannot be undone.`)) return;
        
        try {
          for (const id of selectedIds) {
            await deleteRecording(id);
          }
          toast.success(`Deleted ${selectedIds.length} recording(s)`);
          await fetchRecordings();
          setSelectedRecordings([]);
        } catch (error) {
          toast.error('Failed to delete some recordings');
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

  // Format duration helper
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date helper
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Recordings</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {filteredRecordings.length} recording{filteredRecordings.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Recording Toolbar */}
        <RecordingToolbar
          suiteId={suiteId}
          onRecordingSaved={fetchRecordings}
        />
      </div>

      {/* Filters Bar - Single Row */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
        {/* Select All Checkbox */}
        {paginatedRecordings.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="p-2 hover:bg-muted rounded transition-colors shrink-0"
            title={allSelected ? 'Deselect all' : 'Select all on this page'}
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-primary" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Search */}
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Sprint Filter */}
        {sprints.length > 0 && (
          <Select
            value={filters.sprint_id || 'all'}
            onValueChange={(value) =>
              handleFilterChange('sprint_id', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Spacer to push view toggle to the right */}
        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRecordings.length === 0 ? (
        <TableEmpty
          icon={<Play className="w-8 h-8 text-primary" />}
          title="No recordings found"
          description="Start recording test sessions to see them here"
        />
      ) : viewMode === 'grid' ? (
        <>
          <RecordingGrid
            recordings={paginatedRecordings}
            onDelete={fetchRecordings}
            selectedRecordings={selectedRecordings}
            onToggleSelection={handleToggleSelection}
            viewMode={viewMode}
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
          {/* List/Table View */}
          <Table>
            {paginatedRecordings.map((recording) => {
              const isSelected = selectedRecordings.includes(recording.id);
              
              return (
                <TableRow
                  key={recording.id}
                  selected={isSelected}
                  selectable
                  onClick={() => {
                    // Navigate to recording detail
                    window.location.href = `/dashboard/recordings/${recording.id}`;
                  }}
                  className="cursor-pointer"
                >
                  {/* Checkbox */}
                  <TableCheckbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelection(recording.id)}
                  />

                  {/* Content Grid */}
                  <TableGrid columns={4}>
                    {/* Recording Info */}
                    <TableCell className="col-span-2 md:col-span-1">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
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

                        {/* Title & Description */}
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

                    {/* Duration */}
                    <TableCell className="hidden md:block">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{recording.duration ? formatDuration(recording.duration) : '0:00'}</span>
                      </div>
                    </TableCell>

                    {/* Stats */}
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

                    {/* Date */}
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

      {/* Bulk Actions Bar */}
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