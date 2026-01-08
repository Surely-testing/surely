// ============================================
// components/recordings/RecordingTable.tsx
// Table view for recordings with proper custom table design
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

  return (
    <Table>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <TableHeader columns={5}>
          <div className="border-r border-border pr-4">
            <input
              type="checkbox"
              checked={selectedRecordings.length === recordings.length && recordings.length > 0}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 cursor-pointer"
            />
          </div>
          <TableHeaderCell>Recording</TableHeaderCell>
          <TableHeaderCell>Duration</TableHeaderCell>
          <TableHeaderCell>Activity</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
        </TableHeader>

        {recordings.map((recording) => {
          const isSelected = selectedRecordings.includes(recording.id);
          const isDeleting = isDeletingIds.has(recording.id);

          return (
            <TableRow
              key={recording.id}
              selected={isSelected}
              columns={5}
              onClick={() => {
                if (!isDeleting) {
                  window.location.href = `/dashboard/recordings/${recording.id}`;
                }
              }}
              className={`cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="border-r border-border pr-4">
                <TableCheckbox
                  checked={isSelected}
                  onCheckedChange={() => !isDeleting && onToggleSelection(recording.id)}
                />
              </div>

              <TableCell>
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

              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{recording.duration ? formatDuration(recording.duration) : '0:00'}</span>
                </div>
              </TableCell>

              <TableCell>
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

              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(recording.created_at)}</span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </div>
    </Table>
  );
}