// ============================================
// FILE: components/sprints/SprintTable.tsx
// Table view for sprints with selection and actions
// ============================================
'use client';

import React from 'react';
import { 
  Table, 
  TableRow, 
  TableCell, 
  TableGrid, 
  TableCheckbox,
  TableHeaderText,
  TableDescriptionText 
} from '@/components/ui/Table';
import { MoreVertical, Calendar, Users, Target, TrendingUp, Play, Edit, Archive, Trash2, Copy } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';

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
  // Optional extended fields
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

  const getDaysRemaining = (endDate: string | null | undefined): string => {
    if (!endDate) return 'No deadline';
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  return (
    <Table>
      {sprints.map((sprint) => {
        const isSelected = selectedSprints.includes(sprint.id);
        const statusInfo = getStatusInfo(sprint.status);
        const progress = calculateProgress(sprint);
        const daysRemaining = getDaysRemaining(sprint.end_date);
        
        return (
          <TableRow
            key={sprint.id}
            selected={isSelected}
            selectable
            className="!items-center"
          >
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              onCheckedChange={() => handleToggleSelection(sprint.id)}
            />

            {/* Content Grid */}
            <TableGrid columns={5} className="!items-center">
              {/* Sprint Info */}
              <TableCell className="col-span-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TableHeaderText className="flex-1">
                      {sprint.name}
                    </TableHeaderText>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                  </div>
                  {sprint.description && (
                    <TableDescriptionText className="line-clamp-2">
                      {sprint.description}
                    </TableDescriptionText>
                  )}
                  {sprint.goals && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Target className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{sprint.goals}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Timeline */}
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {sprint.start_date ? formatDate(sprint.start_date) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {sprint.end_date ? formatDate(sprint.end_date) : 'No deadline'}
                    </span>
                  </div>
                  {sprint.end_date && sprint.status === 'active' && (
                    <div className={`text-xs font-medium ${
                      daysRemaining.includes('overdue') 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {daysRemaining}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Progress */}
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="text-foreground font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {sprint.total_test_cases !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3 flex-shrink-0" />
                      <span>
                        {sprint.completed_test_cases || 0}/{sprint.total_test_cases} test cases
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Metadata */}
              <TableCell>
                <div className="space-y-2">
                  {sprint.team_members !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span>{sprint.team_members} member{sprint.team_members !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(sprint.created_at)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {formatDate(sprint.updated_at)}
                  </div>
                </div>
              </TableCell>
            </TableGrid>

            {/* Actions */}
            <TableCell className="flex-shrink-0 !flex !items-center !justify-end">
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
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}