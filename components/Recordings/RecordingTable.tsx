// ============================================
// components/recordings/RecordingTable.tsx
// Using custom Table components with responsive behavior
// ============================================

'use client';

import { Recording } from '@/types/recording.types';
import { Play, Clock, Calendar } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableEmpty,
} from '@/components/ui/Table';

interface RecordingTableProps {
  recordings: Recording[];
  selectedRecordings: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  isDeletingIds: Set<string>;
}

export function RecordingTable({
  recordings,
  selectedRecordings,
  onToggleSelection,
  onSelectAll,
  isDeletingIds,
}: RecordingTableProps) {
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

  if (recordings.length === 0) {
    return (
      <TableEmpty
        title="No recordings to display"
        description="Start recording to capture your sessions."
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="recording" sticky minWidth="min-w-[320px]">Recording</TableHeaderCell>,
          <TableHeaderCell key="duration" minWidth="min-w-[120px]">Duration</TableHeaderCell>,
          <TableHeaderCell key="activity" minWidth="min-w-[200px]">Activity</TableHeaderCell>,
          <TableHeaderCell key="date" minWidth="min-w-[140px]">Date</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {recordings.map((recording) => {
        const isSelected = selectedRecordings.includes(recording.id);
        const isDeleting = isDeletingIds.has(recording.id);

        return (
          <TableRow
            key={recording.id}
            selected={isSelected}
            onClick={() => {
              if (!isDeleting) {
                window.location.href = `/dashboard/recordings/${recording.id}`;
              }
            }}
            className={`cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => !isDeleting && onToggleSelection(recording.id)}
            />

            {/* Recording - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
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
                  <div className="font-medium text-sm text-foreground truncate">
                    {recording.title || 'Untitled Recording'}
                  </div>
                  {recording.description && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {recording.description}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>

            {/* Duration */}
            <TableCell minWidth="min-w-[120px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{recording.duration ? formatDuration(recording.duration) : '0:00'}</span>
              </div>
            </TableCell>

            {/* Activity */}
            <TableCell minWidth="min-w-[200px]">
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
            <TableCell minWidth="min-w-[140px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(recording.created_at)}</span>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}