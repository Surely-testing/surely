// ============================================
// components/bugs/BugList.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Bug {
  id: string;
  title: string;
  description?: string;
  severity?: string;
  status?: string;
  created_at: string;
  creator?: {
    name: string;
    avatar_url?: string;
  };
}

interface BugListProps {
  bugs: Bug[];
  suiteId: string;
}

export function BugList({ bugs, suiteId }: BugListProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusVariant = (status?: string): 'danger' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case 'open':
        return 'danger';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {bugs.map((bug) => (
        <Link key={bug.id} href={`/${suiteId}/bugs/${bug.id}`}>
          <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(bug.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                    {bug.title}
                  </h3>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant={getStatusVariant(bug.status)}>
                      {bug.status || 'open'}
                    </Badge>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                      {bug.severity || 'medium'}
                    </span>
                  </div>
                </div>

                {bug.description && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 break-words">
                    {bug.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    {bug.creator?.avatar_url ? (
                      <img
                        src={bug.creator.avatar_url}
                        alt={bug.creator.name}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {bug.creator?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="truncate">{bug.creator?.name || 'Unknown'}</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span>{formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}