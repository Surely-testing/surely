// ============================================
// TestRunExecutionView.tsx (Main Component)
// SINGLE header with all controls
// Child components have NO headers - just content
// ============================================
'use client';

import React, { useState } from 'react';
import { ArrowLeft, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import ManualExecutionView from './test-type/ManualExecutionView';
import AutomatedExecutionView from './test-type/AutomatedExecutionView';

interface TestRunExecutionViewProps {
  testRunId: string;
  testRun: any;
  testCases: any[];
  onBack: () => void;
  onUpdateResult: (testCaseId: string, result: any) => Promise<void>;
  onCompleteRun?: () => Promise<void>;
}

export default function TestRunExecutionView({
  testRunId,
  testRun,
  testCases,
  onBack,
  onUpdateResult,
  onCompleteRun
}: TestRunExecutionViewProps) {
  const [executionMode, setExecutionMode] = useState<'manual' | 'automated'>(
    testRun?.test_type || 'manual'
  );

  const handleAutomatedComplete = async (results: any[]) => {
    for (const result of results) {
      await onUpdateResult(result.testCaseId, result);
    }
    
    if (onCompleteRun) {
      await onCompleteRun();
    }
    
    onBack();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* SINGLE Header - Back, Title, Mode Toggle ONLY */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {testRun?.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {executionMode === 'manual' 
                  ? 'Execute tests step-by-step with manual verification'
                  : 'Automated browser-based test execution with live monitoring'
                }
              </p>
            </div>
          </div>

          {/* Right: Mode Toggle ONLY - No action buttons */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setExecutionMode('manual')}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                executionMode === 'manual'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="h-4 w-4" />
              Manual
            </button>
            <button
              onClick={() => setExecutionMode('automated')}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                executionMode === 'automated'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Zap className="h-4 w-4" />
              Automated
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - NO headers in child components */}
      <div className="flex-1 overflow-hidden">
        {executionMode === 'manual' ? (
          <ManualExecutionView
            testRunId={testRunId}
            testRun={testRun}
            testCases={testCases}
            onUpdateResult={onUpdateResult}
            onCompleteRun={onCompleteRun}
          />
        ) : (
          <AutomatedExecutionView
            testRunId={testRunId}
            testRun={testRun}
            testCases={testCases}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}