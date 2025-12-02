// ============================================
// FILE: components/dashboard/stats/TeamProductivity.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Users, Target, TrendingUp, Award } from 'lucide-react';

interface TeamProductivityProps {
  suiteId: string;
}

export function TeamProductivity({ suiteId }: TeamProductivityProps) {
  // TODO: Create useTeamProductivity hook
  const isLoading = false;
  const teamMembers = 8;
  const avgTasksPerMember = 12;

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
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-2xl font-bold text-foreground">{teamMembers}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Active contributors</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Tasks/Member</p>
              <p className="text-2xl font-bold text-foreground">{avgTasksPerMember}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>15% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Efficiency</p>
              <p className="text-2xl font-bold text-foreground">87%</p>
            </div>
          </div>
          <Badge variant="success" size="sm">High</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-foreground">92%</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className="bg-orange-600 h-2 rounded-full" style={{ width: '92%' }} />
          </div>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Contributors</h3>
        <div className="space-y-3">
          {[
            { name: 'Alice Johnson', tasks: 24, color: 'bg-blue-500' },
            { name: 'Bob Smith', tasks: 18, color: 'bg-green-500' },
            { name: 'Carol Davis', tasks: 15, color: 'bg-purple-500' },
            { name: 'David Wilson', tasks: 12, color: 'bg-orange-500' },
            { name: 'Eve Brown', tasks: 10, color: 'bg-pink-500' },
          ].map((member, index) => (
            <div key={member.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div
                    className={`${member.color} h-2 rounded-full transition-all`}
                    style={{ width: `${(member.tasks / 24) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">{member.tasks}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity by Type */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Team Activity Distribution</h3>
        <div className="space-y-4">
          {[
            { activity: 'Test Cases Created', count: 48, color: 'bg-blue-500', percentage: 35 },
            { activity: 'Bugs Resolved', count: 36, color: 'bg-green-500', percentage: 26 },
            { activity: 'Reviews Completed', count: 32, color: 'bg-purple-500', percentage: 23 },
            { activity: 'Documentation', count: 22, color: 'bg-orange-500', percentage: 16 },
          ].map(({ activity, count, color, percentage }) => (
            <div key={activity}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm font-medium text-foreground">{activity}</span>
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
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Advanced Team Analytics Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Individual performance tracking, collaboration metrics, and insights
          </p>
        </div>
      </Card>
    </div>
  );
}