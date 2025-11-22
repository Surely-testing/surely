// components/sprints/SprintBoard.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useSprintStats } from '@/lib/hooks/useSprints';
import { Calendar, FileText, Bug, CheckSquare } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Sprint {
  id: string;
  name: string;
  description?: string | null;  // Changed to accept null
  status?: string | null;        // Changed to accept null
  start_date?: string | null;    // Changed to accept null
  end_date?: string | null;      // Changed to accept null
  created_at: string | null;
  creator?: {
    name: string;
    avatar_url?: string;
  };
}

interface SprintBoardProps {
  sprints: Sprint[];
  suiteId: string;
}

export function SprintBoard({ sprints, suiteId }: SprintBoardProps) {
  const getStatusVariant = (status?: string | null): "success" | "primary" | "warning" | "default" | "danger" | "info" => {
    switch (status) {
      case 'planning':
        return 'default';
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'active':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  // Group sprints by status
  const groupedSprints = {
    planning: sprints.filter(s => s.status === 'planning'),
    active: sprints.filter(s => s.status === 'active'),
    completed: sprints.filter(s => s.status === 'completed'),
    archived: sprints.filter(s => s.status === 'archived'),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      {Object.entries(groupedSprints).map(([status, statusSprints]) => (
        <div key={status} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
              {status} ({statusSprints.length})
            </h3>
          </div>
          <div className="space-y-3">
            {statusSprints.map((sprint) => (
              <SprintCard key={sprint.id} sprint={sprint} suiteId={suiteId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SprintCard({ sprint, suiteId }: { sprint: Sprint; suiteId: string }) {
  const { data: stats } = useSprintStats(sprint.id);

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'active':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusVariant = (status?: string | null): "success" | "primary" | "warning" | "default" | "danger" | "info" => {
    switch (status) {
      case 'planning':
        return 'default';
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Link href={`/${suiteId}/sprints/${sprint.id}`}>
      <Card className={`p-4 border-2 ${getStatusColor(sprint.status)} hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {sprint.name}
            </h4>
            <Badge variant={getStatusVariant(sprint.status)} size="sm">
              {sprint.status}
            </Badge>
          </div>

          {sprint.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {sprint.description}
            </p>
          )}

          {/* Dates */}
          {(sprint.start_date || sprint.end_date) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              {sprint.start_date && sprint.end_date ? (
                <span>
                  {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d')}
                </span>
              ) : sprint.end_date ? (
                <span>Ends {format(new Date(sprint.end_date), 'MMM d')}</span>
              ) : null}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <CheckSquare className="w-3 h-3" />
                <span>{stats.test_cases_count} Tests</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Bug className="w-3 h-3" />
                <span>{stats.bugs_count} Bugs</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}