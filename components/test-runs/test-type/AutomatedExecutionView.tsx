// ============================================
// AutomatedExecutionView.tsx
// FIXED: Polling, error handling, and testRunId issues
// ============================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, XCircle, Clock, Loader2, AlertCircle,
  Terminal, Play, Square, RefreshCw, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ExecutionLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  stepId?: string;
}

interface TestCaseResult {
  id: string;
  testCaseId: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  stepResults?: StepResult[];
}

interface StepResult {
  stepId: string;
  stepOrder: number;
  description: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

interface AutomatedExecutionViewProps {
  testRunId: string;
  testRun: any;
  testCases: any[];
  onBack: () => void;
}

export default function AutomatedExecutionView({
  testRunId,
  testRun,
  testCases,
  onBack
}: AutomatedExecutionViewProps) {
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Map<string, TestCaseResult>>(new Map());
  const [executionComplete, setExecutionComplete] = useState(false);
  const [currentTestCaseId, setCurrentTestCaseId] = useState<string | null>(null);
  const [executionStats, setExecutionStats] = useState({
    total: testCases.length,
    completed: 0,
    passed: 0,
    failed: 0,
    running: 0
  });
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedStepsRef = useRef<Set<string>>(new Set());
  const errorCountRef = useRef<number>(0); // Track consecutive errors
  const MAX_ERROR_COUNT = 5; // Stop after 5 consecutive errors

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [executionLogs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const addLog = (message: string, type: ExecutionLog['type'] = 'info', stepId?: string) => {
    setExecutionLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
      stepId
    }]);
  };

  // Poll execution results from Supabase
  const pollExecutionResults = async () => {
    // Validate testRunId before making request
    if (!testRunId) {
      console.error('Cannot poll: testRunId is missing');
      addLog('⚠ Error: Test run ID is missing', 'warning');
      stopPolling();
      return;
    }

    try {
      // Call dynamic route: /api/test-execution/[runId]/status
      const url = `/api/test-execution/${testRunId}/status`;
      console.log('Polling execution status:', url);
      console.log('TestRunId value:', testRunId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status API error:', response.status, errorText);
        
        // Increment error count
        errorCountRef.current += 1;
        
        // Don't throw on 404 initially - might be initializing
        if (response.status === 404 && errorCountRef.current < 3) {
          console.log('Test run not found yet, will retry...');
          return;
        }
        
        // Stop polling after too many errors
        if (errorCountRef.current >= MAX_ERROR_COUNT) {
          addLog(`✗ Too many errors (${errorCountRef.current}). Stopping execution.`, 'error');
          addLog(`   Last error: ${errorText}`, 'error');
          stopPolling();
          return;
        }
        
        addLog(`⚠ Error fetching status (attempt ${errorCountRef.current}/${MAX_ERROR_COUNT}): ${response.status}`, 'warning');
        return;
      }

      // Reset error count on success
      errorCountRef.current = 0;

      const data = await response.json();
      console.log('Execution status data:', data);
      
      // Update test results
      if (data.testCaseResults && Array.isArray(data.testCaseResults)) {
        const resultsMap = new Map<string, TestCaseResult>();
        
        data.testCaseResults.forEach((result: TestCaseResult) => {
          resultsMap.set(result.testCaseId, result);
          
          // Check if this is a new result or status change
          const existing = testResults.get(result.testCaseId);
          if (!existing || existing.status !== result.status) {
            const testCase = testCases.find(tc => tc.id === result.testCaseId);
            
            if (result.status === 'running') {
              setCurrentTestCaseId(result.testCaseId);
              addLog(`▶ Running: ${testCase?.title || 'Test'}`, 'info');
            } else if (result.status === 'passed') {
              addLog(`✓ Passed: ${testCase?.title || 'Test'} (${result.duration}ms)`, 'success');
            } else if (result.status === 'failed') {
              addLog(`✗ Failed: ${testCase?.title || 'Test'} - ${result.error || 'Unknown error'}`, 'error');
            }
          }
          
          // FIXED: Track processed steps to avoid duplicates
          if (result.stepResults && result.stepResults.length > 0) {
            result.stepResults.forEach((step: StepResult) => {
              const stepKey = `${result.testCaseId}-${step.stepId}`;
              if (!processedStepsRef.current.has(stepKey)) {
                processedStepsRef.current.add(stepKey);
                
                if (step.status === 'passed') {
                  addLog(`  ✓ Step ${step.stepOrder}: ${step.description} (${step.duration}ms)`, 'success', step.stepId);
                } else if (step.status === 'failed') {
                  addLog(`  ✗ Step ${step.stepOrder}: ${step.description} - ${step.error}`, 'error', step.stepId);
                }
              }
            });
          }
        });
        
        setTestResults(resultsMap);
        
        // Calculate stats
        const stats = {
          total: testCases.length,
          completed: Array.from(resultsMap.values()).filter(r => 
            ['passed', 'failed', 'skipped'].includes(r.status)
          ).length,
          passed: Array.from(resultsMap.values()).filter(r => r.status === 'passed').length,
          failed: Array.from(resultsMap.values()).filter(r => r.status === 'failed').length,
          running: Array.from(resultsMap.values()).filter(r => r.status === 'running').length
        };
        
        setExecutionStats(stats);
      }
      
      // Check if execution is complete
      if (data.status && ['completed', 'passed', 'failed'].includes(data.status)) {
        stopPolling();
        setExecutionComplete(true);
        setCurrentTestCaseId(null);
        
        addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
        addLog(`✓ Execution completed!`, 'success');
        addLog(`  Results: ${executionStats.passed} passed, ${executionStats.failed} failed`, 'info');
      }
      
    } catch (error: any) {
      console.error('Error polling results:', error);
      errorCountRef.current += 1;
      
      if (errorCountRef.current >= MAX_ERROR_COUNT) {
        addLog(`✗ Fatal error after ${errorCountRef.current} attempts. Stopping.`, 'error');
        addLog(`   ${error.message}`, 'error');
        stopPolling();
      } else {
        addLog(`⚠ Error fetching results (attempt ${errorCountRef.current}/${MAX_ERROR_COUNT}): ${error.message}`, 'warning');
      }
    }
  };

  // Helper to stop polling and clean up
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsRunning(false);
  };

  const startExecution = async () => {
    // Validate testRunId before starting
    if (!testRunId) {
      addLog('✗ Cannot start execution: Test run ID is missing', 'error');
      return;
    }

    setIsRunning(true);
    setExecutionComplete(false);
    setTestResults(new Map());
    setExecutionLogs([]);
    processedStepsRef.current.clear();
    errorCountRef.current = 0; // Reset error counter
    setExecutionStats({
      total: testCases.length,
      completed: 0,
      passed: 0,
      failed: 0,
      running: 0
    });
    
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    addLog('🚀 Starting automated test execution...', 'info');
    addLog(`   Test suite: ${testRun.suite?.name || 'Unknown'}`, 'info');
    addLog(`   Total tests: ${testCases.length}`, 'info');
    addLog(`   Run ID: ${testRunId}`, 'info');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

    try {
      addLog('📡 Calling API: /api/test-execution/start', 'info');
      
      const response = await fetch('/api/test-execution/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: testRunId,
          testCaseIds: testCases.map(tc => tc.id),
          suiteId: testRun.suite_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const result = await response.json();
      addLog(`✓ Execution queued successfully`, 'success');
      addLog(`  Execution ID: ${result.executionId || testRunId}`, 'info');
      
      // Start polling for results every 2 seconds
      pollIntervalRef.current = setInterval(() => {
        pollExecutionResults();
      }, 2000);
      
      // Initial poll
      await pollExecutionResults();

    } catch (error: any) {
      addLog(`✗ Failed to start execution: ${error.message}`, 'error');
      stopPolling();
      console.error('Start execution error:', error);
    }
  };

  const stopExecution = async () => {
    try {
      // Validate testRunId
      if (!testRunId) {
        addLog('⚠ Cannot stop: Test run ID is missing', 'warning');
        return;
      }

      // Call dynamic route: /api/test-execution/[runId]/stop
      await fetch(`/api/test-execution/${testRunId}/stop`, {
        method: 'POST'
      });
      
      stopPolling();
      setCurrentTestCaseId(null);
      addLog('⏹ Execution stopped by user', 'warning');
      
    } catch (error: any) {
      addLog(`⚠ Error stopping execution: ${error.message}`, 'warning');
      console.error('Stop execution error:', error);
      stopPolling(); // Still stop polling even if API call fails
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTestStatus = (testId: string): string => {
    const result = testResults.get(testId);
    return result?.status || 'pending';
  };

  const getLogColor = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with stats and controls - FIXED HEIGHT */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Test Execution</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {testRun.suite?.name || 'Test Suite'} - Run #{testRun.run_number || 1}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-foreground">{executionStats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Passed:</span>
                <span className="font-semibold text-green-600">{executionStats.passed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-muted-foreground">Failed:</span>
                <span className="font-semibold text-red-600">{executionStats.failed}</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              {executionComplete ? (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  View Results
                </button>
              ) : !isRunning ? (
                <button
                  onClick={startExecution}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Start Execution
                </button>
              ) : (
                <button
                  onClick={stopExecution}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {isRunning && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{executionStats.completed} / {executionStats.total} completed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${(executionStats.completed / executionStats.total) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2 Column Layout - TAKES REMAINING HEIGHT */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Test Cases List - FIXED WIDTH, SCROLLABLE */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Test Cases ({testCases.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {testCases.map((testCase) => {
              const status = getTestStatus(testCase.id);
              const result = testResults.get(testCase.id);
              const isActive = currentTestCaseId === testCase.id;

              return (
                <div
                  key={testCase.id}
                  className={cn(
                    'p-4 transition-colors',
                    isActive && 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500',
                    !isActive && status === 'passed' && 'bg-green-50/50 dark:bg-green-950/10',
                    !isActive && status === 'failed' && 'bg-red-50/50 dark:bg-red-950/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {testCase.title}
                        </p>
                        {result?.duration && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {result.duration}ms
                          </span>
                        )}
                      </div>
                      
                      {testCase.priority && (
                        <span className={cn(
                          'inline-block text-xs px-2 py-0.5 rounded mt-1',
                          testCase.priority === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          testCase.priority === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                          testCase.priority === 'medium' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          testCase.priority === 'low' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                          {testCase.priority}
                        </span>
                      )}
                      
                      {result?.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">
                          {result.error}
                        </p>
                      )}
                      
                      {isActive && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Running...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show step results if available */}
                  {result?.stepResults && result.stepResults.length > 0 && (
                    <div className="mt-3 pl-7 space-y-1">
                      {result.stepResults.slice(0, 3).map((step) => (
                        <div key={step.stepId} className="flex items-center gap-2 text-xs">
                          {step.status === 'passed' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span className="text-muted-foreground truncate">
                            {step.description}
                          </span>
                        </div>
                      ))}
                      {result.stepResults.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-5">
                          +{result.stepResults.length - 3} more steps
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Execution Logs - TAKES REMAINING WIDTH, SCROLLABLE */}
        <div className="flex flex-col flex-1 bg-card overflow-hidden min-w-0">
          <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Execution Log</h3>
            </div>
            <button
              onClick={() => setExecutionLogs([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-slate-950 dark:bg-slate-950">
            {executionLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Terminal className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-center">No logs yet</p>
                <p className="text-xs text-center mt-1 opacity-70">
                  Click "Start Execution" to begin running tests
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {executionLogs.map((log, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <span className="text-slate-500 text-xs flex-shrink-0 w-24">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={cn('flex-1', getLogColor(log.type))}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}