// ============================================
// FILE: components/sprints/SprintDetail.tsx
// FIXED - Using consistent ConfirmDialog component
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSprint, useSprintStats } from '@/lib/hooks/useSprints';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import SprintForm from './SprintForm';
import { logger } from '@/lib/utils/logger';
import { 
  ArrowLeft, Edit, Trash, Calendar, CheckSquare, Bug, FileText, 
  Clock, AlertCircle, Target, TrendingUp, Lightbulb, BarChart3,
  Play, Pause
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { deleteSprint } from '@/lib/actions/sprints';
import { ConfirmDialog } from '@/components/ui/dialog';

interface SprintDetailProps {
  suiteId: string;
  sprintId: string;
}

// Fetch sprint assets
function useSprintAssets(sprintId: string) {
  return useQuery({
    queryKey: ['sprint-assets', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      const [testCases, bugs, suggestions] = await Promise.all([
        supabase.from('test_cases').select('*').eq('sprint_id', sprintId),
        supabase.from('bugs').select('*').eq('sprint_id', sprintId),
        supabase.from('suggestions').select('*').eq('sprint_id', sprintId),
      ]);

      return {
        testCases: testCases.data || [],
        bugs: bugs.data || [],
        suggestions: suggestions.data || [],
      };
    },
    enabled: !!sprintId,
  });
}

export function SprintDetail({ suiteId, sprintId }: SprintDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const { data: sprint, isLoading } = useSprint(sprintId);
  const { data: stats } = useSprintStats(sprintId);
  const { data: assets, isLoading: assetsLoading } = useSprintAssets(sprintId);

  const metrics = useMemo(() => {
    if (!stats || !assets) return null;

    const completedTests = assets.testCases.filter(tc => tc.status === 'passed' || tc.status === 'failed').length;
    const completedBugs = assets.bugs.filter(bug => bug.status === 'resolved' || bug.status === 'closed').length;
    const completedSuggestions = assets.suggestions.filter(sug => sug.status === 'implemented' || sug.status === 'completed').length;

    const totalAssets = stats.test_cases_count + stats.bugs_count + stats.suggestions_count;
    const completedAssets = completedTests + completedBugs + completedSuggestions;
    const completionRate = totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 0;

    return {
      completionRate,
      completedAssets,
      totalAssets,
      testCases: {
        total: stats.test_cases_count,
        completed: completedTests,
        rate: stats.test_cases_count > 0 ? Math.round((completedTests / stats.test_cases_count) * 100) : 0,
      },
      bugs: {
        total: stats.bugs_count,
        resolved: completedBugs,
        rate: stats.bugs_count > 0 ? Math.round((completedBugs / stats.bugs_count) * 100) : 0,
      },
      suggestions: {
        total: stats.suggestions_count,
        implemented: completedSuggestions,
        rate: stats.suggestions_count > 0 ? Math.round((completedSuggestions / stats.suggestions_count) * 100) : 0,
      },
    };
  }, [stats, assets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sprint not found</p>
      </div>
    );
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteSprint(sprintId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success('Sprint deleted successfully');
      router.push('/dashboard/sprints');
    } catch (error) {
      logger.log('Delete error:', error);
      toast.error('Failed to delete sprint');
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    toast.success('Sprint updated successfully');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'planning':
        return { label: 'Planning', bgColor: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-700 dark:text-gray-300', icon: Clock };
      case 'active':
        return { label: 'Active', bgColor: 'bg-green-100 dark:bg-green-900', color: 'text-green-700 dark:text-green-300', icon: Play };
      case 'on-hold':
        return { label: 'On Hold', bgColor: 'bg-yellow-100 dark:bg-yellow-900', color: 'text-yellow-700 dark:text-yellow-300', icon: Pause };
      case 'completed':
        return { label: 'Completed', bgColor: 'bg-blue-100 dark:bg-blue-900', color: 'text-blue-700 dark:text-blue-300', icon: CheckSquare };
      default:
        return { label: status, bgColor: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-700 dark:text-gray-300', icon: Clock };
    }
  };

  const getStatusBadge = (status: string, type: 'testCase' | 'bug' | 'suggestion') => {
    const badges = {
      testCase: {
        passed: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
        failed: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
        pending: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      },
      bug: {
        resolved: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
        closed: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
        open: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
        pending: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      },
      suggestion: {
        implemented: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
        completed: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
        pending: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      },
    };
    
    const badgeMap = badges[type];
    const defaultBadge = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    return (badgeMap as Record<string, string>)[status] || defaultBadge;
  };

  const statusInfo = getStatusInfo(sprint.status || 'planning');
  const StatusIcon = statusInfo.icon;
  const daysRemaining = sprint.end_date ? differenceInDays(new Date(sprint.end_date), new Date()) : null;

  // If editing, show the form
  if (showEditForm) {
    return (
      <SprintForm
        suiteId={suiteId}
        initialData={sprint}
        onSuccess={handleEditSuccess}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Sprint Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                type="button"
                onClick={() => router.push('/dashboard/sprints')}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{sprint.name}</h1>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor}`}>
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <span className={statusInfo.color}>{statusInfo.label}</span>
                  </div>
                </div>
                {sprint.description && (
                  <p className="text-muted-foreground mb-3">{sprint.description}</p>
                )}
                <div className="flex items-center space-x-6 text-sm text-muted-foreground flex-wrap gap-2">
                  {sprint.start_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Started: {format(new Date(sprint.start_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {sprint.end_date && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Due: {format(new Date(sprint.end_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {daysRemaining !== null && (
                    <div className={`flex items-center space-x-1 ${
                      daysRemaining < 0 ? 'text-red-600 dark:text-red-400' : 
                      daysRemaining <= 7 ? 'text-yellow-600 dark:text-yellow-400' : ''
                    }`}>
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {daysRemaining < 0 
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : daysRemaining === 0 
                            ? 'Due today'
                            : `${daysRemaining} days remaining`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-all duration-200"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {sprint.goals && (
            <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="flex items-start space-x-2">
                <Target className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-teal-800 dark:text-teal-300 mb-1">Sprint Goals</h3>
                  <p className="text-sm text-teal-700 dark:text-teal-400">{sprint.goals}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Progress Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Overall Progress</h3>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{metrics.completionRate}%</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.completedAssets} of {metrics.totalAssets}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${metrics.completionRate}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Test Cases</h3>
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{metrics.testCases.rate}%</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.testCases.completed} of {metrics.testCases.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.testCases.rate}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Bugs Resolved</h3>
                <Bug className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{metrics.bugs.rate}%</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.bugs.resolved} of {metrics.bugs.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 dark:bg-red-400 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.bugs.rate}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Recommendations</h3>
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">{metrics.suggestions.rate}%</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.suggestions.implemented} of {metrics.suggestions.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-600 dark:bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.suggestions.rate}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Sprint Assets */}
        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Sprint Assets</span>
            </h3>
          </div>
          
          <div className="p-4">
            {assetsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <LoadingSpinner size="md" />
                <p className="mt-2">Loading assets...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Test Cases */}
                {assets && assets.testCases.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>Test Cases ({assets.testCases.length})</span>
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {assets.testCases.slice(0, 5).map((testCase: any) => (
                        <div
                          key={testCase.id}
                          className="flex items-center gap-3 py-2.5 px-4 bg-secondary rounded-lg border border-border"
                        >
                          <div className="shrink-0">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-mono font-semibold">
                              {testCase.id?.slice(0, 4).toUpperCase() || '????'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-foreground truncate mb-0.5">
                              {testCase.title || testCase.name || `Test Case ${testCase.id?.slice(0, 8)}`}
                            </h5>
                            {testCase.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {testCase.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(testCase.status || 'pending', 'testCase')}`}>
                              {testCase.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bugs */}
                {assets && assets.bugs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground flex items-center space-x-2">
                        <Bug className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span>Bugs ({assets.bugs.length})</span>
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {assets.bugs.slice(0, 5).map((bug: any) => (
                        <div
                          key={bug.id}
                          className="flex items-center gap-3 py-2.5 px-4 bg-secondary rounded-lg border border-border"
                        >
                          <div className="shrink-0">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs font-mono font-semibold">
                              {bug.id?.slice(0, 4).toUpperCase() || '????'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-foreground truncate mb-0.5">
                              {bug.title || bug.name || `Bug ${bug.id?.slice(0, 8)}`}
                            </h5>
                            {bug.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {bug.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(bug.status || 'open', 'bug')}`}>
                              {bug.status || 'open'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {assets && assets.suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span>Recommendations ({assets.suggestions.length})</span>
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {assets.suggestions.slice(0, 5).map((suggestion: any) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-3 py-2.5 px-4 bg-secondary rounded-lg border border-border"
                        >
                          <div className="shrink-0">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 text-xs font-mono font-semibold">
                              {suggestion.id?.slice(0, 4).toUpperCase() || '????'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-foreground truncate mb-0.5">
                              {suggestion.title || suggestion.name || `Recommendation ${suggestion.id?.slice(0, 8)}`}
                            </h5>
                            {suggestion.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {suggestion.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(suggestion.status || 'pending', 'suggestion')}`}>
                              {suggestion.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {assets && assets.testCases.length === 0 && assets.bugs.length === 0 && assets.suggestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">No Assets Yet</h4>
                    <p className="text-sm">Start adding test cases, bugs, and recommendations to this sprint</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Sprint"
        description={`Are you sure you want to delete "${sprint.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        variant="error"
      />
    </>
  );
}