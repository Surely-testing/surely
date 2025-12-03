// ============================================
// components/reports/ScheduleTable.tsx
// Updated with selection support using custom Table components
// ============================================

import { ReportScheduleWithReport } from '@/types/report.types';
import { ScheduleGrid } from './ScheduleGrid';
import { Calendar } from 'lucide-react';
import { Table, TableCell, TableCheckbox, TableDescriptionText, TableEmpty, TableGrid, TableHeaderText, TableRow } from '../ui/Table';

interface ScheduleTableProps {
  schedules: ReportScheduleWithReport[];
  onToggle: (scheduleId: string, isActive: boolean) => void;
  onDelete: (scheduleId: string) => void;
  onRunNow: (scheduleId: string) => void;
  onEdit: (schedule: ReportScheduleWithReport) => void;
  viewMode?: 'grid' | 'table';
  selectedSchedules?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onSelectAll?: () => void;
  isLoading?: boolean;
}

export function ScheduleTable({
  schedules,
  onToggle,
  onDelete,
  onRunNow,
  onEdit,
  viewMode = 'table',
  selectedSchedules = [],
  onSelectionChange,
  onSelectAll,
  isLoading = false
}: ScheduleTableProps) {

  const handleToggleSelection = (scheduleId: string) => {
    if (!onSelectionChange) return;

    if (selectedSchedules.includes(scheduleId)) {
      onSelectionChange(selectedSchedules.filter(id => id !== scheduleId));
    } else {
      onSelectionChange([...selectedSchedules, scheduleId]);
    }
  };

  // If grid view is selected, use ScheduleGrid component
  if (viewMode === 'grid') {
    return (
      <ScheduleGrid
        schedules={schedules}
        onToggle={onToggle}
        onDelete={onDelete}
        onRunNow={onRunNow}
        onEdit={onEdit}
        selectedSchedules={selectedSchedules}
        onSelectionChange={onSelectionChange}
      />
    );
  }

  const getFrequencyColor = (frequency: string): string => {
    switch (frequency) {
      case 'daily': return 'text-info bg-info/10 border-info/20';
      case 'weekly': return 'text-success bg-success/10 border-success/20';
      case 'monthly': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (schedules.length === 0) {
    return (
      <TableEmpty
        icon={<Calendar className="w-8 h-8 text-muted-foreground" />}
        title="No schedules found"
        description="Create your first report schedule to automate reporting"
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-4 py-2 bg-muted/50 rounded-lg border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        <div>Schedule Name</div>
        <div>Frequency</div>
        <div>Time</div>
        <div>Next Run</div>
        <div>Status</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Rows */}
      {schedules.map((schedule) => {
        const isActive = schedule.is_active;
        const isSelected = selectedSchedules.includes(schedule.id);

        return (
          <TableRow
            key={schedule.id}
            selected={isSelected}
            selectable={!!onSelectionChange}
            onClick={() => onEdit(schedule)}
            className={`cursor-pointer ${!isActive ? 'opacity-60' : ''}`}
          >
            {/* Selection Checkbox */}
            {onSelectionChange && (
              <TableCheckbox
                checked={isSelected}
                onCheckedChange={() => handleToggleSelection(schedule.id)}
              />
            )}

            {/* Mobile: Show only 3 columns */}
            <div className="grid grid-cols-3 gap-4 lg:hidden">
              <TableCell>
                <TableHeaderText>{schedule.name || 'Untitled Schedule'}</TableHeaderText>
                {schedule.description && (
                  <TableDescriptionText>{schedule.description}</TableDescriptionText>
                )}
              </TableCell>

              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block capitalize ${getFrequencyColor(schedule.frequency)}`}>
                  {schedule.frequency}
                </span>
              </TableCell>

              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${isActive
                  ? 'text-success bg-success/10 border-success/20'
                  : 'text-muted-foreground bg-muted border-border'
                  }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
            </div>

            {/* Desktop: Show all 6 columns */}
            <TableGrid columns={6} className="hidden lg:grid">
              {/* Schedule Name Column */}
              <TableCell>
                <TableHeaderText>{schedule.name || 'Untitled Schedule'}</TableHeaderText>
                {schedule.description && (
                  <TableDescriptionText>{schedule.description}</TableDescriptionText>
                )}
              </TableCell>

              {/* Frequency Column */}
              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block capitalize ${getFrequencyColor(schedule.frequency)}`}>
                  {schedule.frequency}
                </span>
              </TableCell>

              {/* Time Column */}
              <TableCell>
                <span className="text-sm text-foreground">
                  {schedule.schedule_time || 'N/A'}
                </span>
              </TableCell>

              {/* Next Run Column */}
              <TableCell>
                <span className="text-sm text-foreground">
                  {formatDate(schedule.next_run_at)}
                </span>
              </TableCell>

              {/* Status Column */}
              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${isActive
                  ? 'text-success bg-success/10 border-success/20'
                  : 'text-muted-foreground bg-muted border-border'
                  }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>

              {/* Actions Column */}
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(schedule);
                    }}
                    className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunNow(schedule.id);
                    }}
                    className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Run Now"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(schedule.id, !isActive);
                    }}
                    className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                    title={isActive ? 'Deactivate' : 'Activate'}
                  >
                    {isActive ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(schedule.id);
                    }}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </TableCell>
            </TableGrid>
          </TableRow>
        );
      })}
    </Table>
  );
}