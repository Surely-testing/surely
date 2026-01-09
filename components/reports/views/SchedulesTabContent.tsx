// ============================================
// FILE: components/reports/SchedulesTabContent.tsx
// Schedules tab content with filtering
// ============================================

import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScheduleTable } from '@/components/reports/ScheduleTable';
import { ReportScheduleWithReport } from '@/types/report.types';
import { ScheduleGrid } from '@/components/reports/ScheduleGrid';

type ViewMode = 'grid' | 'table';

interface SchedulesTabContentProps {
  schedules: ReportScheduleWithReport[];
  searchQuery: string;
  filterScheduleStatus: string[];
  filterFrequency: string[];
  viewMode: ViewMode;
  selectedScheduleIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (id: string, name?: string) => void;
  onRunNow: (id: string) => Promise<void>;
  onEdit: (schedule: ReportScheduleWithReport) => void;
  isLoading: boolean;
  onClearFilters: () => void;
}

export function SchedulesTabContent({
  schedules,
  searchQuery,
  filterScheduleStatus,
  filterFrequency,
  viewMode,
  selectedScheduleIds,
  onSelectionChange,
  onToggle,
  onDelete,
  onRunNow,
  onEdit,
  isLoading,
  onClearFilters
}: SchedulesTabContentProps) {
  // Filter logic
  const getFilteredSchedules = () => {
    let filtered = [...schedules];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(schedule =>
        schedule.name?.toLowerCase().includes(query) ||
        schedule.description?.toLowerCase().includes(query)
      );
    }

    if (filterScheduleStatus.length > 0) {
      filtered = filtered.filter(schedule => {
        const status = schedule.is_active ? 'active' : 'inactive';
        return filterScheduleStatus.includes(status);
      });
    }

    if (filterFrequency.length > 0) {
      filtered = filtered.filter(schedule => filterFrequency.includes(schedule.frequency));
    }

    return filtered;
  };

  const filteredSchedules = useMemo(() => getFilteredSchedules(), [
    schedules, searchQuery, filterScheduleStatus, filterFrequency
  ]);

  // No results after filtering
  if (filteredSchedules.length === 0 && schedules.length > 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Filter className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">No schedules found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your filters or search query
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {filteredSchedules.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <ScheduleGrid
              schedules={filteredSchedules}
              onToggle={onToggle}
              onDelete={onDelete}
              onRunNow={onRunNow}
              onEdit={onEdit}
              selectedSchedules={selectedScheduleIds}
              onSelectionChange={onSelectionChange}
            />
          ) : (
            <ScheduleTable
              schedules={filteredSchedules}
              onToggle={onToggle}
              onDelete={onDelete}
              onRunNow={onRunNow}
              onEdit={onEdit}
              selectedSchedules={selectedScheduleIds}
              onSelectionChange={onSelectionChange}
            />
          )}
        </>
      )}
    </div>
  );
}