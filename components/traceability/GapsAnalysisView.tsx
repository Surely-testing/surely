// ============================================
// components/traceability/GapsAnalysisView.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, Bug, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TraceabilityData, CoverageStats } from '@/types/traceability';

interface GapsAnalysisViewProps {
  data: TraceabilityData;
  stats: CoverageStats;
  getSeverityColor: (severity?: string | null) => string;
  getStatusIcon: (status?: string | null) => React.ReactNode;
}

export function GapsAnalysisView({ data, stats, getSeverityColor, getStatusIcon }: GapsAnalysisViewProps) {
  return (
    <div className="space-y-4">
      {/* Test Cases Without Bugs */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">
            Test Cases Without Bugs ({stats.testCasesWithoutBugs})
          </h3>
        </div>
        {stats.testCasesWithoutBugs > 0 ? (
          <div className="space-y-2">
            {data.testCases
              .filter(tc => tc.linkedBugs.length === 0)
              .map(tc => (
                <div key={tc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Link
                      href={`/dashboard/test-cases?tc=${tc.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                    >
                      {tc.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tc.status)}
                    <span className="text-xs text-muted-foreground">
                      {tc.status || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">All test cases have linked bugs</p>
          </div>
        )}
      </div>

      {/* Bugs Without Test Cases */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-error" />
          <h3 className="text-lg font-semibold text-foreground">
            Bugs Without Test Cases ({stats.bugsWithoutTestCases})
          </h3>
        </div>
        {stats.bugsWithoutTestCases > 0 ? (
          <div className="space-y-2">
            {data.bugs
              .filter(bug => bug.linkedTestCases.length === 0)
              .map(bug => (
                <div key={bug.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Bug className="w-4 h-4 text-error flex-shrink-0" />
                    <Link
                      href={`/dashboard/bugs?bug=${bug.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                    >
                      {bug.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                      {bug.severity?.toUpperCase() || 'N/A'}
                    </span>
                    {getStatusIcon(bug.status)}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">All bugs are linked to test cases</p>
          </div>
        )}
      </div>
    </div>
  );
}
