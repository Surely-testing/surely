// ============================================
// FILE: components/dashboard/stats/TestCaseMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTestCaseStats } from '@/lib/hooks/useTestCases';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FileCheck, TrendingUp, AlertCircle, CheckCircle2, Target, Zap } from 'lucide-react';

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
  const executionRate = stats?.execution_rate || 0;
  const passRate = stats?.pass_rate || 0;
  const automationRate = stats?.automation_rate || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-bold text-foreground">{totalTests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeTests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
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
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Execution Rate</p>
              <p className="text-2xl font-bold text-foreground">{executionRate}%</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-info h-2 rounded-full transition-all"
              style={{ width: `${executionRate}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Execution Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Pass Rate</h3>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">{passRate}%</p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-success h-2 rounded-full transition-all"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats?.by_result.passed || 0} of {(stats?.by_result.passed || 0) + (stats?.by_result.failed || 0) + (stats?.by_result.blocked || 0)} executed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Automation Rate</h3>
            <Zap className="w-5 h-5 text-warning" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">{automationRate}%</p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-warning h-2 rounded-full transition-all"
              style={{ width: `${automationRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Automated tests coverage
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Test Results</h3>
            <Target className="w-5 h-5 text-info" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-success">Passed</span>
              <span className="font-semibold">{stats?.by_result.passed || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-error">Failed</span>
              <span className="font-semibold">{stats?.by_result.failed || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-warning">Blocked</span>
              <span className="font-semibold">{stats?.by_result.blocked || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Not Run</span>
              <span className="font-semibold">{stats?.by_result.not_executed || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Test Cases by Priority</h3>
        <div className="space-y-4">
          {[
            { label: 'Critical', count: stats?.by_priority.critical || 0, color: 'bg-error', total: totalTests },
            { label: 'High', count: stats?.by_priority.high || 0, color: 'bg-warning', total: totalTests },
            { label: 'Medium', count: stats?.by_priority.medium || 0, color: 'bg-info', total: totalTests },
            { label: 'Low', count: stats?.by_priority.low || 0, color: 'bg-success', total: totalTests },
          ].map(({ label, count, color, total }) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{count} ({percentage}%)</span>
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
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xs font-medium text-success mb-1">Active</p>
            <p className="text-2xl font-bold text-foreground">{stats?.by_status.active || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Archived</p>
            <p className="text-2xl font-bold text-foreground">{stats?.by_status.archived || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-error/10 border border-error/20">
            <p className="text-xs font-medium text-error mb-1">Deleted</p>
            <p className="text-2xl font-bold text-foreground">{stats?.by_status.deleted || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}