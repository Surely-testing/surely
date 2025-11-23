// ============================================
// components/bugs/BugTable.tsx
// Table view for bugs with inline actions
// ============================================
'use client';

import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface BugTableProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
  onEdit: (bug: BugWithCreator) => void;
  onDelete: (bugId: string) => void;
}

export function BugTable({ bugs, onSelect, onEdit, onDelete }: BugTableProps) {
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
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {bugs.map((bug) => (
              <tr 
                key={bug.id} 
                onClick={() => onSelect(bug)} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {bug.title}
                  </div>
                  {bug.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {bug.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                    {bug.severity || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                    {bug.status || 'open'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                      <span className="text-sm text-gray-900 dark:text-white">
                        {bug.creator.name}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {bug.created_at ? format(new Date(bug.created_at), 'MMM d, yyyy') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(bug);
                      }}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit bug"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bug.id);
                      }}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete bug"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
