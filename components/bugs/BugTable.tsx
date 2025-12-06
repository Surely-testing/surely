// ============================================
// components/bugs/BugTable.tsx
// Table view for bugs with inline actions using Table UI components
// ============================================
'use client';

import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableHeaderText,
  TableDescriptionText,
  TableCheckbox,
} from '@/components/ui/Table';
import { AssetLinkerCompact } from '@/components/relationships/AssetLinkerCompact';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
      console.error('Error updating status:', error);
      toast.error('Failed to update status', { description: error.message });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getSeverityColor = (severity: BugSeverity | null) => {
    switch (severity) {
      case 'critical': return 'text-error bg-destructive/10';
      case 'high': return 'text-warning bg-warning/10';
      case 'medium': return 'text-accent bg-accent/10';
      case 'low': return 'text-info bg-info/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusColor = (status: BugStatus | null) => {
    switch (status) {
      case 'open': return 'text-error bg-destructive/10';
      case 'in_progress': return 'text-info bg-info/10';
      case 'resolved': return 'text-success bg-success/10';
      case 'closed': return 'text-muted-foreground bg-muted';
      case 'reopened': return 'text-warning bg-warning/10';
      default: return 'text-muted-foreground bg-muted';
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
    <div className="space-y-3">
      {/* Table Header */}
      <div className={`px-4 py-2 bg-muted/50 rounded-lg border border-border ${onSelectionChange ? 'pl-12' : ''}`}>
        <TableGrid columns={6} className="gap-4">
          <TableHeaderText className="text-xs uppercase font-semibold">
            Title
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold hidden md:block">
            Severity
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Status
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold hidden lg:block">
            Created By
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold hidden lg:block">
            Created
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold hidden xl:block">
            Linked Assets
          </TableHeaderText>
        </TableGrid>
      </div>

      {/* Table Rows */}
      <Table className="space-y-2">
        {bugs.map((bug) => {
          const isSelected = selectedBugs.includes(bug.id);
          const isUpdating = updatingStatus === bug.id;
          
          return (
            <TableRow
              key={bug.id}
              className="cursor-pointer"
              onClick={() => onSelect(bug)}
              selected={isSelected}
              selectable={!!onSelectionChange}
            >
              {/* Checkbox */}
              {onSelectionChange && (
                <TableCheckbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelection(bug.id)}
                />
              )}

              <TableGrid columns={6} className="gap-4">
                {/* Title Column - Always visible */}
                <TableCell>
                  <div className="text-sm font-medium text-foreground">
                    {bug.title}
                  </div>
                  {bug.description && (
                    <TableDescriptionText className="line-clamp-1 mt-1">
                      {bug.description}
                    </TableDescriptionText>
                  )}
                </TableCell>

                {/* Severity Column - Hidden on mobile, visible md+ */}
                <TableCell className="hidden md:block">
                  <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getSeverityColor(bug.severity)}`}>
                    {bug.severity || 'N/A'}
                  </span>
                </TableCell>

                {/* Status Column - Always visible */}
                <TableCell>
                  <select
                    value={bug.status || 'open'}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(bug.id, e.target.value as BugStatus);
                    }}
                    disabled={isUpdating}
                    className={`px-2 py-1 rounded text-xs font-medium inline-block border-0 cursor-pointer focus:ring-2 focus:ring-primary outline-none ${getStatusColor(bug.status)} ${isUpdating ? 'opacity-50' : ''}`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="reopened">Reopened</option>
                  </select>
                </TableCell>

                {/* Created By Column - Hidden on mobile, visible lg+ */}
                <TableCell className="hidden lg:block">
                  {bug.creator ? (
                    <div className="flex items-center gap-2">
                      {bug.creator.avatar_url ? (
                        <img 
                          src={bug.creator.avatar_url} 
                          alt={bug.creator.name} 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {bug.creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-foreground">
                        {bug.creator.name}
                      </span>
                    </div>
                  ) : (
                    <TableDescriptionText>—</TableDescriptionText>
                  )}
                </TableCell>

                {/* Created Column - Hidden on mobile, visible lg+ */}
                <TableCell className="hidden lg:block">
                  <TableDescriptionText>
                    {bug.created_at ? format(new Date(bug.created_at), 'MMM d, yyyy') : 'N/A'}
                  </TableDescriptionText>
                </TableCell>

                {/* Linked Assets Column - Hidden on mobile, visible xl+ */}
                <TableCell className="hidden xl:block">
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
                    <TableDescriptionText>—</TableDescriptionText>
                  )}
                </TableCell>

                {/* Actions Column - Empty, button shows on hover */}
                <TableCell className="text-right">
                  {/* Intentionally empty - View button appears on row hover */}
                </TableCell>
              </TableGrid>

              {/* View Button - Appears on hover */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}