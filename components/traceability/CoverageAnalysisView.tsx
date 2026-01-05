// ============================================
// components/traceability/CoverageAnalysisView.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { TraceabilityData } from '@/types/traceability';

interface CoverageAnalysisViewProps {
  data: TraceabilityData;
  getSeverityColor: (severity?: string | null) => string;
}

export function CoverageAnalysisView({ data, getSeverityColor }: CoverageAnalysisViewProps) {
  return (
    <div className="space-y-4">
      {/* Test Cases Coverage */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Test Case Coverage Analysis</h3>
        <div className="space-y-3">
          {data.testCases.map(tc => {
            const bugCount = tc.linkedBugs.length;
            const hasIssues = bugCount > 0;
            
            return (
              <div key={tc.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/test-cases?tc=${tc.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                  >
                    {tc.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bugCount} bug{bugCount !== 1 ? 's' : ''} found
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasIssues ? (
                    <div className="flex items-center gap-1 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tested</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-warning text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>No bugs</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bugs Coverage */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bug Traceability Analysis</h3>
        <div className="space-y-3">
          {data.bugs.map(bug => {
            const testCaseCount = bug.linkedTestCases.length;
            const hasTrace = testCaseCount > 0;
            
            return (
              <div key={bug.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/bugs?bug=${bug.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                  >
                    {bug.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className={getSeverityColor(bug.severity)}>{bug.severity?.toUpperCase() || 'N/A'}</span>
                    {' • '}
                    {testCaseCount} test case{testCaseCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasTrace ? (
                    <div className="flex items-center gap-1 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Linked</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-error text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Unlinked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}