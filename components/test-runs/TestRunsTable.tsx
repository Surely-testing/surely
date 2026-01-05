// ============================================
// FILE: components/test-runs/TestRunsTable.tsx
// Mobile responsive table with horizontal scroll
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableRow, 
  TableCell, 
  TableGrid, 
  TableCheckbox,
  TableHeaderText,
  TableDescriptionText 
} from '@/components/ui/Table';
import { Play, Edit2, CheckCircle, XCircle, Clock, Eye, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';

interface TestRunsTableProps {
  testRuns: any[];
  suiteId: string;
  selectedRuns: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (run: any) => void;
}

export function TestRunsTable({ 
  testRuns, 
  suiteId, 
  selectedRuns, 
  onSelectionChange,
  onEdit 
}: TestRunsTableProps) {
  const toggleSelection = (id: string) => {
    if (selectedRuns.includes(id)) {
      onSelectionChange(selectedRuns.filter(runId => runId !== id));
    } else {
      onSelectionChange([...selectedRuns, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
      },
      'in-progress': { 
        icon: Play, 
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
      },
      passed: { 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
      },
      failed: { 
        icon: XCircle, 
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
      },
      blocked: { 
        icon: XCircle, 
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
      },
      skipped: { 
        icon: Clock, 
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' 
      },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        config.className
      )}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ')}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] pl-2">
        <Table>
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-4 px-14 py-2 bg-muted/50 rounded-lg border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <div className="col-span-2">Name</div>
            <div>Type</div>
            <div>Environment</div>
            <div>Status</div>
            <div>Executed</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Rows */}
          {testRuns.map((run) => {
            const isSelected = selectedRuns.includes(run.id);

            return (
              <TableRow 
                key={run.id}
                selected={isSelected}
                selectable
              >
                <TableCheckbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(run.id)}
                />

                <TableGrid columns={7}>
                  {/* Name - 2 columns */}
                  <TableCell className="col-span-2">
                    <Link
                      href={`/dashboard/test-runs/${run.id}`}
                      className="block group"
                    >
                      <TableHeaderText className="group-hover:text-primary transition-colors">
                        {run.name}
                      </TableHeaderText>
                      {run.description && (
                        <TableDescriptionText className="mt-1 line-clamp-1">
                          {run.description}
                        </TableDescriptionText>
                      )}
                    </Link>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    {run.test_type ? (
                      <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full whitespace-nowrap">
                        {run.test_type}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Environment */}
                  <TableCell>
                    {run.environment ? (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full whitespace-nowrap">
                        {run.environment}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {getStatusBadge(run.status)}
                  </TableCell>

                  {/* Executed Date */}
                  <TableCell>
                    <div className="text-sm text-foreground whitespace-nowrap">
                      {run.executed_at ? (
                        formatDistanceToNow(new Date(run.executed_at), { addSuffix: true })
                      ) : run.scheduled_date ? (
                        <span className="text-xs text-muted-foreground">
                          Scheduled: {new Date(run.scheduled_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not executed</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    {/* Mobile: Dropdown menu */}
                    <div className="flex items-center justify-end lg:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/test-runs/${run.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {run.status === 'pending' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Start execution
                            }}>
                              <Play className="h-4 w-4 mr-2" />
                              Start Execution
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onEdit(run);
                          }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Desktop: Individual buttons */}
                    <div className="hidden lg:flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/test-runs/${run.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors group"
                        title="View details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </Link>
                      {run.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Start execution
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors group"
                          title="Start execution"
                        >
                          <Play className="h-4 w-4 text-muted-foreground group-hover:text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(run);
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors group"
                        title="Edit test run"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Open context menu
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors group"
                        title="More actions"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      </button>
                    </div>
                  </TableCell>
                </TableGrid>
              </TableRow>
            );
          })}
        </Table>
      </div>
    </div>
  );
}