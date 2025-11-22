// ============================================
// FILE: components/dashboard/stats/RecordingsMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Video, Play, Clock, TrendingUp } from 'lucide-react';

interface RecordingsMetricsProps {
  suiteId: string;
}

export function RecordingsMetrics({ suiteId }: RecordingsMetricsProps) {
  // TODO: Create useRecordings hook
  const isLoading = false;
  const totalRecordings = 28;
  const totalDuration = 145; // minutes

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
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recordings</p>
              <p className="text-2xl font-bold text-foreground">{totalRecordings}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>18% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(totalDuration / 60)}h {totalDuration % 60}m</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Across all recordings</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold text-foreground">{Math.round(totalDuration / totalRecordings)}m</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Per recording</div>
        </Card>
      </div>

      {/* Recording Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recordings by Type</h3>
        <div className="space-y-4">
          {[
            { type: 'Test Execution', count: 12, color: 'bg-blue-500', percentage: 43 },
            { type: 'Bug Reproduction', count: 8, color: 'bg-red-500', percentage: 29 },
            { type: 'Feature Demo', count: 5, color: 'bg-green-500', percentage: 18 },
            { type: 'Training', count: 3, color: 'bg-purple-500', percentage: 10 },
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
          <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Advanced Recording Analytics Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Track views, engagement, and recording insights
          </p>
        </div>
      </Card>
    </div>
  );
}