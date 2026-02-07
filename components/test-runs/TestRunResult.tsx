// ============================================
// Clean Minimalist Test Run Results View
// ============================================
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle, XCircle, AlertCircle, Clock, Shield, Flag,
  ChevronRight, ChevronDown, ArrowLeft, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSupabase } from '@/providers/SupabaseProvider';

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

interface ResultsViewProps {
  testRun: TestRun;
  sprints: Sprint[];
  sprintResults: Record<string, TestResult[]>;
  additionalResults: TestResult[];
  onBack: () => void;
}

export default function ResultsView({
  testRun,
  sprints,
  sprintResults,
  additionalResults,
  onBack
}: ResultsViewProps) {
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({});
  const [expandedAdditional, setExpandedAdditional] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const totalTests = useMemo(() => {
    const sprintCount = Object.values(sprintResults).flat().length;
    const additionalCount = additionalResults.length;
    return sprintCount + additionalCount;
  }, [sprintResults, additionalResults]);

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

    return { total, passed, failed, blocked, skipped, pending, passRate };
  }, [sprintResults, additionalResults]);

  const getSprintStats = (sprintId: string) => {
    const results = sprintResults[sprintId] || [];
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const blocked = results.filter(r => r.status === 'blocked').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, blocked, passRate };
  };

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      passed: { icon: CheckCircle, color: 'text-green-600' },
      failed: { icon: XCircle, color: 'text-red-600' },
      blocked: { icon: Shield, color: 'text-orange-600' },
      skipped: { icon: Flag, color: 'text-gray-500' },
      pending: { icon: Clock, color: 'text-yellow-600' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filterResults = (results: TestResult[]) => {
    if (statusFilter === 'all') return results;
    return results.filter(r => r.status === statusFilter);
  };

  const renderResult = (result: TestResult) => {
    const statusConfig = getStatusConfig(result.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div key={result.id} className="py-3 border-b border-border last:border-0">
        <div className="flex items-start gap-3">
          <StatusIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", statusConfig.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground">{result.test_case.title}</h4>
              {result.test_case.priority && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {result.test_case.priority}
                </span>
              )}
            </div>

            {result.test_case.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {result.test_case.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {result.executed_at && (
                <span>{new Date(result.executed_at).toLocaleString()}</span>
              )}
              {result.duration && <span>{result.duration} min</span>}
            </div>

            {result.notes && (
              <div className="mt-2 text-sm text-muted-foreground italic">
                {result.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <button
          onClick={() => window.location.href = `/dashboard/test-runs/${testRun.id}/execute`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-run Tests
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{testRun.name}</h1>
        <p className="text-muted-foreground">Test execution results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="text-center p-4">
          <div className="text-3xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground mt-1">Total</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-bold text-green-600">{stats.passed}</div>
          <div className="text-sm text-muted-foreground mt-1">Passed</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-muted-foreground mt-1">Failed</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-bold text-orange-600">{stats.blocked}</div>
          <div className="text-sm text-muted-foreground mt-1">Blocked</div>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl font-bold text-gray-500">{stats.skipped}</div>
          <div className="text-sm text-muted-foreground mt-1">Skipped</div>
        </div>
      </div>

      {/* Pass Rate */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Pass Rate</span>
          <span className="text-xl font-bold text-foreground">{stats.passRate}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-500"
            style={{ width: `${stats.passRate}%` }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
        >
          <option value="all">All Results</option>
          <option value="passed">Passed Only</option>
          <option value="failed">Failed Only</option>
          <option value="blocked">Blocked Only</option>
          <option value="skipped">Skipped Only</option>
          <option value="pending">Pending Only</option>
        </select>
      </div>

      {/* Sprint Results */}
      {testRun.sprint_ids.length > 0 && (
        <div className="space-y-6 mb-8">
          {testRun.sprint_ids.map(sprintId => {
            const sprint = sprints.find(s => s.id === sprintId);
            const results = filterResults(sprintResults[sprintId] || []);
            const sprintStats = getSprintStats(sprintId);
            const isExpanded = expandedSprints[sprintId];

            if (!sprint) return null;

            return (
              <div key={sprintId} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSprint(sprintId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground">{sprint.name}</div>
                      {sprint.description && (
                        <div className="text-sm text-muted-foreground">{sprint.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{sprintStats.passRate}%</div>
                      <div className="text-xs text-muted-foreground">pass rate</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600">{sprintStats.passed}</span>
                      <span className="text-red-600">{sprintStats.failed}</span>
                      <span className="text-orange-600">{sprintStats.blocked}</span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4">
                    {results.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {statusFilter !== 'all' 
                          ? `No ${statusFilter} results`
                          : 'No results'
                        }
                      </div>
                    ) : (
                      results.map(result => renderResult(result))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Additional Cases */}
      {testRun.additional_case_ids.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedAdditional(!expandedAdditional)}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedAdditional ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="font-semibold text-foreground">
                Additional Cases ({additionalResults.length})
              </div>
            </div>
          </button>

          {expandedAdditional && (
            <div className="border-t border-border px-4">
              {filterResults(additionalResults).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} results`
                    : 'No results'
                  }
                </div>
              ) : (
                filterResults(additionalResults).map(result => renderResult(result))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}