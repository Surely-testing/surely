// ============================================
// FILE: components/test-runs/TestRunsTable.tsx
// Test Runs Table with Links to Details Page
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
  TableSelectAll,
  TableHeaderText,
  TableDescriptionText 
} from '@/components/ui/Table';
import { Play, Edit2, CheckCircle, XCircle, Clock, Pause, MoreVertical, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils/cn';

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

  const toggleAll = () => {
    if (selectedRuns.length === testRuns.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(testRuns.map(run => run.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' 
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
        icon: Pause, 
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
      },
      skipped: { 
        icon: MoreVertical, 
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
      },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className
      )}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getProgressBar = (passed: number, failed: number, total: number) => {
    if (total === 0) {
      return (
        <div className="text-xs text-muted-foreground">
          No tests executed
        </div>
      );
    }
    
    const passedPercent = (passed / total) * 100;
    const failedPercent = (failed / total) * 100;
    const pendingPercent = 100 - passedPercent - failedPercent;

    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-muted-foreground">
            {passed + failed}/{total} executed
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
          {passedPercent > 0 && (
            <div 
              className="bg-green-500 h-full transition-all" 
              style={{ width: `${passedPercent}%` }}
              title={`${passed} passed`}
            />
          )}
          {failedPercent > 0 && (
            <div 
              className="bg-red-500 h-full transition-all" 
              style={{ width: `${failedPercent}%` }}
              title={`${failed} failed`}
            />
          )}
          {pendingPercent > 0 && (
            <div 
              className="bg-gray-300 dark:bg-gray-700 h-full transition-all" 
              style={{ width: `${pendingPercent}%` }}
              title={`${total - passed - failed} pending`}
            />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          {passed > 0 && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {passed}
            </span>
          )}
          {failed > 0 && (
            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {failed}
            </span>
          )}
          {(total - passed - failed) > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {total - passed - failed}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <div className="flex items-center justify-between px-4">
        <TableSelectAll
          checked={testRuns.length > 0 && selectedRuns.length === testRuns.length}
          onCheckedChange={toggleAll}
        />
        <span className="text-xs text-muted-foreground">
          {testRuns.length} {testRuns.length === 1 ? 'test run' : 'test runs'}
        </span>
      </div>

      {/* Table */}
      <Table>
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

              <TableGrid columns={5}>
                {/* Test Run Name & Info - Now a Link */}
                <TableCell className="col-span-2">
                  <Link
                    href={`/dashboard/test-runs/${run.id}`}
                    className="text-left w-full group block"
                  >
                    <TableHeaderText className="group-hover:text-primary transition-colors">
                      {run.name}
                    </TableHeaderText>
                    {run.description && (
                      <TableDescriptionText className="mt-1 line-clamp-1">
                        {run.description}
                      </TableDescriptionText>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {run.test_type && (
                        <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                          {run.test_type}
                        </span>
                      )}
                      {run.environment && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {run.environment}
                        </span>
                      )}
                    </div>
                  </Link>
                </TableCell>

                {/* Progress */}
                <TableCell>
                  {getProgressBar(
                    run.passed_count || 0,
                    run.failed_count || 0,
                    run.total_count || 0
                  )}
                </TableCell>

                {/* Status & Execution Info */}
                <TableCell>
                  <div className="space-y-2">
                    {getStatusBadge(run.status)}
                    <div className="text-xs text-muted-foreground">
                      {run.executed_at ? (
                        <span>
                          Executed {formatDistanceToNow(new Date(run.executed_at), { addSuffix: true })}
                        </span>
                      ) : run.scheduled_date ? (
                        <span>
                          Scheduled: {new Date(run.scheduled_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>Not executed</span>
                      )}
                    </div>
                    {run.assigned_to && (
                      <div className="text-xs text-muted-foreground">
                        Assigned: {run.assigned_to}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
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
  );
}