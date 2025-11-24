// ============================================
// FILE: components/sprints/SprintBoard.tsx
// ============================================

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Calendar, Target, CheckSquare, Bug, FileText, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface SprintBoardProps {
  sprints: any[];
  suiteId: string;
  selectedSprints?: string[];
  onSelectionChange?: (selected: string[]) => void;
}

function useSprintStatsForBoard(sprintId: string) {
  return useQuery({
    queryKey: ['sprint-board-stats', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      const [testCases, bugs, suggestions] = await Promise.all([
        supabase.from('test_cases').select('id, status', { count: 'exact' }).eq('sprint_id', sprintId),
        supabase.from('bugs').select('id, status', { count: 'exact' }).eq('sprint_id', sprintId),
        supabase.from('suggestions').select('id, status', { count: 'exact' }).eq('sprint_id', sprintId),
      ]);

      const completedTests = testCases.data?.filter(tc => tc.status === 'passed' || tc.status === 'failed').length || 0;
      const completedBugs = bugs.data?.filter(bug => bug.status === 'resolved' || bug.status === 'closed').length || 0;
      const completedSuggestions = suggestions.data?.filter(sug => sug.status === 'implemented' || sug.status === 'completed').length || 0;

      const totalItems = (testCases.count || 0) + (bugs.count || 0) + (suggestions.count || 0);
      const completedItems = completedTests + completedBugs + completedSuggestions;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        testCases: testCases.count || 0,
        bugs: bugs.count || 0,
        suggestions: suggestions.count || 0,
        total: totalItems,
        progress,
      };
    },
    enabled: !!sprintId,
  });
}

function SprintCard({ sprint, onEdit, onDelete, isSelected, onToggleSelection }: any) {
  const [showOptions, setShowOptions] = useState(false);
  const { data: stats } = useSprintStatsForBoard(sprint.id);
  
  const daysRemaining = sprint.end_date ? differenceInDays(new Date(sprint.end_date), new Date()) : null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'planning':
        return { label: 'Planning', bgColor: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-700 dark:text-gray-300' };
      case 'active':
        return { label: 'Active', bgColor: 'bg-green-100 dark:bg-green-900', color: 'text-green-700 dark:text-green-300' };
      case 'on-hold':
        return { label: 'On Hold', bgColor: 'bg-yellow-100 dark:bg-yellow-900', color: 'text-yellow-700 dark:text-yellow-300' };
      case 'completed':
        return { label: 'Completed', bgColor: 'bg-blue-100 dark:bg-blue-900', color: 'text-blue-700 dark:text-blue-300' };
      default:
        return { label: status, bgColor: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-700 dark:text-gray-300' };
    }
  };

  const statusInfo = getStatusInfo(sprint.status || 'planning');

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-all relative group">
      {onToggleSelection && (
        <div className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(sprint.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
        </div>
      )}
      
      <Link href={`/dashboard/sprints/${sprint.id}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex-1 ${onToggleSelection ? 'ml-6' : ''}`}>
            <h3 className="font-semibold text-foreground mb-1 truncate">{sprint.name}</h3>
            {sprint.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {sprint.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor}`}>
              <span className={statusInfo.color}>{statusInfo.label}</span>
            </div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOptions(!showOptions);
                }}
                className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 top-8 bg-card border border-border shadow-lg rounded-lg py-1 z-10 min-w-32">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptions(false);
                      onEdit?.(sprint);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center space-x-2 text-foreground"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptions(false);
                      onDelete?.(sprint);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center space-x-2 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {sprint.start_date && sprint.end_date && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d, yyyy')}</span>
              </div>
              {daysRemaining !== null && (
                <span className={
                  daysRemaining < 0 
                    ? 'text-red-600 dark:text-red-400 font-medium' 
                    : daysRemaining <= 7 
                      ? 'text-yellow-600 dark:text-yellow-400 font-medium' 
                      : ''
                }>
                  {daysRemaining < 0 
                    ? `${Math.abs(daysRemaining)}d overdue`
                    : daysRemaining === 0 
                      ? 'Due today'
                      : `${daysRemaining}d left`
                  }
                </span>
              )}
            </div>
          )}
          
          {sprint.goals && (
            <div className="flex items-start space-x-1 mt-2">
              <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p className="text-xs line-clamp-2">{sprint.goals}</p>
            </div>
          )}

          {stats && stats.total > 0 && (
            <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-border text-xs">
              {stats.testCases > 0 && (
                <span className="flex items-center space-x-1">
                  <CheckSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{stats.testCases}</span>
                  <span className="text-muted-foreground">tests</span>
                </span>
              )}
              {stats.bugs > 0 && (
                <span className="flex items-center space-x-1">
                  <Bug className="h-3 w-3 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400 font-medium">{stats.bugs}</span>
                  <span className="text-muted-foreground">bugs</span>
                </span>
              )}
              {stats.suggestions > 0 && (
                <span className="flex items-center space-x-1">
                  <FileText className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">{stats.suggestions}</span>
                  <span className="text-muted-foreground">recs</span>
                </span>
              )}
            </div>
          )}
        </div>

        {stats && stats.total > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium text-foreground">
                {stats.progress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}

export function SprintBoard({ sprints, suiteId, selectedSprints = [], onSelectionChange }: SprintBoardProps) {
  const handleToggleSelection = (sprintId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedSprints.includes(sprintId)) {
      onSelectionChange(selectedSprints.filter(id => id !== sprintId));
    } else {
      onSelectionChange([...selectedSprints, sprintId]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedSprints.length === sprints.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sprints.map(sprint => sprint.id));
    }
  };

  const showSelection = onSelectionChange !== undefined;
  const allSelected = sprints.length > 0 && selectedSprints.length === sprints.length;
  const someSelected = selectedSprints.length > 0 && selectedSprints.length < sprints.length;

  if (sprints.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          No sprints yet. Create your first sprint to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      {showSelection && sprints.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) {
                input.indeterminate = someSelected;
              }
            }}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-sm font-medium text-foreground">
            {allSelected 
              ? `All ${sprints.length} sprints selected`
              : someSelected
                ? `${selectedSprints.length} of ${sprints.length} sprints selected`
                : 'Select all sprints'
            }
          </span>
        </div>
      )}

      {/* Sprint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sprints.map((sprint) => (
          <SprintCard 
            key={sprint.id} 
            sprint={sprint}
            isSelected={selectedSprints.includes(sprint.id)}
            onToggleSelection={showSelection ? handleToggleSelection : undefined}
          />
        ))}
      </div>
    </div>
  );
}