// ============================================
// components/traceability/TraceabilityMatrix.tsx
// Main Component - Renamed from BugTraceability
// ============================================
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { Brain, X, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { AITraceabilityAnalyzer } from '@/utils/aiTraceabilityAnalyzer';
import { AIInsightsPanel } from './AIInsightsPanel';
import { TraceabilityHeader } from './TraceabilityHeader';
import { CoverageStatsGrid } from './CoverageStatsGrid';
import { TraceabilityFilters } from './TraceabilityFilters';
import { TraceabilityMatrix as MatrixView } from './view/TraceabilityMatrix';
import { CoverageAnalysisView } from './CoverageAnalysisView';
import { GapsAnalysisView } from './GapsAnalysisView';
import type {
  TraceabilityData,
  CoverageStats,
  ViewType,
  FilterLevel,
  AIInsight,
  TestCase,
  BugItem
} from '@/types/traceability';

interface TraceabilityMatrixProps {
  suiteId: string;
  onClose: () => void;
}

export function TraceabilityMatrix({ suiteId, onClose }: TraceabilityMatrixProps) {
  const supabase = createClient();

  const [data, setData] = useState<TraceabilityData>({ testCases: [], bugs: [], recordings: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<ViewType>('matrix');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{ testCaseId: string; bugId: string } | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTraceabilityData();
  }, [suiteId]);

  const fetchTraceabilityData = async () => {
    setIsLoading(true);
    try {
      // Fetch bugs
      const { data: bugs, error: bugsError } = await supabase
        .from('bugs')
        .select('id, title, status, severity, priority')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (bugsError) throw bugsError;

      // Fetch test cases
      const { data: testCases, error: testCasesError } = await supabase
        .from('test_cases')
        .select('id, title, status, priority')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (testCasesError) throw testCasesError;

      // Fetch recordings
      const { data: recordings, error: recordingsError } = await supabase
        .from('recordings')
        .select('id, title')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (recordingsError) throw recordingsError;

      // Fetch all relationships for this suite
      const { data: relationships, error: relError } = await supabase
        .from('asset_relationships')
        .select('*')
        .eq('suite_id', suiteId);

      if (relError) throw relError;

      // Build relationship maps
      const bugTestCaseLinks = new Map<string, string[]>();
      const bugRecordingLinks = new Map<string, string[]>();
      const testCaseBugLinks = new Map<string, string[]>();

      (relationships || []).forEach((rel: any) => {
        // Bug -> Test Case relationships
        if (rel.source_type === 'bug' && rel.target_type === 'test_case') {
          const existing = bugTestCaseLinks.get(rel.source_id) || [];
          bugTestCaseLinks.set(rel.source_id, [...existing, rel.target_id]);
          
          const tcExisting = testCaseBugLinks.get(rel.target_id) || [];
          testCaseBugLinks.set(rel.target_id, [...tcExisting, rel.source_id]);
        }
        // Test Case -> Bug relationships (reverse)
        else if (rel.source_type === 'test_case' && rel.target_type === 'bug') {
          const existing = testCaseBugLinks.get(rel.source_id) || [];
          testCaseBugLinks.set(rel.source_id, [...existing, rel.target_id]);
          
          const bugExisting = bugTestCaseLinks.get(rel.target_id) || [];
          bugTestCaseLinks.set(rel.target_id, [...bugExisting, rel.source_id]);
        }
        // Bug -> Recording relationships
        else if (rel.source_type === 'bug' && rel.target_type === 'recording') {
          const existing = bugRecordingLinks.get(rel.source_id) || [];
          bugRecordingLinks.set(rel.source_id, [...existing, rel.target_id]);
        }
        // Recording -> Bug relationships (reverse)
        else if (rel.source_type === 'recording' && rel.target_type === 'bug') {
          const existing = bugRecordingLinks.get(rel.target_id) || [];
          bugRecordingLinks.set(rel.target_id, [...existing, rel.source_id]);
        }
      });

      // Transform bugs with linked assets
      const transformedBugs: BugItem[] = (bugs || []).map(bug => ({
        id: bug.id,
        title: bug.title,
        status: bug.status,
        severity: bug.severity,
        priority: bug.priority,
        linkedTestCases: bugTestCaseLinks.get(bug.id) || [],
        linkedRecordings: bugRecordingLinks.get(bug.id) || []
      }));

      // Transform test cases with linked bugs
      const transformedTestCases: TestCase[] = (testCases || []).map(tc => ({
        id: tc.id,
        title: tc.title,
        status: tc.status,
        priority: tc.priority,
        linkedBugs: testCaseBugLinks.get(tc.id) || [],
        linkedRecordings: []
      }));

      // Transform recordings
      const transformedRecordings = (recordings || []).map(rec => ({
        id: rec.id,
        title: rec.title || 'Untitled Recording',
        linkedBugs: transformedBugs
          .filter(bug => bug.linkedRecordings.includes(rec.id))
          .map(bug => bug.id),
        linkedTestCases: []
      }));

      setData({ 
        testCases: transformedTestCases, 
        bugs: transformedBugs, 
        recordings: transformedRecordings 
      });

      logger.log('Traceability data loaded:', {
        testCases: transformedTestCases.length,
        bugs: transformedBugs.length,
        recordings: transformedRecordings.length,
        relationships: relationships?.length || 0,
        linkedTestCases: Array.from(testCaseBugLinks.entries()).length,
        linkedBugs: Array.from(bugTestCaseLinks.entries()).length
      });
    } catch (error: any) {
      logger.log('Error fetching traceability data:', error);
      toast.error('Failed to load traceability data', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo((): CoverageStats => {
    const testCasesWithBugs = data.testCases.filter(tc => tc.linkedBugs.length > 0).length;
    const bugsWithTestCases = data.bugs.filter(b => b.linkedTestCases.length > 0).length;
    const recordingsLinked = data.recordings.filter(r => r.linkedBugs.length > 0).length;

    return {
      testCasesWithBugs,
      testCasesWithoutBugs: data.testCases.length - testCasesWithBugs,
      testCaseCoverage: data.testCases.length > 0 ? Math.round((testCasesWithBugs / data.testCases.length) * 100) : 0,
      bugsWithTestCases,
      bugsWithoutTestCases: data.bugs.length - bugsWithTestCases,
      bugCoverage: data.bugs.length > 0 ? Math.round((bugsWithTestCases / data.bugs.length) * 100) : 0,
      recordingsLinked
    };
  }, [data]);

  useEffect(() => {
    if (data.testCases.length > 0 || data.bugs.length > 0) {
      const insights = AITraceabilityAnalyzer.analyzeTraceability(data, stats);
      setAiInsights(insights.filter(i => !dismissedInsights.has(i.id)));
    }
  }, [data, stats, dismissedInsights]);

  const filteredData = useMemo(() => {
    let filteredTestCases = data.testCases;
    let filteredBugs = data.bugs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTestCases = filteredTestCases.filter(tc => tc.title.toLowerCase().includes(query));
      filteredBugs = filteredBugs.filter(b => b.title.toLowerCase().includes(query));
    }

    if (filterLevel === 'linked') {
      filteredTestCases = filteredTestCases.filter(tc => tc.linkedBugs.length > 0);
      filteredBugs = filteredBugs.filter(b => b.linkedTestCases.length > 0);
    } else if (filterLevel === 'unlinked') {
      filteredTestCases = filteredTestCases.filter(tc => tc.linkedBugs.length === 0);
      filteredBugs = filteredBugs.filter(b => b.linkedTestCases.length === 0);
    }

    return { testCases: filteredTestCases, bugs: filteredBugs, recordings: data.recordings };
  }, [data, searchQuery, filterLevel]);

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const getCellStatus = (testCaseId: string, bugId: string): 'linked' | 'unlinked' => {
    const testCase = data.testCases.find(tc => tc.id === testCaseId);
    return testCase?.linkedBugs.includes(bugId) ? 'linked' : 'unlinked';
  };

  const getSeverityColor = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-error" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const exportMatrix = () => {
    const csv: string[] = [];
    const header = ['Test Case', ...filteredData.bugs.map(b => b.title)];
    csv.push(header.join(','));

    filteredData.testCases.forEach(tc => {
      const row = [tc.title, ...filteredData.bugs.map(bug => tc.linkedBugs.includes(bug.id) ? 'X' : '')];
      csv.push(row.join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceability-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Matrix exported successfully');
  };

  const handleDismissInsight = (insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
  };

  const handleInsightAction = (insight: AIInsight) => {
    if (insight.affectedItems.length > 0) {
      toast.info(`Showing ${insight.affectedItems.length} affected items`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <TraceabilityHeader
          onExport={exportMatrix}
          onRefresh={fetchTraceabilityData}
          onClose={onClose}
          isLoading={isLoading}
        />

        <CoverageStatsGrid stats={stats} data={data} />

        {showAIPanel && aiInsights.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">AI Insights</h2>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {aiInsights.length} {aiInsights.length === 1 ? 'insight' : 'insights'}
                </span>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AIInsightsPanel
              insights={aiInsights}
              data={data}
              onDismiss={handleDismissInsight}
              onAction={handleInsightAction}
            />
          </div>
        )}

        <div className="space-y-4">
          {!showAIPanel && aiInsights.length > 0 && (
            <button
              onClick={() => setShowAIPanel(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-all"
            >
              <Brain className="w-5 h-5" />
              <span className="font-medium">Show {aiInsights.length} AI Insight{aiInsights.length === 1 ? '' : 's'}</span>
            </button>
          )}

          <TraceabilityFilters
            viewType={viewType}
            setViewType={setViewType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterLevel={filterLevel}
            setFilterLevel={setFilterLevel}
          />
        </div>

        {viewType === 'matrix' && (
          <MatrixView
            data={filteredData}
            expandedRows={expandedRows}
            onToggleRow={toggleRowExpand}
            onCellClick={(tcId, bugId) => setSelectedCell({ testCaseId: tcId, bugId })}
            getSeverityColor={getSeverityColor}
            getStatusIcon={getStatusIcon}
            getCellStatus={getCellStatus}
          />
        )}

        {viewType === 'coverage' && (
          <CoverageAnalysisView data={data} getSeverityColor={getSeverityColor} />
        )}

        {viewType === 'gaps' && (
          <GapsAnalysisView
            data={data}
            stats={stats}
            getSeverityColor={getSeverityColor}
            getStatusIcon={getStatusIcon}
          />
        )}
      </div>
    </div>
  );
}