// ============================================
// components/dashboard/RecentActivity.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

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
        return '✅';
      case 'bug':
        return '🐛';
      case 'sprint':
        return '🚀';
      case 'document':
        return '📁';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: Activity['action']) => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'secondary';
      case 'deleted':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No recent activity
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="text-lg">{getIcon(activity.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {activity.user.name}
                </p>
                <Badge variant={getActionColor(activity.action)} size="sm">
                  {activity.action}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}