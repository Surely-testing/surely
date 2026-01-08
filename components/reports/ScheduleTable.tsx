// ============================================
// FILE: components/reports/ScheduleTable.tsx
// Mobile: full scroll | Desktop: sticky checkbox & title
// ============================================

import { ReportScheduleWithReport } from '@/types/report.types';
import { Calendar, Edit, MoreVertical, Play, Power, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/Dropdown';

interface ScheduleTableProps {
  schedules: ReportScheduleWithReport[];
  onToggle: (scheduleId: string, isActive: boolean) => void;
  onDelete: (scheduleId: string) => void;
  onRunNow: (scheduleId: string) => void;
  onEdit: (schedule: ReportScheduleWithReport) => void;
  selectedSchedules?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  isLoading?: boolean;
  viewMode?: 'grid' | 'table';
}

export function ScheduleTable({
  schedules,
  onToggle,
  onDelete,
  onRunNow,
  onEdit,
  selectedSchedules = [],
  onSelectionChange,
  isLoading = false
}: ScheduleTableProps) {

  const handleToggleSelection = (scheduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onSelectionChange) return;

    if (selectedSchedules.includes(scheduleId)) {
      onSelectionChange(selectedSchedules.filter(id => id !== scheduleId));
    } else {
      onSelectionChange([...selectedSchedules, scheduleId]);
    }
  };

  const getFrequencyVariant = (frequency: string): string => {
    switch (frequency) {
      case 'daily': return 'bg-blue-500 text-white';
      case 'weekly': return 'bg-green-500 text-white';
      case 'monthly': return 'bg-yellow-400 text-yellow-900';
      default: return 'bg-gray-400 text-gray-900';
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
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No schedules found</h3>
        <p className="text-sm text-muted-foreground">Create your first report schedule to automate reporting</p>
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-lg bg-card overflow-x-auto">
      <div className="min-w-max">
        {/* Table Header */}
        <div className="flex bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="w-12 px-4 py-2 border-r border-border flex items-center justify-center md:sticky md:left-0 bg-muted md:z-10">
            {/* Empty for checkbox */}
          </div>
          <div className="w-80 px-4 py-2 border-r border-border md:sticky md:left-12 bg-muted md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Schedule Name
          </div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Schedule ID</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Frequency</div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Time</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Next Run</div>
          <div className="w-36 px-4 py-2 border-r border-border flex-shrink-0">Status</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Report Type</div>
          <div className="w-32 px-4 py-2 flex-shrink-0">Actions</div>
        </div>

        {/* Table Body */}
        {schedules.map((schedule) => {
          const isSelected = selectedSchedules.includes(schedule.id);
          const isActive = schedule.is_active;

          return (
            <div
              key={schedule.id}
              className={`flex items-center border-b border-border last:border-b-0 transition-colors ${
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox - Sticky on md+ */}
              <div className={`w-12 px-4 py-3 border-r border-border flex items-center justify-center md:sticky md:left-0 md:z-10 ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                {onSelectionChange && (
                  <div
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={(e) => handleToggleSelection(schedule.id, e)}
                    className={`w-4 h-4 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Name - Sticky on md+ with shadow */}
              <div className={`w-80 px-4 py-3 border-r border-border md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div 
                  className="font-medium truncate cursor-help"
                  title={schedule.name || 'Untitled Schedule'}
                >
                  {schedule.name || 'Untitled Schedule'}
                </div>
              </div>

              {/* Schedule ID */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono">
                  {schedule.id.slice(0, 8)}
                </span>
              </div>

              {/* Frequency */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap capitalize ${getFrequencyVariant(schedule.frequency)}`}>
                  {schedule.frequency}
                </span>
              </div>

              {/* Time */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">
                  {schedule.schedule_time || '—'}
                </span>
              </div>

              {/* Next Run */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">
                  {formatDate(schedule.next_run_at)}
                </span>
              </div>

              {/* Status */}
              <div className="w-36 px-4 py-3 border-r border-border flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-gray-900'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Report Type */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm capitalize">
                  {schedule.report?.type?.replace('_', ' ') || '—'}
                </span>
              </div>

              {/* Actions */}
              <div className="w-32 px-4 py-3 flex-shrink-0">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(schedule);
                    }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onRunNow(schedule.id)}>
                        <Play className="w-4 h-4" />
                        Run Now
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggle(schedule.id, !isActive)}>
                        <Power className="w-4 h-4" />
                        {isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(schedule.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}