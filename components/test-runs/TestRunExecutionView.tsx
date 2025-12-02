// ============================================
// FILE: components/test-runs/TestRunExecutionView.tsx
// Professional Test Run Execution Interface
// ============================================
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle, XCircle, AlertCircle, Clock, 
  ChevronRight, ChevronDown, Play, Pause, Save,
  FileText, Timer, ArrowLeft, Shield, Flag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils/cn';

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
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [executionData, setExecutionData] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExecuting && executionStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - executionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting, executionStartTime]);

  const currentTestCase = testCases[currentTestIndex];
  const currentExecution = executionData[currentTestCase?.id] || {
    status: 'not_executed',
    notes: '',
    duration: null,
  };

  // Calculate progress
  const progress = useMemo(() => {
    const total = testCases.length;
    const executed = Object.values(executionData).filter(
      (e: any) => e.status !== 'not_executed'
    ).length;
    const percentage = total > 0 ? Math.round((executed / total) * 100) : 0;
    
    const passed = Object.values(executionData).filter((e: any) => e.status === 'passed').length;
    const failed = Object.values(executionData).filter((e: any) => e.status === 'failed').length;
    const blocked = Object.values(executionData).filter((e: any) => e.status === 'blocked').length;
    const skipped = Object.values(executionData).filter((e: any) => e.status === 'skipped').length;
    
    return { executed, total, percentage, passed, failed, blocked, skipped };
  }, [executionData, testCases.length]);

  const handleStartExecution = () => {
    setIsExecuting(true);
    setExecutionStartTime(Date.now());
    setElapsedTime(0);
  };

  const handlePauseExecution = () => {
    setIsExecuting(false);
    if (executionStartTime && currentTestCase) {
      const duration = Math.round((Date.now() - executionStartTime) / 1000 / 60);
      setExecutionData({
        ...executionData,
        [currentTestCase.id]: {
          ...currentExecution,
          duration: duration || 1
        }
      });
    }
    setExecutionStartTime(null);
  };

  const handleUpdateStatus = (status: string) => {
    if (!currentTestCase) return;

    const duration = executionStartTime
      ? Math.round((Date.now() - executionStartTime) / 1000 / 60)
      : currentExecution.duration;

    setExecutionData({
      ...executionData,
      [currentTestCase.id]: {
        ...currentExecution,
        status,
        duration: duration || 1,
        executed_at: new Date().toISOString()
      }
    });
  };

  const handleSaveAndContinue = async () => {
    if (!currentTestCase || currentExecution.status === 'not_executed') return;

    const duration = executionStartTime
      ? Math.round((Date.now() - executionStartTime) / 1000 / 60)
      : currentExecution.duration;

    const result = {
      status: currentExecution.status,
      executed_at: new Date().toISOString(),
      duration: duration || 1,
      notes: currentExecution.notes || '',
    };

    await onUpdateResult(currentTestCase.id, result);

    // Check if all tests are executed
    const allExecuted = testCases.every(tc => {
      if (tc.id === currentTestCase.id) return true;
      const exec = executionData[tc.id];
      return exec && exec.status !== 'not_executed';
    });

    if (allExecuted) {
      if (onCompleteRun) {
        await onCompleteRun();
      }
      onBack();
    } else {
      // Move to next unexecuted test
      const nextIndex = testCases.findIndex((tc, idx) => {
        if (idx <= currentTestIndex) return false;
        const exec = executionData[tc.id];
        return !exec || exec.status === 'not_executed';
      });

      if (nextIndex !== -1) {
        setCurrentTestIndex(nextIndex);
      } else if (currentTestIndex < testCases.length - 1) {
        setCurrentTestIndex(currentTestIndex + 1);
      }

      setIsExecuting(false);
      setExecutionStartTime(null);
      setElapsedTime(0);
    }
  };

  const handleNavigate = async (index: number) => {
    if (currentTestCase && currentExecution.status !== 'not_executed') {
      await handleSaveAndContinue();
    }
    setCurrentTestIndex(index);
    setIsExecuting(false);
    setExecutionStartTime(null);
    setElapsedTime(0);
  };

  const toggleStep = (index: number) => {
    setExpandedSteps({
      ...expandedSteps,
      [index]: !expandedSteps[index]
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      passed: {
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      failed: {
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400'
      },
      blocked: {
        icon: Shield,
        className: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
        iconColor: 'text-orange-600 dark:text-orange-400'
      },
      skipped: {
        icon: Flag,
        className: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400'
      },
      not_executed: {
        icon: Clock,
        className: 'bg-muted text-muted-foreground border-border',
        iconColor: 'text-muted-foreground'
      },
    };
    return configs[status as keyof typeof configs] || configs.not_executed;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTestCase) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Test Run
        </button>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No test cases to execute</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(currentExecution.status);
  const StatusIcon = statusConfig.icon;
  const allExecuted = progress.executed === progress.total;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar - Test Cases List */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border space-y-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Test Run
            </button>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Execution Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {progress.executed}/{progress.total}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {progress.passed > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-foreground font-medium">{progress.passed} Passed</span>
                    </div>
                  )}
                  {progress.failed > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-foreground font-medium">{progress.failed} Failed</span>
                    </div>
                  )}
                  {progress.blocked > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Shield className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-foreground font-medium">{progress.blocked} Blocked</span>
                    </div>
                  )}
                  {progress.skipped > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Flag className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      <span className="text-foreground font-medium">{progress.skipped} Skipped</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {testCases.map((tc, index) => {
              const exec = executionData[tc.id];
              const status = exec?.status || 'not_executed';
              const config = getStatusConfig(status);
              const TestIcon = config.icon;
              const isActive = index === currentTestIndex;

              return (
                <button
                  key={tc.id}
                  onClick={() => handleNavigate(index)}
                  className={cn(
                    "w-full p-3 text-left border-b border-border hover:bg-muted/50 transition-colors",
                    isActive && "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <TestIcon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tc.title}
                      </p>
                      {tc.priority && (
                        <span className="text-xs text-muted-foreground capitalize mt-0.5 inline-block">
                          {tc.priority} priority
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border bg-card">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {currentTestCase.title}
                </h2>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                  statusConfig.className
                )}>
                  <StatusIcon className="h-4 w-4" />
                  {currentExecution.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Test {currentTestIndex + 1} of {testCases.length}
                </span>
                {currentTestCase.priority && (
                  <span className="capitalize">{currentTestCase.priority} Priority</span>
                )}
              </div>
            </div>

            {/* Completion Banner */}
            {allExecuted && (
              <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">All tests executed!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                    Click &quot;Complete Run&quot; to finish and return to test run details.
                  </p>
                </div>
              </div>
            )}

            {/* Execution Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {!isExecuting ? (
                <button
                  onClick={handleStartExecution}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Play className="h-4 w-4" />
                  Start Execution
                </button>
              ) : (
                <button
                  onClick={handlePauseExecution}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              )}

              {isExecuting && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-lg text-foreground font-mono">
                  <Timer className="h-4 w-4" />
                  <span className="font-medium">{formatTime(elapsedTime)}</span>
                </div>
              )}

              <div className="flex-1" />

              {/* Status Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus('passed')}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium",
                    currentExecution.status === 'passed'
                      ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                      : 'border-border hover:bg-muted text-foreground'
                  )}
                >
                  <CheckCircle className="h-4 w-4" />
                  Pass
                </button>
                <button
                  onClick={() => handleUpdateStatus('failed')}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium",
                    currentExecution.status === 'failed'
                      ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      : 'border-border hover:bg-muted text-foreground'
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  Fail
                </button>
                <button
                  onClick={() => handleUpdateStatus('blocked')}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium",
                    currentExecution.status === 'blocked'
                      ? 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
                      : 'border-border hover:bg-muted text-foreground'
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Block
                </button>
                <button
                  onClick={() => handleUpdateStatus('skipped')}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium",
                    currentExecution.status === 'skipped'
                      ? 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                      : 'border-border hover:bg-muted text-foreground'
                  )}
                >
                  <Flag className="h-4 w-4" />
                  Skip
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            {currentTestCase.description && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {currentTestCase.description}
                </p>
              </div>
            )}

            {/* Preconditions */}
            {currentTestCase.preconditions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Preconditions
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {currentTestCase.preconditions}
                </p>
              </div>
            )}

            {/* Test Steps */}
            {currentTestCase.steps && currentTestCase.steps.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Test Steps</h3>
                <div className="space-y-2">
                  {currentTestCase.steps.map((step: any, index: number) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden bg-card">
                      <button
                        onClick={() => toggleStep(index)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground text-left">
                            {step.action || step.description || 'No action specified'}
                          </span>
                        </div>
                        {expandedSteps[index] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      {expandedSteps[index] && (
                        <div className="p-4 bg-muted border-t border-border">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Expected Result:
                              </p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {step.expected_result || step.expectedResult || 'No expected result specified'}
                              </p>
                            </div>
                            {step.test_data && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Test Data:
                                </p>
                                <p className="text-sm text-foreground leading-relaxed">
                                  {step.test_data}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Notes */}
            <div>
              <label className="block font-semibold text-foreground mb-2">
                Execution Notes
              </label>
              <textarea
                value={currentExecution.notes}
                onChange={(e) => setExecutionData({
                  ...executionData,
                  [currentTestCase.id]: {
                    ...currentExecution,
                    notes: e.target.value
                  }
                })}
                placeholder="Add any observations, issues, or additional notes about the test execution..."
                rows={4}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-card">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleNavigate(Math.max(0, currentTestIndex - 1))}
                disabled={currentTestIndex === 0}
                className="px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndContinue}
                  disabled={currentExecution.status === 'not_executed'}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                    allExecuted
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  )}
                >
                  <Save className="h-4 w-4" />
                  {allExecuted ? 'Complete Run' : 'Save & Continue'}
                </button>
                {!allExecuted && (
                  <span className="text-xs text-muted-foreground">
                    {progress.executed} of {progress.total} executed
                  </span>
                )}
              </div>

              <button
                onClick={() => handleNavigate(Math.min(testCases.length - 1, currentTestIndex + 1))}
                disabled={currentTestIndex === testCases.length - 1}
                className="px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}