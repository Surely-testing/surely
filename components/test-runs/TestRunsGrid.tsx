// ============================================
// FILE: components/test-runs/TestRunsGrid.tsx
// Test Runs Grid View Component - Without duplicate Select All
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { Play, CheckCircle, XCircle, Clock, Edit2, Eye, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface TestRunsGridProps {
  testRuns: any[];
  suiteId: string;
  selectedRuns: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (run: any) => void;
}

export function TestRunsGrid({ 
  testRuns, 
  suiteId, 
  selectedRuns, 
  onSelectionChange,
  onEdit 
}: TestRunsGridProps) {
  const toggleSelection = (id: string) => {
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
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        borderClass: 'border-yellow-200 dark:border-yellow-900/50'
      },
      'in-progress': { 
        icon: Play, 
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        borderClass: 'border-blue-200 dark:border-blue-900/50'
      },
      passed: { 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        borderClass: 'border-green-200 dark:border-green-900/50'
      },
      failed: { 
        icon: XCircle, 
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        borderClass: 'border-red-200 dark:border-red-900/50'
      },
      blocked: { 
        icon: XCircle, 
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        borderClass: 'border-orange-200 dark:border-orange-900/50'
      },
      skipped: { 
        icon: Clock, 
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        borderClass: 'border-gray-200 dark:border-gray-900/50'
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {testRuns.map((run) => {
        const isSelected = selectedRuns.includes(run.id);
        const statusConfig = getStatusConfig(run.status);
        const StatusIcon = statusConfig.icon;

        const passedCount = run.passed_count || 0;
        const failedCount = run.failed_count || 0;
        const totalCount = run.total_count || 0;
        const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

        return (
          <div
            key={run.id}
            className={cn(
              "bg-card rounded-lg border-2 transition-all duration-200 hover:shadow-md",
              isSelected 
                ? "border-primary shadow-sm" 
                : "border-border hover:border-primary/50"
            )}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(run.id)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary flex-shrink-0"
                  />
                  <Link
                    href={`/dashboard/test-runs/${run.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {run.name}
                    </h3>
                  </Link>
                </div>
              </div>

              {run.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {run.description}
                </p>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2 mt-3">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  statusConfig.className
                )}>
                  <StatusIcon className="h-3 w-3" />
                  {run.status.replace('-', ' ')}
                </span>
                {run.test_type && (
                  <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                    {run.test_type}
                  </span>
                )}
                {run.environment && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {run.environment}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="font-medium text-foreground">{passRate}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                {passRate > 0 && (
                  <div 
                    className="bg-green-500 h-full transition-all" 
                    style={{ width: `${passRate}%` }}
                  />
                )}
                {failedCount > 0 && (
                  <div 
                    className="bg-red-500 h-full transition-all" 
                    style={{ width: `${(failedCount / totalCount) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                {passedCount > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {passedCount}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {failedCount}
                  </span>
                )}
                {(totalCount - passedCount - failedCount) > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalCount - passedCount - failedCount}
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-4 space-y-2">
              {run.executed_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Executed {formatDistanceToNow(new Date(run.executed_at), { addSuffix: true })}
                  </span>
                </div>
              )}
              {run.scheduled_date && !run.executed_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Scheduled: {new Date(run.scheduled_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {run.assigned_to && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate">{run.assigned_to}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Link
                  href={`/dashboard/test-runs/${run.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(run);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}