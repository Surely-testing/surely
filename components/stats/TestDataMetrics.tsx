// ============================================
// FILE: components/dashboard/stats/TestDataMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Database, HardDrive, TrendingUp, RefreshCw } from 'lucide-react';

interface TestDataMetricsProps {
  suiteId: string;
}

export function TestDataMetrics({ suiteId }: TestDataMetricsProps) {
  // TODO: Create useTestData hook
  const isLoading = false;
  const totalDataSets = 52;
  const recentUpdates = 12;

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
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Data Sets</p>
              <p className="text-2xl font-bold text-foreground">{totalDataSets}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>16% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Updates</p>
              <p className="text-2xl font-bold text-foreground">{recentUpdates}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Last 7 days</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage</p>
              <p className="text-2xl font-bold text-foreground">1.2 GB</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '48%' }} />
          </div>
        </Card>
      </div>

      {/* Data Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Test Data by Type</h3>
        <div className="space-y-4">
          {[
            { type: 'User Profiles', count: 18, color: 'bg-blue-500', percentage: 35 },
            { type: 'Transaction Data', count: 15, color: 'bg-green-500', percentage: 29 },
            { type: 'API Responses', count: 12, color: 'bg-purple-500', percentage: 23 },
            { type: 'Mock Data', count: 7, color: 'bg-orange-500', percentage: 13 },
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

      {/* Data Quality Score */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Quality Score</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Quality</p>
            <p className="text-4xl font-bold text-foreground">92%</p>
            <p className="text-xs text-muted-foreground mt-2">Based on completeness and validity</p>
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
                  strokeDasharray="323.71 351.858"
                  className="text-cyan-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">92%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Coming Soon */}
      <Card className="p-12">
        <div className="text-center">
          <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Advanced Test Data Management Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Data versioning, validation rules, and automated generation
          </p>
        </div>
      </Card>
    </div>
  );
}