// ============================================
// components/traceability/TraceabilityMatrix.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Minus, Filter, ChevronDown, ChevronRight, AlertTriangle, Circle } from 'lucide-react';
import type { TraceabilityData } from '@/types/traceability';

interface TraceabilityMatrixProps {
  data: TraceabilityData;
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onCellClick: (testCaseId: string, bugId: string) => void;
  getSeverityColor: (severity?: string | null) => string;
  getStatusIcon: (status?: string | null) => React.ReactNode;
  getCellStatus: (testCaseId: string, bugId: string) => 'linked' | 'unlinked';
}

export function TraceabilityMatrix({
  data,
  expandedRows,
  onToggleRow,
  onCellClick,
  getSeverityColor,
  getStatusIcon,
  getCellStatus
}: TraceabilityMatrixProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground min-w-[300px]">
                Test Cases ({data.testCases.length})
              </th>
              {data.bugs.map(bug => (
                <th key={bug.id} className="px-2 py-3 text-center text-xs font-medium text-foreground min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`text-xs ${getSeverityColor(bug.severity)}`}>
                      {bug.severity?.toUpperCase() || 'N/A'}
                    </div>
                    <Link 
                      href={`/dashboard/bugs?bug=${bug.id}`}
                      className="hover:text-primary transition-colors line-clamp-2"
                      title={bug.title}
                    >
                      {bug.title}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.testCases.map((testCase, idx) => (
              <tr key={testCase.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${
                idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
              }`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleRow(testCase.id)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      {expandedRows.has(testCase.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/test-cases?tc=${testCase.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                          title={testCase.title}
                        >
                          {testCase.title}
                        </Link>
                        {getStatusIcon(testCase.status)}
                      </div>
                      {expandedRows.has(testCase.id) && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div>Status: {testCase.status || 'N/A'}</div>
                          <div>Priority: {testCase.priority || 'N/A'}</div>
                          <div>Bugs Found: {testCase.linkedBugs.length}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {data.bugs.map(bug => {
                  const isLinked = getCellStatus(testCase.id, bug.id) === 'linked';
                  return (
                    <td 
                      key={bug.id} 
                      className="px-2 py-3 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => onCellClick(testCase.id, bug.id)}
                    >
                      {isLinked ? (
                        <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.testCases.length === 0 && (
        <div className="py-12 text-center">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No test cases match your filters</p>
        </div>
      )}
    </div>
  );
}
