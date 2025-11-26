// ============================================
// Enhanced Test Run Results View - Separated Sprint & Independent Results
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, AlertCircle, Clock, Shield, Flag,
  ChevronRight, ChevronDown, Package, CheckSquare, History,
  TrendingUp, Calendar, User, ArrowLeft, Download, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TestHistory {
  sprint_id?: string;
  sprint_name?: string;
  test_run_id: string;
  test_run_name: string;
  status: string;
  executed_at: string;
  notes?: string;
}

interface TestResult {
  id: string;
  test_case_id: string;
  test_case: {
    id: string;
    title: string;
    description?: string;
    priority?: string;
  };
  status: string;
  executed_at: string;
  duration?: number;
  notes?: string;
  test_history?: TestHistory[];
}

interface Sprint {
  id: string;
  name: string;
  description?: string;
}

interface TestRun {
  id: string;
  name: string;
  description?: string;
  status: string;
  environment: string;
  test_type: string;
  assigned_to?: string;
  executed_at?: string;
  created_at: string;
  sprint_ids: string[];
  additional_case_ids: string[];
}

interface EnhancedResultsViewProps {
  testRun: TestRun;
  sprints: Sprint[];
  sprintResults: Record<string, TestResult[]>;
  additionalResults: TestResult[];
  onBack: () => void;
}

export default function EnhancedResultsView({
  testRun,
  sprints,
  sprintResults,
  additionalResults,
  onBack
}: EnhancedResultsViewProps) {
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({});
  const [expandedAdditional, setExpandedAdditional] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate overall statistics
  const stats = useMemo(() => {
    const allResults = [
      ...Object.values(sprintResults).flat(),
      ...additionalResults
    ];

    const total = allResults.length;
    const passed = allResults.filter(r => r.status === 'passed').length;
    const failed = allResults.filter(r => r.status === 'failed').length;
    const blocked = allResults.filter(r => r.status === 'blocked').length;
    const skipped = allResults.filter(r => r.status === 'skipped').length;
    const pending = allResults.filter(r => r.status === 'pending' || r.status === 'not_executed').length;
    
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const completionRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

    return { total, passed, failed, blocked, skipped, pending, passRate, completionRate };
  }, [sprintResults, additionalResults]);

  // Sprint-specific statistics
  const getSprintStats = (sprintId: string) => {
    const results = sprintResults[sprintId] || [];
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const blocked = results.filter(r => r.status === 'blocked').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const pending = results.filter(r => r.status === 'pending' || r.status === 'not_executed').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, blocked, skipped, pending, passRate };
  };

  // Additional cases statistics
  const additionalStats = useMemo(() => {
    const total = additionalResults.length;
    const passed = additionalResults.filter(r => r.status === 'passed').length;
    const failed = additionalResults.filter(r => r.status === 'failed').length;
    const blocked = additionalResults.filter(r => r.status === 'blocked').length;
    const skipped = additionalResults.filter(r => r.status === 'skipped').length;
    const pending = additionalResults.filter(r => r.status === 'pending' || r.status === 'not_executed').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, blocked, skipped, pending, passRate };
  }, [additionalResults]);

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const toggleHistory = (resultId: string) => {
    setExpandedHistory(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      passed: {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-700 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      failed: {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400'
      },
      blocked: {
        icon: Shield,
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-orange-200 dark:border-orange-800',
        iconColor: 'text-orange-600 dark:text-orange-400'
      },
      skipped: {
        icon: Flag,
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        textColor: 'text-gray-700 dark:text-gray-400',
        borderColor: 'border-gray-200 dark:border-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400'
      },
      pending: {
        icon: Clock,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filterResults = (results: TestResult[]) => {
    if (statusFilter === 'all') return results;
    return results.filter(r => r.status === statusFilter);
  };

  const renderResult = (result: TestResult, showSprintInfo = false) => {
    const statusConfig = getStatusConfig(result.status);
    const StatusIcon = statusConfig.icon;
    const hasHistory = result.test_history && result.test_history.length > 0;
    const isHistoryExpanded = expandedHistory[result.id];

    return (
      <div key={result.id} className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <StatusIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", statusConfig.iconColor)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium text-foreground">{result.test_case.title}</h4>
                {result.test_case.priority && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    getPriorityColor(result.test_case.priority)
                  )}>
                    {result.test_case.priority}
                  </span>
                )}
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full capitalize",
                  statusConfig.bgColor,
                  statusConfig.textColor,
                  statusConfig.borderColor,
                  "border"
                )}>
                  {result.status}
                </span>
              </div>

              {result.test_case.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {result.test_case.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {result.executed_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(result.executed_at).toLocaleString()}
                  </span>
                )}
                {result.duration && (
                  <span>{result.duration} min</span>
                )}
              </div>

              {result.notes && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">{result.notes}</p>
                </div>
              )}

              {/* Test History */}
              {hasHistory && (
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => toggleHistory(result.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isHistoryExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <History className="w-4 h-4" />
                    <span>Test History ({result.test_history!.length} executions)</span>
                  </button>

                  {isHistoryExpanded && (
                    <div className="mt-3 space-y-2">
                      {result.test_history!.map((history, idx) => {
                        const historyConfig = getStatusConfig(history.status);
                        const HistoryIcon = historyConfig.icon;

                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm"
                          >
                            <HistoryIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", historyConfig.iconColor)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn("font-medium capitalize", historyConfig.textColor)}>
                                  {history.status}
                                </span>
                                {history.sprint_name && (
                                  <>
                                    <span className="text-muted-foreground">in</span>
                                    <span className="text-primary font-medium">{history.sprint_name}</span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  </>
                                )}
                                <span className="text-foreground">{history.test_run_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(history.executed_at).toLocaleString()}
                              </div>
                              {history.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  "{history.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Test Run
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">{testRun.name} - Results</h1>
        <p className="text-muted-foreground">
          Detailed test execution results with sprint grouping and test history
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Tests</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.passed}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Passed</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.failed}</div>
          <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.blocked}</div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Blocked</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.skipped}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
        </div>
      </div>

      {/* Pass Rate */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">Pass Rate</h3>
          <span className="text-2xl font-bold text-foreground">{stats.passRate}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-600 dark:bg-green-500 h-full transition-all duration-500"
            style={{ width: `${stats.passRate}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Completion: {stats.completionRate}% ({stats.total - stats.pending}/{stats.total} executed)
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="blocked">Blocked</option>
          <option value="skipped">Skipped</option>
          <option value="pending">Pending</option>
        </select>
        <div className="text-sm text-muted-foreground">
          {statusFilter !== 'all' && `Showing ${statusFilter} results`}
        </div>
      </div>

      {/* Sprint Results */}
      {testRun.sprint_ids.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            Sprint Results ({testRun.sprint_ids.length} sprints)
          </h2>

          {testRun.sprint_ids.map(sprintId => {
            const sprint = sprints.find(s => s.id === sprintId);
            const results = filterResults(sprintResults[sprintId] || []);
            const sprintStats = getSprintStats(sprintId);
            const isExpanded = expandedSprints[sprintId];

            if (!sprint) return null;

            return (
              <div key={sprintId} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSprint(sprintId)}
                  className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <Package className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg">{sprint.name}</h3>
                      {sprint.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{sprint.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Pass Rate</div>
                      <div className="text-xl font-bold text-foreground">{sprintStats.passRate}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sprintStats.passed > 0 && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {sprintStats.passed} ✓
                        </span>
                      )}
                      {sprintStats.failed > 0 && (
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                          {sprintStats.failed} ✗
                        </span>
                      )}
                      {sprintStats.blocked > 0 && (
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          {sprintStats.blocked} ⊘
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-5 bg-muted/30">
                    {results.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {statusFilter !== 'all' 
                          ? `No ${statusFilter} results in this sprint`
                          : 'No results available'
                        }
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {results.map(result => renderResult(result, true))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Additional Test Cases Results */}
      {testRun.additional_case_ids.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Additional Test Cases
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  These test cases aren't part of any sprint in this run. They may be newly created, 
                  ad-hoc tests, or awaiting sprint assignment. Results are tracked separately for clarity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedAdditional(!expandedAdditional)}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedAdditional ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <CheckSquare className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  Additional Cases ({additionalStats.total})
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Pass Rate</div>
                  <div className="text-xl font-bold text-foreground">{additionalStats.passRate}%</div>
                </div>
                <div className="flex items-center gap-2">
                  {additionalStats.passed > 0 && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {additionalStats.passed} ✓
                    </span>
                  )}
                  {additionalStats.failed > 0 && (
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {additionalStats.failed} ✗
                    </span>
                  )}
                  {additionalStats.blocked > 0 && (
                    <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      {additionalStats.blocked} ⊘
                    </span>
                  )}
                </div>
              </div>
            </button>

            {expandedAdditional && (
              <div className="border-t border-border p-5 bg-muted/30">
                {filterResults(additionalResults).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {statusFilter !== 'all' 
                      ? `No ${statusFilter} results in additional cases`
                      : 'No additional test cases executed'
                    }
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterResults(additionalResults).map(result => renderResult(result))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}