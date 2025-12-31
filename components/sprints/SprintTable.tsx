// ============================================
// FILE: components/sprints/SprintTable.tsx
// Table view for sprints with selection and actions
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
      icon: '📌'
    };
  };

  return (
    <div className="w-full overflow-x-auto pl-3">
      {/* Table Header */}
      <div className="grid grid-cols-[minmax(180px,2fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] lg:grid-cols-[minmax(200px,3fr)_minmax(130px,1.5fr)_minmax(120px,1.5fr)_minmax(120px,1.5fr)_minmax(120px,1.5fr)_minmax(100px,1fr)] gap-4 pl-10 pr-4 py-2 bg-muted/50 rounded-lg border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 min-w-[600px] lg:min-w-0">
        <div>Title</div>
        <div>Status</div>
        <div className="hidden lg:block">Start Date</div>
        <div className="hidden lg:block">End Date</div>
        <div>Progress</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="space-y-4">
        {sprints.map((sprint) => {
          const isSelected = selectedSprints.includes(sprint.id);
          const statusInfo = getStatusInfo(sprint.status);
          const progress = calculateProgress(sprint);
         
          return (
            <div
              key={sprint.id}
              className="relative"
            >
              {/* Checkbox - Outside row */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                <div
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleSelection(sprint.id);
                  }}
                  className={`w-5 h-5 rounded border-2 cursor-pointer transition-all flex items-center justify-center ${
                    isSelected 
                      ? 'bg-primary border-primary opacity-100' 
                      : 'border-border hover:border-primary/50 opacity-0 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Row */}
              <div
                className={`relative border rounded-lg transition-all p-4 pl-12 min-w-[600px] lg:min-w-0 ${
                  isSelected
                    ? 'bg-primary/5 border-primary/50'
                    : 'bg-transparent border-border hover:bg-accent/5'
                }`}
              >
                <div className="grid grid-cols-[minmax(180px,2fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] lg:grid-cols-[minmax(200px,3fr)_minmax(130px,1.5fr)_minmax(120px,1.5fr)_minmax(120px,1.5fr)_minmax(120px,1.5fr)_minmax(100px,1fr)] gap-4 items-center">
                  {/* Title */}
                  <div>
                    <div className="text-sm font-semibold text-foreground line-clamp-2">
                      {sprint.name}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span className="truncate">{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Start Date - Hidden on mobile */}
                  <div className="hidden lg:block">
                    <span className="text-sm text-foreground">
                      {sprint.start_date ? formatDate(sprint.start_date) : 'Not set'}
                    </span>
                  </div>

                  {/* End Date - Hidden on mobile */}
                  <div className="hidden lg:block">
                    <span className="text-sm text-foreground">
                      {sprint.end_date ? formatDate(sprint.end_date) : 'No deadline'}
                    </span>
                  </div>

                  {/* Progress */}
                  <div>
                    {/* Mobile: % only */}
                    <span className="text-sm font-semibold text-foreground lg:hidden">{progress}%</span>
                    {/* Desktop: Bar + % */}
                    <div className="hidden lg:flex items-center gap-2">
                      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden min-w-[60px]">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">{progress}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <div className="flex items-center justify-end gap-1">
                      {/* View Button */}
                      <Link
                        href={`/dashboard/sprints/${sprint.id}`}
                        className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* More Options - Hidden on mobile */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="hidden lg:block p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {sprint.status === 'planning' && onStart && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStart(sprint.id);
                                }}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Sprint
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                         
                          {onEdit && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(sprint);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                         
                          {onDuplicate && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicate(sprint.id);
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          )}
                         
                          {sprint.status !== 'archived' && onArchive && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onArchive(sprint.id);
                                }}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}
                         
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(sprint.id);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}