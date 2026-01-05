// ============================================
// components/traceability/CoverageStatsGrid.tsx
// ============================================
'use client';

import React from 'react';
import { FileCheck, Bug, AlertTriangle, Video } from 'lucide-react';
import type { CoverageStats, TraceabilityData } from '@/types/traceability';

interface CoverageStatsGridProps {
  stats: CoverageStats;
  data: TraceabilityData;
}

export function CoverageStatsGrid({ stats, data }: CoverageStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Test Case Coverage</span>
          <FileCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex items-end gap-3">
          <div className="text-3xl font-bold text-foreground">{stats.testCaseCoverage}%</div>
          <div className="text-sm text-muted-foreground pb-1">
            {stats.testCasesWithBugs}/{data.testCases.length}
          </div>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${stats.testCaseCoverage}%` }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Bug Traceability</span>
          <Bug className="w-5 h-5 text-error" />
        </div>
        <div className="flex items-end gap-3">
          <div className="text-3xl font-bold text-foreground">{stats.bugCoverage}%</div>
          <div className="text-sm text-muted-foreground pb-1">
            {stats.bugsWithTestCases}/{data.bugs.length}
          </div>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-error transition-all"
            style={{ width: `${stats.bugCoverage}%` }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Untested Cases</span>
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="text-3xl font-bold text-foreground">{stats.testCasesWithoutBugs}</div>
        <div className="text-sm text-muted-foreground mt-1">
          Test cases without bugs
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Recordings</span>
          <Video className="w-5 h-5 text-purple-600" />
        </div>
        <div className="text-3xl font-bold text-foreground">{stats.recordingsLinked}</div>
        <div className="text-sm text-muted-foreground mt-1">
          Linked to bugs
        </div>
      </div>
    </div>
  );
}