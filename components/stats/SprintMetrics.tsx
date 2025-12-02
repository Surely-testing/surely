// ============================================
// FILE: components/dashboard/stats/SprintMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSprints } from '@/lib/hooks/useSprints';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Rocket, Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

interface SprintMetricsProps {
  suiteId: string;
}

export function SprintMetrics({ suiteId }: SprintMetricsProps) {
  const { data: sprints, isLoading } = useSprints(suiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalSprints = sprints?.length || 0;
  const activeSprints = sprints?.filter(s => s.status === 'active').length || 0;
  const planningSprints = sprints?.filter(s => s.status === 'planning').length || 0;
  const completedSprints = sprints?.filter(s => s.status === 'completed').length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sprints</p>
              <p className="text-2xl font-bold text-foreground">{totalSprints}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>25% vs last quarter</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeSprints}</p>
            </div>
          </div>
          <Badge variant="success" size="sm">In Progress</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Planning</p>
              <p className="text-2xl font-bold text-foreground">{planningSprints}</p>
            </div>
          </div>
          <Badge variant="info" size="sm">Upcoming</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completedSprints}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Total finished</div>
        </Card>
      </div>

      {/* Sprint Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Sprint Status Overview</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Planning</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{planningSprints}</p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activeSprints}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{completedSprints}</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Archived</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {sprints?.filter(s => s.status === 'archived').length || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Active Sprints List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Active Sprints</h3>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${suiteId}/sprints/new`}>New Sprint</Link>
          </Button>
        </div>
        {activeSprints > 0 ? (
          <div className="space-y-3">
            {sprints?.filter(s => s.status === 'active').map((sprint) => (
              <Link
                key={sprint.id}
                href={`/${suiteId}/sprints/${sprint.id}`}
                className="block p-4 rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{sprint.name}</h4>
                    {sprint.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sprint.description}</p>
                    )}
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {sprint.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Started {new Date(sprint.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {sprint.end_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Ends {new Date(sprint.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active sprints</p>
          </div>
        )}
      </Card>

      {/* Upcoming Sprints */}
      {planningSprints > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Sprints</h3>
          <div className="space-y-3">
            {sprints?.filter(s => s.status === 'planning').slice(0, 3).map((sprint) => (
              <Link
                key={sprint.id}
                href={`/${suiteId}/sprints/${sprint.id}`}
                className="block p-4 rounded-lg border border-border hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{sprint.name}</h4>
                    {sprint.start_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Starts {new Date(sprint.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="info" size="sm">Planning</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}