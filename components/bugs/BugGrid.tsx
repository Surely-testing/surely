// ============================================
// components/bugs/BugGrid.tsx
// Grid/Card view for bugs
// ============================================
'use client';

import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';

interface BugGridProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
}

export function BugGrid({ bugs, onSelect }: BugGridProps) {
  const getSeverityColor = (severity: BugSeverity | null) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusColor = (status: BugStatus | null) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'resolved': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'closed': return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bugs.map((bug) => (
        <div
          key={bug.id}
          onClick={() => onSelect(bug)}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-900"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex-1 line-clamp-2">
              {bug.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getSeverityColor(bug.severity)}`}>
              {bug.severity || 'N/A'}
            </span>
          </div>

          {bug.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {bug.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
              {bug.status || 'open'}
            </span>
            {bug.creator && (
              <div className="flex items-center gap-2">
                {bug.creator.avatar_url ? (
                  <img 
                    src={bug.creator.avatar_url} 
                    alt={bug.creator.name} 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                    {bug.creator.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

