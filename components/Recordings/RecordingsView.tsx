// ============================================
// components/recordings/RecordingsView.tsx
// ============================================

'use client';

import { useState, useEffect } from 'react';
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
import { Search, SlidersHorizontal, Grid3x3, List } from 'lucide-react';
import { getRecordings } from '@/lib/actions/recordings';
import { Skeleton } from '@/components/ui/Skeleton';

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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recordings</h1>
          <p className="text-muted-foreground mt-1">
            Capture and review test sessions
          </p>
        </div>
        
        {/* Recording Toolbar */}
        <RecordingToolbar
          suiteId={suiteId}
          onRecordingSaved={fetchRecordings}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {sprints.length > 0 && (
          <Select
            value={filters.sprint_id || 'all'}
            onValueChange={(value) =>
              handleFilterChange('sprint_id', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sprints</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.sort || 'newest'}
          onValueChange={(value: any) => handleFilterChange('sort', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="duration">Longest first</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'outline'}
            size="md"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'outline'}
            size="md"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <RecordingGrid recordings={recordings} onDelete={fetchRecordings} />
      )}
    </div>
  );
}