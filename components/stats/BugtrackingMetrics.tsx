// ============================================
// FILE: components/dashboard/stats/BugTrackingMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useBugStats } from '@/lib/hooks/useBugs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Bug, AlertTriangle, CheckCircle, Clock, TrendingDown } from 'lucide-react';

interface BugTrackingMetricsProps {
  suiteId: string;
}

export function BugTrackingMetrics({ suiteId }: BugTrackingMetricsProps) {
  const { data: stats, isLoading } = useBugStats(suiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalBugs = stats?.total || 0;
  const openBugs = stats?.by_status.open || 0;
  const resolvedBugs = stats?.by_status.resolved || 0;
  const resolutionRate = Math.round(stats?.resolution_rate || 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Bug className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bugs</p>
              <p className="text-2xl font-bold text-foreground">{totalBugs}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-600">
            <TrendingDown className="w-3 h-3" />
            <span>5% vs last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-foreground">{openBugs}</p>
            </div>
          </div>
          <Badge variant="danger" size="sm">{stats?.by_severity.critical || 0} Critical</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{stats?.by_status.in_progress || 0}</p>
            </div>
          </div>
          <Badge variant="warning" size="sm">Active Work</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-foreground">{resolvedBugs}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{resolutionRate}% rate</div>
        </Card>
      </div>

      {/* Bug Status Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bug Status Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Open</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{openBugs}</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats?.by_status.in_progress || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{resolvedBugs}</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Closed</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats?.by_status.closed || 0}</p>
          </div>
        </div>
      </Card>

      {/* Severity Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bugs by Severity</h3>
        <div className="space-y-4">
          {[
            { label: 'Critical', count: stats?.by_severity.critical || 0, color: 'bg-red-500', total: totalBugs },
            { label: 'High', count: stats?.by_severity.high || 0, color: 'bg-orange-500', total: totalBugs },
            { label: 'Medium', count: stats?.by_severity.medium || 0, color: 'bg-yellow-500', total: totalBugs },
            { label: 'Low', count: stats?.by_severity.low || 0, color: 'bg-green-500', total: totalBugs },
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

      {/* Resolution Rate Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resolution Performance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Resolution Rate</p>
            <p className="text-4xl font-bold text-foreground">{resolutionRate}%</p>
          </div>
          <div className="w-32 h-32">
            <div className="relative w-full h-full">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(resolutionRate / 100) * 351.858} 351.858`}
                  className="text-green-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{resolutionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}