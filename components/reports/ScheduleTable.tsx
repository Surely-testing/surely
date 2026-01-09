// ============================================
// FILE: components/reports/ScheduleTable.tsx
// Using custom Table components with responsive behavior
// ============================================

import { ReportScheduleWithReport } from '@/types/report.types';
import { Calendar, Edit, MoreVertical, Play, Power, Trash2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableEmpty,
} from '@/components/ui/Table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/Dropdown';

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

  const handleToggleSelection = (scheduleId: string) => {
    if (!onSelectionChange) return;

    if (selectedSchedules.includes(scheduleId)) {
      onSelectionChange(selectedSchedules.filter(id => id !== scheduleId));
    } else {
      onSelectionChange([...selectedSchedules, scheduleId]);
    }
  };

  const getFrequencyVariant = (frequency: string): "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red" => {
    switch (frequency) {
      case 'daily': return 'default';
      case 'weekly': return 'green';
      case 'monthly': return 'yellow';
      default: return 'gray';
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
        icon={<Calendar className="w-8 h-8 text-primary" />}
        title="No schedules found"
        description="Create your first report schedule to automate reporting"
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="name" sticky minWidth="min-w-[320px]">Schedule Name</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[120px]">Schedule ID</TableHeaderCell>,
          <TableHeaderCell key="frequency" minWidth="min-w-[120px]">Frequency</TableHeaderCell>,
          <TableHeaderCell key="time" minWidth="min-w-[120px]">Time</TableHeaderCell>,
          <TableHeaderCell key="next" minWidth="min-w-[140px]">Next Run</TableHeaderCell>,
          <TableHeaderCell key="status" minWidth="min-w-[120px]">Status</TableHeaderCell>,
          <TableHeaderCell key="type" minWidth="min-w-[160px]">Report Type</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {schedules.map((schedule) => {
        const isSelected = selectedSchedules.includes(schedule.id);
        const isActive = schedule.is_active;

        return (
          <TableRow key={schedule.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(schedule.id)}
            />

            {/* Name - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div 
                className="font-medium truncate cursor-help"
                title={schedule.name || 'Untitled Schedule'}
              >
                {schedule.name || 'Untitled Schedule'}
              </div>
            </TableCell>

            {/* Schedule ID */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground font-mono">
                {schedule.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Frequency */}
            <TableCell minWidth="min-w-[120px]">
              <div className="flex items-center h-full py-1">
                <div className={`
                  inline-flex items-center justify-center px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap capitalize w-24
                  ${getFrequencyVariant(schedule.frequency) === 'default' ? 'bg-gray-100 text-gray-800' : ''}
                  ${getFrequencyVariant(schedule.frequency) === 'green' ? 'bg-green-500 text-white' : ''}
                  ${getFrequencyVariant(schedule.frequency) === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                  ${getFrequencyVariant(schedule.frequency) === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                `}>
                  {schedule.frequency}
                </div>
              </div>
            </TableCell>

            {/* Time */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm">
                {schedule.schedule_time || '—'}
              </span>
            </TableCell>

            {/* Next Run */}
            <TableCell minWidth="min-w-[140px]">
              <span className="text-sm">
                {formatDate(schedule.next_run_at)}
              </span>
            </TableCell>

            {/* Status */}
            <TableCell minWidth="min-w-[120px]">
              <div className="flex items-center h-full py-1">
                <div className={`
                  inline-flex items-center justify-center px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap w-20
                  ${isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-gray-900'}
                `}>
                  {isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </TableCell>

            {/* Report Type */}
            <TableCell minWidth="min-w-[160px]">
              <span className="text-sm capitalize">
                {schedule.report?.type?.replace('_', ' ') || '—'}
              </span>
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[120px]">
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
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}