// ============================================
// components/bugs/MiniBugView.tsx
// Developer-focused view with module, description, and console logs
// Mobile-first responsive using your UI Table components
// ============================================
'use client';

import { BugWithCreator } from '@/types/bug.types';
import { Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableHeaderText,
  TableDescriptionText,
  TableCheckbox,
  TableSelectAll,
} from '@/components/ui/Table';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MiniBugViewProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
  selectedBugs?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function MiniBugView({ bugs, onSelect, selectedBugs = [], onSelectionChange }: MiniBugViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const handleToggleSelection = (bugId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedBugs.includes(bugId)) {
      onSelectionChange(selectedBugs.filter(id => id !== bugId));
    } else {
      onSelectionChange([...selectedBugs, bugId]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedBugs.length === bugs.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(bugs.map(bug => bug.id));
    }
  };

  const handleCopyLog = (log: string, bugId: string) => {
    navigator.clipboard.writeText(log);
    setCopiedId(bugId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract console log from labels or description
  const getConsoleLog = (bug: BugWithCreator): string | null => {
    // Check labels for console_log
    if (bug.labels && typeof bug.labels === 'object' && 'console_log' in bug.labels) {
      return bug.labels.console_log as string;
    }
    
    // Check if description contains code blocks
    if (bug.description) {
      const codeBlockMatch = bug.description.match(/```[\s\S]*?```|`[^`]+`/);
      if (codeBlockMatch) {
        return codeBlockMatch[0].replace(/```/g, '').trim();
      }
    }
    
    return null;
  };

  if (bugs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No bugs to display
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All - Only show if selection is enabled */}
      {onSelectionChange && (
        <div className="flex items-center justify-between">
          <TableSelectAll
            checked={selectedBugs.length === bugs.length && bugs.length > 0}
            onCheckedChange={handleSelectAll}
          />
          {selectedBugs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedBugs.length} selected
            </span>
          )}
        </div>
      )}

      {/* Table Header */}
      <div className={`px-4 py-2 bg-muted/50 rounded-lg border border-border ${onSelectionChange ? 'pl-12' : ''}`}>
        <TableGrid columns={3} className="gap-4 sm:gap-6">
          <TableHeaderText className="text-xs uppercase font-semibold">
            Module
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Description
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold hidden lg:block">
            Console Log
          </TableHeaderText>
        </TableGrid>
      </div>

      {/* Table Rows */}
      <Table className="space-y-2">
        {bugs.map((bug) => {
          const consoleLog = getConsoleLog(bug);
          const isCopied = copiedId === bug.id;
          const isSelected = selectedBugs.includes(bug.id);
          const isUpdating = updatingStatus === bug.id;
          const isExpanded = expandedDescriptions.has(bug.id);
          
          return (
            <TableRow 
              key={bug.id}
              className="cursor-pointer"
              onClick={() => onSelect(bug)}
              selected={isSelected}
              selectable={!!onSelectionChange}
            >
              {/* Checkbox - Only show if selection is enabled */}
              {onSelectionChange && (
                <TableCheckbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelection(bug.id)}
                />
              )}

              <TableGrid columns={3} className="gap-4 sm:gap-6">
                {/* Module Column */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-mono font-medium text-foreground">
                      {bug.module || bug.component || 'N/A'}
                    </span>
                    {bug.component && bug.module && (
                      <TableDescriptionText>
                        {bug.component}
                      </TableDescriptionText>
                    )}
                  </div>

                  {/* Show console log on mobile as expandable */}
                  {consoleLog && (
                    <details className="lg:hidden mt-2">
                      <summary className="text-xs text-primary cursor-pointer flex items-center gap-1.5 font-medium">
                        <Code className="w-3.5 h-3.5" />
                        Console Log
                      </summary>
                      <div className="mt-2 p-3 bg-secondary rounded-lg border border-border">
                        <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-words">
                          {consoleLog}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLog(consoleLog, bug.id);
                          }}
                          className="mt-2 h-8 text-xs"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 mr-1.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1.5" />
                              Copy Log
                            </>
                          )}
                        </Button>
                      </div>
                    </details>
                  )}
                </TableCell>

                {/* Description Column */}
                <TableCell>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {bug.title}
                    </h3>
                    {bug.description && (
                      <TableDescriptionText className="line-clamp-2">
                        {bug.description}
                      </TableDescriptionText>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {bug.severity && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                          {bug.severity}
                        </span>
                      )}
                      {bug.status && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(bug.status)}`}>
                          {bug.status}
                        </span>
                      )}
                      {bug.browser && (
                        <span className="text-xs text-muted-foreground">
                          {bug.browser}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Console Log Column - Desktop Only */}
                <TableCell className="hidden lg:block">
                  {consoleLog ? (
                    <div className="relative group/log">
                      <div className="p-2.5 bg-secondary rounded-lg border border-border">
                        <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-words max-h-20 overflow-y-auto">
                          {consoleLog}
                        </pre>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLog(consoleLog, bug.id);
                        }}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover/log:opacity-100 transition-opacity"
                        title="Copy log"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <TableDescriptionText className="italic">
                      No log available
                    </TableDescriptionText>
                  )}
                </TableCell>
              </TableGrid>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}

// Helper functions using theme colors
function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'text-error bg-destructive/10';
    case 'high': return 'text-warning bg-warning/10';
    case 'medium': return 'text-accent bg-accent/10';
    case 'low': return 'text-info bg-info/10';
    default: return 'text-muted-foreground bg-muted';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'text-error bg-destructive/10';
    case 'in_progress': return 'text-info bg-info/10';
    case 'resolved': return 'text-success bg-success/10';
    case 'closed': return 'text-muted-foreground bg-muted';
    case 'reopened': return 'text-warning bg-warning/10';
    default: return 'text-muted-foreground bg-muted';
  }
}