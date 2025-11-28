// ============================================
// components/reports/ScheduleTable.tsx
// Standalone table component for report schedules
// ============================================
'use client';

import { ReportScheduleWithReport, ReportFrequency } from '@/types/report.types';
import { Play, Pause, Trash2, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableHeaderText,
  TableDescriptionText,
} from '@/components/ui/Table';
import { useState } from 'react';

interface ScheduleTableProps {
  schedules: ReportScheduleWithReport[];
  onToggle: (scheduleId: string, isActive: boolean) => void;
  onDelete: (scheduleId: string) => void;
  onRunNow: (scheduleId: string) => void;
  onEdit: (schedule: ReportScheduleWithReport) => void;
}

export function ScheduleTable({
  schedules,
  onToggle,
  onDelete,
  onRunNow,
  onEdit,
}: ScheduleTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleToggle = async (schedule: ReportScheduleWithReport, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(schedule.id);
    try {
      await onToggle(schedule.id, !schedule.is_active);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (scheduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) return;
    
    setDeletingId(scheduleId);
    try {
      await onDelete(scheduleId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRunNow = async (scheduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRunningId(scheduleId);
    try {
      await onRunNow(scheduleId);
    } finally {
      setRunningId(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'text-error bg-destructive/10';
      case 'weekly': return 'text-warning bg-warning/10';
      case 'monthly': return 'text-info bg-info/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground mb-1">No scheduled reports</p>
        <p className="text-xs text-muted-foreground">
          Create a schedule to automatically generate and email reports
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="px-4 py-2 bg-muted/50 rounded-lg border border-border">
        <TableGrid columns={6} className="gap-4">
          <TableHeaderText className="text-xs uppercase font-semibold">
            Report Name
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Frequency
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Recipients
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Last Run
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Next Run
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold text-right">
            Actions
          </TableHeaderText>
        </TableGrid>
      </div>

      {/* Table Rows */}
      <Table className="space-y-2">
        {schedules.map((schedule) => {
          const isToggling = togglingId === schedule.id;
          const isDeleting = deletingId === schedule.id;
          const isRunning = runningId === schedule.id;
          
          return (
            <TableRow
              key={schedule.id}
              className="cursor-pointer"
              onClick={() => onEdit(schedule)}
            >
              <TableGrid columns={6} className="gap-4">
                {/* Report Name Column */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        schedule.is_active ? 'bg-success' : 'bg-muted-foreground'
                      }`} 
                      title={schedule.is_active ? 'Active' : 'Paused'}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {schedule.report?.name || 'Scheduled Report'}
                      </div>
                      <TableDescriptionText className="mt-0.5">
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </TableDescriptionText>
                    </div>
                  </div>
                </TableCell>

                {/* Frequency Column */}
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getFrequencyColor(schedule.frequency as string)}`}>
                    {getFrequencyLabel(schedule.frequency as string)}
                  </span>
                </TableCell>

                {/* Recipients Column */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">
                      {schedule.emails?.length || 0}
                    </span>
                  </div>
                  {schedule.emails && schedule.emails.length > 0 && (
                    <TableDescriptionText className="line-clamp-1 mt-1">
                      {schedule.emails[0]}
                      {schedule.emails.length > 1 && ` +${schedule.emails.length - 1} more`}
                    </TableDescriptionText>
                  )}
                </TableCell>

                {/* Last Run Column */}
                <TableCell>
                  {schedule.last_run ? (
                    <div>
                      <div className="text-sm text-foreground">
                        {format(new Date(schedule.last_run), 'MMM d')}
                      </div>
                      <TableDescriptionText className="mt-0.5">
                        {format(new Date(schedule.last_run), 'h:mm a')}
                      </TableDescriptionText>
                    </div>
                  ) : (
                    <TableDescriptionText>Never</TableDescriptionText>
                  )}
                </TableCell>

                {/* Next Run Column */}
                <TableCell>
                  {schedule.is_active && schedule.next_run ? (
                    <div>
                      <div className="text-sm text-foreground">
                        {format(new Date(schedule.next_run), 'MMM d, yyyy')}
                      </div>
                      <TableDescriptionText className="mt-0.5">
                        {format(new Date(schedule.next_run), 'h:mm a')}
                      </TableDescriptionText>
                    </div>
                  ) : (
                    <TableDescriptionText>—</TableDescriptionText>
                  )}
                </TableCell>

                {/* Actions Column */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => handleToggle(schedule, e)}
                      disabled={isToggling}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                      title={schedule.is_active ? 'Pause schedule' : 'Activate schedule'}
                    >
                      {schedule.is_active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    {schedule.is_active && (
                      <button
                        onClick={(e) => handleRunNow(schedule.id, e)}
                        disabled={isRunning}
                        className="px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-success hover:bg-success/10 rounded transition-colors disabled:opacity-50"
                        title="Run now"
                      >
                        {isRunning ? 'Running...' : 'Run'}
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(schedule.id, e)}
                      disabled={isDeleting}
                      className="p-1.5 text-muted-foreground hover:text-error hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableGrid>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}