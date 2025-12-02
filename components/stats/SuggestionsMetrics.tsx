'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Lightbulb, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useSuggestions } from '@/lib/hooks/useSuggestions';

interface SuggestionsMetricsProps {
  suiteId: string;
}

export function SuggestionsMetrics({ suiteId }: SuggestionsMetricsProps) {
  const { suggestions, isLoading } = useSuggestions(suiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate metrics
  const totalSuggestions = suggestions.length;
  const implemented = suggestions.filter(s => s.status === 'implemented').length;
  const pending = suggestions.filter(s => s.status === 'pending').length;
  const underReview = suggestions.filter(s => s.status === 'under_review').length;
  const accepted = suggestions.filter(s => s.status === 'accepted').length;
  const rejected = suggestions.filter(s => s.status === 'rejected').length;
  
  const pendingTotal = pending + underReview + accepted;
  const implementationRate = totalSuggestions > 0 ? Math.round((implemented / totalSuggestions) * 100) : 0;
  const rejectionRate = totalSuggestions > 0 ? Math.round((rejected / totalSuggestions) * 100) : 0;

  // Category distribution
  const categoryMap = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryMap)
    .map(([category, count]) => ({
      category: formatCategoryName(category),
      count,
      percentage: totalSuggestions > 0 ? (count / totalSuggestions) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Helper function to format category names
  function formatCategoryName(category: string): string {
    const nameMap: Record<string, string> = {
      'feature': 'New Features',
      'improvement': 'Improvements',
      'performance': 'Performance',
      'ui_ux': 'UI/UX',
      'testing': 'Testing',
      'documentation': 'Documentation',
      'other': 'Other',
    };
    return nameMap[category] || category;
  }

  // Color mapping for categories
  const categoryColors = ['bg-blue-500', 'bg-purple-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'];

  // Calculate circle progress (circumference)
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (implementationRate / 100) * circumference;

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
          {totalSuggestions > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lightbulb className="w-3 h-3" />
              <span>Active feedback</span>
            </div>
          )}
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
              <p className="text-2xl font-bold text-foreground">{pendingTotal}</p>
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
          <div className="text-xs text-muted-foreground">{rejectionRate}% rejection rate</div>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Suggestion Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Implemented</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{implemented}</p>
            <p className="text-xs text-muted-foreground mt-1">{implementationRate}% of total</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pendingTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pending} new, {underReview} reviewing, {accepted} accepted
            </p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{rejected}</p>
            <p className="text-xs text-muted-foreground mt-1">{rejectionRate}% rejection rate</p>
          </div>
        </div>
      </Card>

      {/* Categories */}
      {categoryData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Suggestions by Category</h3>
          <div className="space-y-4">
            {categoryData.map(({ category, count, percentage }, index) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[index % categoryColors.length]}`} />
                    <span className="text-sm font-medium text-foreground">{category}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${categoryColors[index % categoryColors.length]} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Implementation Rate */}
      {totalSuggestions > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Implementation Rate</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Acceptance Rate</p>
              <p className="text-4xl font-bold text-foreground">{implementationRate}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {implemented} of {totalSuggestions} suggestions
              </p>
            </div>
            <div className="w-32 h-32">
              <div className="relative w-full h-full">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted opacity-30"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    className="text-green-600 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{implementationRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {totalSuggestions === 0 && (
        <Card className="p-12 text-center">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Suggestions Yet</h3>
          <p className="text-sm text-muted-foreground">
            Start collecting suggestions from your team to improve test quality and processes.
          </p>
        </Card>
      )}
    </div>
  );
}