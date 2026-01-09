// ============================================
// components/sprints/SprintTable.tsx
// Using custom Table components with responsive behavior
// ============================================
'use client';
import React from 'react';
import { MoreVertical, Play, Edit, Archive, Trash2, Copy, Eye, ClipboardList, Rocket, Pause, CheckCircle, Package } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
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
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import Link from 'next/link';

interface Sprint {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  goals?: string | null;
  created_at: string;
  updated_at: string;
  team_members?: number;
  progress?: number;
  total_test_cases?: number;
  completed_test_cases?: number;
}

interface SprintTableProps {
  sprints: Sprint[];
  suiteId: string;
  selectedSprints: string[];
  onSelectionChange: (selected: string[]) => void;
  onEdit?: (sprint: Sprint) => void;
  onDelete?: (sprintId: string) => void;
  onArchive?: (sprintId: string) => void;
  onDuplicate?: (sprintId: string) => void;
  onStart?: (sprintId: string) => void;
  hideSelectAll?: boolean;
}

const statusConfig = {
  planning: {
    label: 'Planning',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: ClipboardList
  },
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Rocket
  },
  'on-hold': {
    label: 'On Hold',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Pause
  },
  completed: {
    label: 'Completed',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: CheckCircle
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: Package
  }
};

export function SprintTable({
  sprints,
  suiteId,
  selectedSprints,
  onSelectionChange,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onStart,
  hideSelectAll = false
}: SprintTableProps) {
  const handleToggleSelection = (sprintId: string) => {
    if (selectedSprints.includes(sprintId)) {
      onSelectionChange(selectedSprints.filter(id => id !== sprintId));
    } else {
      onSelectionChange([...selectedSprints, sprintId]);
    }
  };

  const calculateProgress = (sprint: Sprint): number => {
    if (sprint.completed_test_cases && sprint.total_test_cases) {
      return Math.round((sprint.completed_test_cases / sprint.total_test_cases) * 100);
    }
    return sprint.progress || 0;
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      icon: ClipboardList
    };
  };

  if (sprints.length === 0) {
    return (
      <TableEmpty
        title="No sprints to display"
        description="Create your first sprint to get started."
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="title" sticky minWidth="min-w-[320px]">Title</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[120px]">Sprint ID</TableHeaderCell>,
          <TableHeaderCell key="status" minWidth="min-w-[140px]">Status</TableHeaderCell>,
          <TableHeaderCell key="start" minWidth="min-w-[120px]">Start Date</TableHeaderCell>,
          <TableHeaderCell key="end" minWidth="min-w-[120px]">End Date</TableHeaderCell>,
          <TableHeaderCell key="progress" minWidth="min-w-[180px]">Progress</TableHeaderCell>,
          <TableHeaderCell key="tests" minWidth="min-w-[140px]">Test Cases</TableHeaderCell>,
          <TableHeaderCell key="members" minWidth="min-w-[140px]">Team Members</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {sprints.map((sprint) => {
        const isSelected = selectedSprints.includes(sprint.id);
        const statusInfo = getStatusInfo(sprint.status);
        const StatusIcon = statusInfo.icon;
        const progress = calculateProgress(sprint);

        return (
          <TableRow key={sprint.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(sprint.id)}
            />

            {/* Title - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div 
                className="font-medium truncate cursor-help"
                title={sprint.name}
              >
                {sprint.name}
              </div>
            </TableCell>

            {/* Sprint ID */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground font-mono">
                {sprint.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Status */}
            <TableCell minWidth="min-w-[140px]">
              <div className="flex items-center h-full py-1">
                <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full w-32 ${statusInfo.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusInfo.label}</span>
                </div>
              </div>
            </TableCell>

            {/* Start Date */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm">
                {sprint.start_date ? formatDate(sprint.start_date) : '—'}
              </span>
            </TableCell>

            {/* End Date */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm">
                {sprint.end_date ? formatDate(sprint.end_date) : '—'}
              </span>
            </TableCell>

            {/* Progress */}
            <TableCell minWidth="min-w-[180px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap w-10 text-right">
                  {progress}%
                </span>
              </div>
            </TableCell>

            {/* Test Cases */}
            <TableCell minWidth="min-w-[140px]">
              <span className="text-sm">
                {sprint.completed_test_cases !== undefined && sprint.total_test_cases !== undefined
                  ? `${sprint.completed_test_cases} / ${sprint.total_test_cases}`
                  : '—'}
              </span>
            </TableCell>

            {/* Team Members */}
            <TableCell minWidth="min-w-[140px]">
              <span className="text-sm">
                {sprint.team_members !== undefined ? `${sprint.team_members} members` : '—'}
              </span>
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[120px]">
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/sprints/${sprint.id}`}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title="View sprint"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {sprint.status === 'planning' && onStart && (
                      <>
                        <DropdownMenuItem onClick={() => onStart(sprint.id)}>
                          <Play className="w-4 h-4" />
                          Start Sprint
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(sprint)}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(sprint.id)}>
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    
                    {sprint.status !== 'archived' && onArchive && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onArchive(sprint.id)}>
                          <Archive className="w-4 h-4" />
                          Archive
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(sprint.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
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