// ============================================
// FILE: components/dashboard/stats/ReportsMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { BarChart3, FileBarChart, TrendingUp, Calendar } from 'lucide-react';

interface ReportsMetricsProps {
  suiteId: string;
}

export function ReportsMetrics({ suiteId }: ReportsMetricsProps) {
  // TODO: Create useReports hook
  const isLoading = false;
  const totalReports = 34;
  const scheduledReports = 5;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold text-foreground">{totalReports}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>22% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-foreground">{scheduledReports}</p>
            </div>
          </div>
          <Badge variant="info" size="sm">Auto-generated</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Reports generated</div>
        </Card>
      </div>

      {/* Report Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Reports by Type</h3>
        <div className="space-y-4">
          {[
            { type: 'Test Execution', count: 15, color: 'bg-blue-500', percentage: 44 },
            { type: 'Bug Summary', count: 10, color: 'bg-red-500', percentage: 29 },
            { type: 'Sprint Retrospective', count: 6, color: 'bg-green-500', percentage: 18 },
            { type: 'Coverage Report', count: 3, color: 'bg-purple-500', percentage: 9 },
          ].map(({ type, count, color, percentage }) => (
            <div key={type}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm font-medium text-foreground">{type}</span>
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
          ))}
        </div>
      </Card>

      {/* Coming Soon */}
      <Card className="p-12">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Advanced Reporting Analytics Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Custom report builder, exports, and scheduling
          </p>
        </div>
      </Card>
    </div>
  );
}