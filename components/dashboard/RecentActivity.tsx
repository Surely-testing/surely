// ============================================
// FILE: components/dashboard/RecentActivity.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { FileCheck, Bug, Rocket, FileText, Activity } from 'lucide-react';

interface Activity {
  id: string;
  type: 'test_case' | 'bug' | 'sprint' | 'document';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'test_case':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'bug':
        return <Bug className="w-5 h-5 text-red-600" />;
      case 'sprint':
        return <Rocket className="w-5 h-5 text-green-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action: Activity['action']): 'success' | 'default' | 'danger' => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'default';
      case 'deleted':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <p className="text-muted-foreground text-center py-8">
          No recent activity
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground truncate">
                  {activity.user.name}
                </p>
                <Badge variant={getActionColor(activity.action)} size="sm">
                  {activity.action}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {activity.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}