// ============================================
// components/bugs/BugTable.tsx
// Mobile: full scroll | Desktop: sticky checkbox & title
// ============================================
'use client';

import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  TableBadge,
  TableAvatar,
} from '@/components/ui/Table';
import { AssetLinkerCompact } from '@/components/relationships/AssetLinkerCompact';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';


interface BugTableProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
  selectedBugs?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onRefresh?: () => void;
}

export function BugTable({ bugs, onSelect, selectedBugs = [], onSelectionChange, onRefresh }: BugTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const supabase = createClient();

  const handleToggleSelection = (bugId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onSelectionChange) return;
    
    if (selectedBugs.includes(bugId)) {
      onSelectionChange(selectedBugs.filter(id => id !== bugId));
    } else {
      onSelectionChange([...selectedBugs, bugId]);
    }
  };

  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    setUpdatingStatus(bugId);
    try {
      const { error } = await supabase
        .from('bugs')
        .update({ status: newStatus })
        .eq('id', bugId);

      if (error) throw error;

      toast.success('Status updated');
      onRefresh?.();
    } catch (error: any) {
      logger.log('Error updating status:', error);
      toast.error('Failed to update status', { description: error.message });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getSeverityVariant = (severity: BugSeverity | null): "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red" => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusVariant = (status: BugStatus | null): "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red" => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'yellow';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      case 'reopened': return 'orange';
      case 'blocked': return 'red';
      case 'pending': return 'yellow';
      case 'wont_fix': return 'gray';
      case 'duplicate': return 'gray';
      case 'cannot_reproduce': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: BugStatus | null): string => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      case 'reopened': return 'Reopened';
      case 'blocked': return 'Blocked';
      case 'pending': return 'Pending';
      case 'wont_fix': return "Won't Fix";
      case 'duplicate': return 'Duplicate';
      case 'cannot_reproduce': return 'Cannot Reproduce';
      default: return 'N/A';
    }
  };

  if (bugs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No bugs to display
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-lg bg-card overflow-x-auto">
      <div className="min-w-max">
        {/* Table Header */}
        <div className="flex bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="w-12 px-4 py-2 border-r border-border flex items-center justify-center md:sticky md:left-0 bg-muted md:z-10">
            {/* Empty for checkbox */}
          </div>
          <div className="w-80 px-4 py-2 border-r border-border md:sticky md:left-12 bg-muted md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Title
          </div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Bug ID</div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Severity</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Status</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Assignee</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Category</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Module</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Environment</div>
          <div className="w-36 px-4 py-2 border-r border-border flex-shrink-0">Created</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Linked Assets</div>
          <div className="w-32 px-4 py-2 flex-shrink-0">Actions</div>
        </div>

        {/* Table Body */}
        {bugs.map((bug) => {
          const isSelected = selectedBugs.includes(bug.id);
          const isUpdating = updatingStatus === bug.id;
          
          return (
            <div
              key={bug.id}
              className={`flex items-center border-b border-border last:border-b-0 transition-colors ${
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox - Sticky on md+ */}
              <div className={`w-12 px-4 py-3 border-r border-border flex items-center justify-center md:sticky md:left-0 md:z-10 ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                {onSelectionChange && (
                  <div
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={(e) => handleToggleSelection(bug.id, e)}
                    className={`w-4 h-4 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Title - Sticky on md+ with shadow */}
              <div className={`w-80 px-4 py-3 border-r border-border md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div 
                  className="font-medium truncate cursor-help"
                  title={bug.title}
                >
                  {bug.title}
                </div>
              </div>

              {/* Bug ID */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono">
                  {bug.id.slice(0, 8)}
                </span>
              </div>

              {/* Severity */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0 flex items-center">
                <TableBadge variant={getSeverityVariant(bug.severity)}>
                  {bug.severity || 'N/A'}
                </TableBadge>
              </div>

              {/* Status */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <select
                  value={bug.status || 'open'}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(bug.id, e.target.value as BugStatus);
                  }}
                  disabled={isUpdating}
                  className={`
                    w-full px-2.5 py-1 rounded text-xs font-medium border-0 cursor-pointer 
                    focus:ring-2 focus:ring-primary outline-none
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                    ${getStatusVariant(bug.status) === 'red' ? 'bg-red-500 text-white' : ''}
                    ${getStatusVariant(bug.status) === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                    ${getStatusVariant(bug.status) === 'green' ? 'bg-green-500 text-white' : ''}
                    ${getStatusVariant(bug.status) === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                    ${getStatusVariant(bug.status) === 'orange' ? 'bg-orange-500 text-white' : ''}
                  `}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="reopened">Reopened</option>
                  <option value="cannot_reproduce">Cannot Reproduce</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="wont_fix">Won't Fix</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Assignee */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                {bug.assignee ? (
                  <div className="flex items-center gap-2">
                    <TableAvatar
                      src={bug.assignee.avatar_url || undefined}
                      alt={bug.assignee.name}
                      fallback={bug.assignee.name.charAt(0).toUpperCase()}
                    />
                    <span className="text-sm truncate">{bug.assignee.name}</span>
                  </div>
                ) : bug.assigned_to ? (
                  <span className="text-sm truncate">{bug.assigned_to}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>

              {/* Category */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">{bug.component || '—'}</span>
              </div>

              {/* Module */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">{bug.module || '—'}</span>
              </div>

              {/* Environment */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm">{bug.environment || '—'}</span>
              </div>

              {/* Created */}
              <div className="w-36 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground">
                  {bug.created_at ? format(new Date(bug.created_at), 'MMM d, yyyy') : 'N/A'}
                </span>
              </div>

              {/* Linked Assets */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                {bug.suite_id ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <AssetLinkerCompact
                      assetType="bug"
                      assetId={bug.id}
                      suiteId={bug.suite_id}
                      maxDisplay={2}
                      onLink={onRefresh}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Actions - View Button */}
              <div className="w-32 px-4 py-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(bug);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}