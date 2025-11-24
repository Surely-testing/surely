// ============================================
// components/bugs/MiniBugView.tsx
// Developer-focused card view - Quick issue insight for fast resolution
// Shows: Title, Description, Steps to Reproduce, Module, Console Log
// Status/Severity: Subtle indicators, not the focus
// ============================================
'use client';

import { BugWithCreator } from '@/types/bug.types';
import { Code, Copy, Check, AlertCircle, PlayCircle, Terminal } from 'lucide-react';
import { useState } from 'react';

interface MiniBugViewProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
  selectedBugs?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onRefresh?: () => void | Promise<void>;
}

export function MiniBugView({ bugs, onSelect, selectedBugs = [], onSelectionChange }: MiniBugViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggleSelection = (bugId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    
    if (selectedBugs.includes(bugId)) {
      onSelectionChange(selectedBugs.filter(id => id !== bugId));
    } else {
      onSelectionChange([...selectedBugs, bugId]);
    }
  };

  const handleCopyLog = (log: string, bugId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(log);
    setCopiedId(bugId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract console log from labels or description
  const getConsoleLog = (bug: BugWithCreator): string | null => {
    if (bug.labels && typeof bug.labels === 'object' && 'console_log' in bug.labels) {
      return bug.labels.console_log as string;
    }
    
    if (bug.description) {
      const codeBlockMatch = bug.description.match(/```[\s\S]*?```|`[^`]+`/);
      if (codeBlockMatch) {
        return codeBlockMatch[0].replace(/```/g, '').trim();
      }
    }
    
    return null;
  };

  const getStepsArray = (bug: BugWithCreator): string[] => {
    if (Array.isArray(bug.steps_to_reproduce)) {
      return bug.steps_to_reproduce.map((step: any) => 
        typeof step === 'string' ? step : step.description || step.step || ''
      );
    }
    return [];
  };

  if (bugs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No bugs to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bugs.map((bug) => {
        const consoleLog = getConsoleLog(bug);
        const steps = getStepsArray(bug);
        const isCopied = copiedId === bug.id;
        const isSelected = selectedBugs.includes(bug.id);
        
        return (
          <div
            key={bug.id}
            onClick={() => onSelect(bug)}
            className={`group relative border rounded-lg transition-all duration-200 cursor-pointer overflow-hidden ${
              isSelected 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
            }`}
          >
            {/* Top Status Bar - Subtle */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-muted to-transparent" />
            
            {/* Checkbox - Top Right Corner - Visible on hover and when selected */}
            {onSelectionChange && (
              <div 
                className={`absolute top-3 right-3 z-10 transition-opacity duration-200 ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSelection(bug.id, e);
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
              </div>
            )}

            <div className="p-5">
              {/* Header: Module + Subtle Status Indicators */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  {/* Module Tag - Prominent */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg mb-3">
                    <Code className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {bug.module || bug.component || 'Unassigned Module'}
                    </span>
                  </div>
                </div>

                {/* Subtle Status Indicators - Right Side */}
                <div className="flex flex-col gap-1.5 items-end text-xs">
                  {bug.severity && (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${getSeverityBadge(bug.severity)}`}>
                      {bug.severity}
                    </span>
                  )}
                  {bug.status && (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusBadge(bug.status)}`}>
                      {bug.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Content Grid: Title/Description Left - Steps Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Left Column: Title + Description */}
                <div className="flex flex-col gap-3">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {bug.title}
                  </h3>
                  
                  {/* Description */}
                  {bug.description && (
                    <div className="flex-1 p-4 bg-muted/30 rounded-lg border-l-4 border-primary overflow-hidden">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                        {bug.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Steps to Reproduce */}
                {steps.length > 0 && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <PlayCircle className="w-4 h-4 text-error" />
                      <h4 className="text-sm font-semibold text-foreground">Steps to Reproduce</h4>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ol className="space-y-2 ml-6">
                        {steps.map((step, index) => (
                          <li key={index} className="text-sm text-foreground relative pl-2 break-words">
                            <span className="absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full bg-error/10 text-error text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Console Log - Code Block */}
              {consoleLog && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold text-foreground">Console Output</h4>
                    </div>
                    <button
                      onClick={(e) => handleCopyLog(consoleLog, bug.id, e)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-secondary rounded-md transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg border border-border font-mono overflow-hidden">
                    <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-words">
                      {consoleLog}
                    </pre>
                  </div>
                </div>
              )}

              {/* Footer: Environment Details - Subtle, Bottom */}
              <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-3 flex-wrap">
                  {bug.environment && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Env:</span>
                      {bug.environment}
                    </span>
                  )}
                  {bug.browser && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Browser:</span>
                      {bug.browser}
                    </span>
                  )}
                  {bug.os && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">OS:</span>
                      {bug.os}
                    </span>
                  )}
                  {bug.version && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Ver:</span>
                      {bug.version}
                    </span>
                  )}
                </div>
                
                {/* Creator Info */}
                {bug.creator && (
                  <div className="flex items-center gap-2">
                    {bug.creator.avatar_url ? (
                      <img 
                        src={bug.creator.avatar_url} 
                        alt={bug.creator.name} 
                        className="w-5 h-5 rounded-full ring-1 ring-border"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-1 ring-border">
                        {bug.creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs">{bug.creator.name.split(' ')[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper functions using theme colors - Subtle
function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-error/10 text-error border border-error/20';
    case 'high': return 'bg-warning/10 text-warning border border-warning/20';
    case 'medium': return 'bg-yellow-600/10 text-yellow-600 dark:text-yellow-400 border border-yellow-600/20';
    case 'low': return 'bg-primary/10 text-primary border border-primary/20';
    default: return 'bg-muted text-muted-foreground border border-border';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'open': return 'bg-error/10 text-error border border-error/20';
    case 'in_progress': return 'bg-primary/10 text-primary border border-primary/20';
    case 'resolved': return 'bg-success/10 text-success border border-success/20';
    case 'closed': return 'bg-muted text-muted-foreground border border-border';
    case 'reopened': return 'bg-warning/10 text-warning border border-warning/20';
    default: return 'bg-muted text-muted-foreground border border-border';
  }
}