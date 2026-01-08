// ============================================
// components/bugs/BugTable.tsx
// Using custom Table components with responsive behavior
// ============================================
'use client';

import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableBadge,
  TableAvatar,
  TableEmpty,
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

  const handleToggleSelection = (bugId: string) => {
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

  if (bugs.length === 0) {
    return (
      <TableEmpty
        title="No bugs to display"
        description="All clear! No bugs found."
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="title" sticky minWidth="min-w-[320px]">Title</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[100px]">Bug ID</TableHeaderCell>,
          <TableHeaderCell key="severity" minWidth="min-w-[100px]">Severity</TableHeaderCell>,
          <TableHeaderCell key="status" minWidth="min-w-[140px]">Status</TableHeaderCell>,
          <TableHeaderCell key="assignee" minWidth="min-w-[160px]">Assignee</TableHeaderCell>,
          <TableHeaderCell key="category" minWidth="min-w-[120px]">Category</TableHeaderCell>,
          <TableHeaderCell key="module" minWidth="min-w-[120px]">Module</TableHeaderCell>,
          <TableHeaderCell key="environment" minWidth="min-w-[120px]">Environment</TableHeaderCell>,
          <TableHeaderCell key="created" minWidth="min-w-[120px]">Created</TableHeaderCell>,
          <TableHeaderCell key="linked" minWidth="min-w-[140px]">Linked Assets</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[100px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {bugs.map((bug) => {
        const isSelected = selectedBugs.includes(bug.id);
        const isUpdating = updatingStatus === bug.id;
        
        return (
          <TableRow key={bug.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(bug.id)}
            />

            {/* Title - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div 
                className="font-medium truncate cursor-help"
                title={bug.title}
              >
                {bug.title}
              </div>
            </TableCell>

            {/* Bug ID */}
            <TableCell minWidth="min-w-[100px]">
              <span className="text-sm text-muted-foreground font-mono">
                {bug.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Severity */}
            <TableCell minWidth="min-w-[100px]">
              <div className="flex items-center h-full py-1">
                <div className={`
                  inline-flex items-center justify-center px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap w-20
                  ${getSeverityVariant(bug.severity) === 'red' ? 'bg-red-500 text-white' : ''}
                  ${getSeverityVariant(bug.severity) === 'orange' ? 'bg-orange-500 text-white' : ''}
                  ${getSeverityVariant(bug.severity) === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                  ${getSeverityVariant(bug.severity) === 'green' ? 'bg-green-500 text-white' : ''}
                  ${getSeverityVariant(bug.severity) === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                `}>
                  {bug.severity || 'N/A'}
                </div>
              </div>
            </TableCell>

            {/* Status */}
            <TableCell minWidth="min-w-[140px]">
              <select
                value={bug.status || 'open'}
                onChange={(e) => {
                  e.stopPropagation();
                  handleStatusChange(bug.id, e.target.value as BugStatus);
                }}
                disabled={isUpdating}
                className={`
                  px-3 py-1.5 rounded text-xs font-medium border-0 cursor-pointer w-full
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
            </TableCell>

            {/* Assignee */}
            <TableCell minWidth="min-w-[160px]">
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
            </TableCell>

            {/* Category */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm">{bug.component || '—'}</span>
            </TableCell>

            {/* Module */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm">{bug.module || '—'}</span>
            </TableCell>

            {/* Environment */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm">{bug.environment || '—'}</span>
            </TableCell>

            {/* Created */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground">
                {bug.created_at ? format(new Date(bug.created_at), 'MMM d, yyyy') : 'N/A'}
              </span>
            </TableCell>

            {/* Linked Assets */}
            <TableCell minWidth="min-w-[140px]">
              {bug.suite_id ? (
                <div className="group relative">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded cursor-help">
                    <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-xs font-medium">View Links</span>
                  </div>
                  {/* Tooltip with linked items */}
                  <div className="invisible group-hover:visible absolute left-0 top-full mt-1 z-50 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg">
                    <AssetLinkerCompact
                      assetType="bug"
                      assetId={bug.id}
                      suiteId={bug.suite_id}
                      maxDisplay={5}
                      onLink={onRefresh}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[100px]">
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
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}