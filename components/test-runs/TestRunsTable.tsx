// ============================================
// components/test-runs/TestRunsTable.tsx
// Updated: Added execution handlers (Manual/Automated)
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Edit2, CheckCircle, XCircle, Clock, Eye, MoreVertical, Trash2, PlayCircle, UserCog } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableBadge,
  TableEmpty,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';

interface TestRunsTableProps {
  testRuns: any[];
  suiteId: string;
  selectedRuns: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (run: any) => void;
  onRunAutomated: (testRun: any) => Promise<void>;
  onRunManual: (testRun: any) => Promise<void>;
  onDelete?: (runId: string) => void;
}

export function TestRunsTable({ 
  testRuns, 
  suiteId, 
  selectedRuns, 
  onSelectionChange,
  onEdit,
  onRunAutomated,
  onRunManual,
  onDelete
}: TestRunsTableProps) {
  const handleToggleSelection = (id: string) => {
    if (selectedRuns.includes(id)) {
      onSelectionChange(selectedRuns.filter(runId => runId !== id));
    } else {
      onSelectionChange([...selectedRuns, id]);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        variant: 'yellow' as const
      },
      'in-progress': { 
        icon: Play, 
        variant: 'default' as const
      },
      passed: { 
        icon: CheckCircle, 
        variant: 'green' as const
      },
      failed: { 
        icon: XCircle, 
        variant: 'red' as const
      },
      blocked: { 
        icon: XCircle, 
        variant: 'orange' as const
      },
      skipped: { 
        icon: Clock, 
        variant: 'gray' as const
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (testRuns.length === 0) {
    return (
      <TableEmpty
        title="No test runs to display"
        description="Create a new test run to get started."
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="name" sticky minWidth="min-w-[320px]">Name</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[120px]">Run ID</TableHeaderCell>,
          <TableHeaderCell key="type" minWidth="min-w-[140px]">Type</TableHeaderCell>,
          <TableHeaderCell key="environment" minWidth="min-w-[140px]">Environment</TableHeaderCell>,
          <TableHeaderCell key="status" minWidth="min-w-[140px]">Status</TableHeaderCell>,
          <TableHeaderCell key="executed" minWidth="min-w-[180px]">Executed</TableHeaderCell>,
          <TableHeaderCell key="scheduled" minWidth="min-w-[140px]">Scheduled Date</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[140px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {testRuns.map((run) => {
        const isSelected = selectedRuns.includes(run.id);
        const statusConfig = getStatusConfig(run.status);
        const StatusIcon = statusConfig.icon;

        return (
          <TableRow key={run.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(run.id)}
            />

            {/* Name - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div className="min-w-0">
                <div 
                  className="font-medium text-sm truncate cursor-help"
                  title={run.name}
                >
                  {run.name}
                </div>
                {run.description && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {run.description}
                  </div>
                )}
              </div>
            </TableCell>

            {/* Run ID */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground font-mono">
                {run.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Type */}
            <TableCell minWidth="min-w-[140px]">
              {run.test_type ? (
                <div className="flex items-center h-full py-1">
                  <div className="inline-flex items-center justify-center px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium whitespace-nowrap w-28">
                    {run.test_type}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>

            {/* Environment */}
            <TableCell minWidth="min-w-[140px]">
              {run.environment ? (
                <div className="flex items-center h-full py-1">
                  <div className="inline-flex items-center justify-center px-3 py-1.5 bg-primary/10 text-primary rounded text-xs font-medium whitespace-nowrap w-28">
                    {run.environment}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>

            {/* Status */}
            <TableCell minWidth="min-w-[140px]">
              <div className="flex items-center h-full py-1">
                <div className={`
                  inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap w-32
                  ${statusConfig.variant === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                  ${statusConfig.variant === 'default' ? 'bg-gray-100 text-gray-800' : ''}
                  ${statusConfig.variant === 'green' ? 'bg-green-500 text-white' : ''}
                  ${statusConfig.variant === 'red' ? 'bg-red-500 text-white' : ''}
                  ${statusConfig.variant === 'orange' ? 'bg-orange-500 text-white' : ''}
                  ${statusConfig.variant === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                `}>
                  <StatusIcon className="h-3 w-3" />
                  {run.status.replace('-', ' ')}
                </div>
              </div>
            </TableCell>

            {/* Executed */}
            <TableCell minWidth="min-w-[180px]">
              <span className="text-sm">
                {run.executed_at ? (
                  formatDistanceToNow(new Date(run.executed_at), { addSuffix: true })
                ) : (
                  <span className="text-muted-foreground">Not executed</span>
                )}
              </span>
            </TableCell>

            {/* Scheduled Date */}
            <TableCell minWidth="min-w-[140px]">
              <span className="text-sm">
                {run.scheduled_date ? formatDate(run.scheduled_date) : '—'}
              </span>
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[140px]">
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/test-runs/${run.id}`}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title="View details"
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
                  <DropdownMenuContent align="end" className="w-52">
                    {run.status === 'pending' && (
                      <>
                        <DropdownMenuItem onClick={() => onRunAutomated(run)}>
                          <PlayCircle className="w-4 h-4" />
                          Run Automated
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRunManual(run)}>
                          <UserCog className="w-4 h-4" />
                          Execute Manually
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => onEdit(run)}>
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                    
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(run.id)}
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