// ============================================
// FILE: components/dashboard/stats/TestCaseMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTestCaseStats } from '@/lib/hooks/useTestCases';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FileCheck, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TestCaseMetricsProps {
  suiteId: string;
}

export function TestCaseMetrics({ suiteId }: TestCaseMetricsProps) {
  const { data: stats, isLoading } = useTestCaseStats(suiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalTests = stats?.total || 0;
  const activeTests = stats?.by_status.active || 0;
  const executionRate = totalTests > 0 ? Math.round((activeTests / totalTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-bold text-foreground">{totalTests}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>12% vs last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeTests}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>8% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-foreground">{stats?.by_priority.critical || 0}</p>
            </div>
          </div>
          <Badge variant="danger" size="sm">High Priority</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Execution Rate</p>
              <p className="text-2xl font-bold text-foreground">{executionRate}%</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${executionRate}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Test Cases by Priority</h3>
        <div className="space-y-4">
          {[
            { label: 'Critical', count: stats?.by_priority.critical || 0, color: 'bg-red-500', total: totalTests },
            { label: 'High', count: stats?.by_priority.high || 0, color: 'bg-orange-500', total: totalTests },
            { label: 'Medium', count: stats?.by_priority.medium || 0, color: 'bg-yellow-500', total: totalTests },
            { label: 'Low', count: stats?.by_priority.low || 0, color: 'bg-green-500', total: totalTests },
          ].map(({ label, count, color, total }) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Test Cases by Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats?.by_status.active || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Archived</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats?.by_status.archived || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Deleted</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats?.by_status.deleted || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}