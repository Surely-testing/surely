// ============================================
// AutomatedExecutionView.tsx
// Real Playwright execution - No simulation
// ============================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, XCircle, Clock, Loader2,
  Monitor, Terminal, Play, Square, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ExecutionLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
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
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserExpanded, setBrowserExpanded] = useState(false);
  const [testResults, setTestResults] = useState<Map<string, any>>(new Map());
  const [executionComplete, setExecutionComplete] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [executionLogs]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const addLog = (message: string, type: ExecutionLog['type'] = 'info') => {
    setExecutionLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message
    }]);
  };

  const pollTestResults = async () => {
    try {
      const response = await fetch(`/api/test-runs/${testRunId}/results`);
      if (response.ok) {
        const data = await response.json();
        // Update results based on database
        // This will be called periodically while tests run
      }
    } catch (error) {
      console.error('Error polling results:', error);
    }
  };

  const startExecution = async () => {
    setIsRunning(true);
    setExecutionComplete(false);
    setTestResults(new Map());
    addLog('Starting automated execution...', 'info');

    try {
      const response = await fetch('/api/test-execution/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: testRunId,
          testCaseIds: testCases.map(tc => tc.id),
          suiteId: testRun.suite_id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start execution');
      }

      const result = await response.json();
      addLog(`✓ Execution started - ${result.testCaseCount} test(s)`, 'success');
      
      // Start polling for results every 2 seconds
      pollIntervalRef.current = setInterval(() => {
        pollTestResults();
      }, 2000);

      // Monitor execution completion
      monitorExecution();

    } catch (error: any) {
      addLog(`✗ Failed to start: ${error.message}`, 'error');
      setIsRunning(false);
    }
  };

  const monitorExecution = async () => {
    // Poll test run status until complete
    const checkStatus = setInterval(async () => {
      try {
        const response = await fetch(`/api/test-runs?id=${testRunId}`);
        if (response.ok) {
          const data = await response.json();
          const run = data.data;
          
          if (run && ['completed', 'passed', 'failed', 'blocked'].includes(run.status)) {
            clearInterval(checkStatus);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            
            setIsRunning(false);
            setExecutionComplete(true);
            addLog(`✓ Execution completed: ${run.status}`, 'success');
            addLog(`   Passed: ${run.passed_count || 0}/${run.total_count || 0}`, 'info');
            addLog(`   Failed: ${run.failed_count || 0}/${run.total_count || 0}`, run.failed_count > 0 ? 'error' : 'info');
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  const stopExecution = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsRunning(false);
    addLog('Execution stopped by user', 'warning');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTestStatus = (testId: string) => {
    if (testResults.has(testId)) {
      return testResults.get(testId).status;
    }
    if (testCases[currentTestIndex]?.id === testId && isRunning) {
      return 'running';
    }
    return 'pending';
  };

  const getLogColor = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Test Cases List - Hide when browser expanded */}
        <div className={cn(
          "w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto",
          browserExpanded && "hidden"
        )}>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground mb-2">Test Cases ({testCases.length})</h2>
            <div className="text-sm text-muted-foreground">
              {testResults.size} / {testCases.length} completed
            </div>
          </div>
          <div>
            {testCases.map((testCase, index) => {
              const status = getTestStatus(testCase.id);
              const isActive = index === currentTestIndex && isRunning;

              return (
                <div
                  key={testCase.id}
                  className={cn(
                    'p-3 border-b border-border',
                    isActive && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {testCase.title}
                      </p>
                      {testCase.priority && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {testCase.priority}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle: Execution Logs - Hide when browser expanded */}
        <div className={cn(
          'flex flex-col bg-card border-r border-border',
          browserExpanded ? 'hidden' : 'w-1/4 min-w-[300px]'
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-foreground" />
              <h2 className="font-semibold text-foreground">Execution Log</h2>
            </div>
            <button
              onClick={() => setExecutionLogs([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-slate-950 dark:bg-slate-950">
            {executionLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs yet. Click "Start Execution" to begin.</p>
              </div>
            ) : (
              <>
                {executionComplete && (
                  <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Execution Complete!</span>
                    </div>
                    <p className="text-xs text-green-300 mt-1">
                      Review logs above, then click "View Results" to see detailed results.
                    </p>
                  </div>
                )}
                
                <div className="space-y-1">
                  {executionLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-slate-500 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={getLogColor(log.type)}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Live Browser View + Controls */}
        <div className={cn(
          'border-l border-border bg-card flex flex-col',
          browserExpanded ? 'flex-1' : 'flex-1 hidden lg:flex'
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-foreground" />
              <h2 className="font-semibold text-foreground">Browser View</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrowserExpanded(!browserExpanded)}
                className="p-2 hover:bg-muted rounded transition-colors"
                title={browserExpanded ? "Exit fullscreen" : "Fullscreen"}
              >
                {browserExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              
              {/* Single Start/Stop/View Results Button */}
              {executionComplete ? (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  View Results
                </button>
              ) : !isRunning ? (
                <button
                  onClick={startExecution}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                  <Play className="h-4 w-4" />
                  Start Execution
                </button>
              ) : (
                <button
                  onClick={stopExecution}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              )}
            </div>
          </div>

          {browserUrl ? (
            <div className="flex-1 bg-white">
              <iframe
                src={browserUrl}
                className="w-full h-full border-0"
                title="Test Browser"
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Browser view will appear here</p>
                <p className="text-xs mt-1">during test execution</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}