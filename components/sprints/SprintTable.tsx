// ============================================
// components/sprints/SprintTable.tsx
// Mobile: full scroll | Desktop: sticky checkbox & title
// ============================================
'use client';
import React from 'react';
import { MoreVertical, Play, Edit, Archive, Trash2, Copy, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
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
    icon: '📋'
  },
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: '🚀'
  },
  'on-hold': {
    label: 'On Hold',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: '⏸️'
  },
  completed: {
    label: 'Completed',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: '✅'
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: '📦'
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
  const handleToggleSelection = (sprintId: string, event: React.MouseEvent) => {
    event.stopPropagation();
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
      icon: '📌'
    };
  };

  if (sprints.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No sprints to display
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
            Title
          </div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Sprint ID</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Status</div>
          <div className="w-36 px-4 py-2 border-r border-border flex-shrink-0">Start Date</div>
          <div className="w-36 px-4 py-2 border-r border-border flex-shrink-0">End Date</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Progress</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Test Cases</div>
          <div className="w-36 px-4 py-2 border-r border-border flex-shrink-0">Team Members</div>
          <div className="w-32 px-4 py-2 flex-shrink-0">Actions</div>
        </div>

        {/* Table Body */}
        {sprints.map((sprint) => {
          const isSelected = selectedSprints.includes(sprint.id);
          const statusInfo = getStatusInfo(sprint.status);
          const progress = calculateProgress(sprint);

          return (
            <div
              key={sprint.id}
              className={`flex items-center border-b border-border last:border-b-0 transition-colors ${
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox - Sticky on md+ */}
              <div className={`w-12 px-4 py-3 border-r border-border flex items-center justify-center md:sticky md:left-0 md:z-10 ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={(e) => handleToggleSelection(sprint.id, e)}
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
              </div>

              {/* Title - Sticky on md+ with shadow */}
              <div className={`w-80 px-4 py-3 border-r border-border md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div 
                  className="font-medium truncate cursor-help"
                  title={sprint.name}
                >
                  {sprint.name}
                </div>
              </div>

              {/* Sprint ID */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono">
                  {sprint.id.slice(0, 8)}
                </span>
              </div>

              {/* Status */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                  <span>{statusInfo.icon}</span>
                  <span>{statusInfo.label}</span>
                </span>
              </div>

              {/* Start Date */}
              <div className="w-36 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">
                  {sprint.start_date ? formatDate(sprint.start_date) : '—'}
                </span>
              </div>

              {/* End Date */}
              <div className="w-36 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">
                  {sprint.end_date ? formatDate(sprint.end_date) : '—'}
                </span>
              </div>

              {/* Progress */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
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
              </div>

              {/* Test Cases */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">
                  {sprint.completed_test_cases !== undefined && sprint.total_test_cases !== undefined
                    ? `${sprint.completed_test_cases} / ${sprint.total_test_cases}`
                    : '—'}
                </span>
              </div>

              {/* Team Members */}
              <div className="w-36 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">
                  {sprint.team_members !== undefined ? `${sprint.team_members} members` : '—'}
                </span>
              </div>

              {/* Actions */}
              <div className="w-32 px-4 py-3 flex-shrink-0">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}