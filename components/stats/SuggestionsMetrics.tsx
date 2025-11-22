// ============================================
// FILE: components/dashboard/stats/SuggestionsMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Lightbulb, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface SuggestionsMetricsProps {
  suiteId: string;
}

export function SuggestionsMetrics({ suiteId }: SuggestionsMetricsProps) {
  // TODO: Create useSuggestions hook
  const isLoading = false;
  const totalSuggestions = 67;
  const implemented = 32;
  const pending = 28;
  const rejected = 7;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Suggestions</p>
              <p className="text-2xl font-bold text-foreground">{totalSuggestions}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>20% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Implemented</p>
              <p className="text-2xl font-bold text-foreground">{implemented}</p>
            </div>
          </div>
          <Badge variant="success" size="sm">Completed</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{pending}</p>
            </div>
          </div>
          <Badge variant="info" size="sm">In Review</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-foreground">{rejected}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">10% rejection rate</div>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Suggestion Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Implemented</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{implemented}</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pending}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{rejected}</p>
          </div>
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Suggestions by Category</h3>
        <div className="space-y-4">
          {[
            { category: 'Test Coverage', count: 22, color: 'bg-blue-500', percentage: 33 },
            { category: 'Process Improvement', count: 18, color: 'bg-purple-500', percentage: 27 },
            { category: 'Bug Prevention', count: 15, color: 'bg-red-500', percentage: 22 },
            { category: 'Automation', count: 12, color: 'bg-green-500', percentage: 18 },
          ].map(({ category, count, color, percentage }) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm font-medium text-foreground">{category}</span>
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

      {/* Implementation Rate */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Implementation Rate</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Acceptance Rate</p>
            <p className="text-4xl font-bold text-foreground">{Math.round((implemented / totalSuggestions) * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-2">Of all suggestions</p>
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
                  strokeDasharray="167.89 351.858"
                  className="text-green-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">48%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}