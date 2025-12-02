// ============================================
// components/bugs/MiniBugView.tsx
// Developer-focused card view - Mobile-first responsive
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
      <div className="text-center py-12 sm:py-20 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
          No bugs to display
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          No bugs found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Bug Cards - No duplicate select all here */}
      {bugs.map((bug) => {
        const consoleLog = getConsoleLog(bug);
        const steps = getStepsArray(bug);
        const isCopied = copiedId === bug.id;
        const isSelected = selectedBugs.includes(bug.id);
        
        return (
          <div
            key={bug.id}
            className={`group relative border rounded-lg transition-all duration-200 cursor-pointer overflow-hidden shadow-theme-sm hover:shadow-theme-md flex flex-col sm:flex-row ${
              isSelected 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            {/* Top Status Bar - Subtle */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-muted to-transparent" />
            
            {/* Checkbox - Mobile: top-right, Desktop: Left Side Vertical Center */}
            {onSelectionChange && (
              <div 
                className={`absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 sm:flex sm:items-start sm:justify-center sm:pt-6 sm:pl-4 sm:pr-2 transition-opacity duration-200 z-10 ${
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
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer transition-all flex-shrink-0"
                />
              </div>
            )}

            <div className="flex-1 p-4 sm:p-6" onClick={() => onSelect(bug)}>
              {/* Header: Module + Subtle Status Indicators */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex-1 pr-8 sm:pr-0">
                  {/* Module Tag - Prominent */}
                  <div className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 bg-primary/10 rounded-lg mb-3 shadow-theme-sm">
                    <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    <span className="text-xs sm:text-sm font-semibold text-primary">
                      {bug.module || bug.component || 'Unassigned Module'}
                    </span>
                  </div>
                </div>

                {/* Subtle Status Indicators - Mobile: row, Desktop: Right Side column */}
                <div className="flex flex-row gap-2 sm:flex-col sm:gap-1.5 sm:items-end text-xs">
                  {bug.severity && (
                    <span className={`px-2 sm:px-2.5 py-1 rounded-full font-medium shadow-theme-sm ${getSeverityBadge(bug.severity)}`}>
                      {bug.severity}
                    </span>
                  )}
                  {bug.status && (
                    <span className={`px-2 sm:px-2.5 py-1 rounded-full font-medium shadow-theme-sm ${getStatusBadge(bug.status)}`}>
                      {bug.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Content: Mobile stacked, Desktop side-by-side */}
              <div className="flex flex-col gap-4 sm:gap-6 mb-4 lg:grid lg:grid-cols-2">
                {/* Left Column: Title + Description */}
                <div className="flex flex-col gap-3">
                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    {bug.title}
                  </h3>
                  
                  {/* Description */}
                  {bug.description && (
                    <div className="flex-1 p-3 sm:p-4 bg-muted/30 rounded-lg border-l-4 border-primary overflow-hidden shadow-theme-sm">
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
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
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">Steps to Reproduce</h4>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ol className="space-y-2 sm:space-y-2.5 ml-5 sm:ml-6">
                        {steps.map((step, index) => (
                          <li key={index} className="text-xs sm:text-sm text-foreground relative pl-2 break-words">
                            <span className="absolute -left-5 sm:-left-6 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-error/10 text-error text-[10px] sm:text-xs font-bold flex-shrink-0 shadow-theme-sm">
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
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">Console Output</h4>
                    </div>
                    <button
                      onClick={(e) => handleCopyLog(consoleLog, bug.id, e)}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-secondary rounded-lg transition-all duration-200 shadow-theme-sm"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
                          <span className="hidden xs:inline">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden xs:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg border border-border font-mono overflow-hidden shadow-theme-sm">
                    <pre className="text-[10px] sm:text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-words">
                      {consoleLog}
                    </pre>
                  </div>
                </div>
              )}

              {/* Footer: Environment Details - Mobile stacked, Desktop inline */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4">
                  {bug.environment && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <span className="font-medium">Env:</span>
                      <span className="text-foreground">{bug.environment}</span>
                    </span>
                  )}
                  {bug.browser && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <span className="font-medium">Browser:</span>
                      <span className="text-foreground">{bug.browser}</span>
                    </span>
                  )}
                  {bug.os && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <span className="font-medium">OS:</span>
                      <span className="text-foreground">{bug.os}</span>
                    </span>
                  )}
                  {bug.version && (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <span className="font-medium">Ver:</span>
                      <span className="text-foreground">{bug.version}</span>
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
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full ring-2 ring-border shadow-theme-sm"
                      />
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] sm:text-xs font-medium text-primary ring-2 ring-border shadow-theme-sm">
                        {bug.creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-foreground">{bug.creator.name.split(' ')[0]}</span>
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