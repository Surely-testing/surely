// ============================================
// components/reports/ReportTable.tsx
// Table view for reports with inline actions
// ============================================
'use client';

import { ReportWithCreator, ReportType, ReportData } from '@/types/report.types';
import { Eye, RefreshCw, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
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
import { toast } from 'sonner';

interface ReportTableProps {
  reports: ReportWithCreator[];
  onView: (report: ReportWithCreator) => void;
  onRegenerate: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  selectedReports?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  generatingId?: string | null;
}

export function ReportTable({
  reports,
  onView,
  onRegenerate,
  onDelete,
  selectedReports = [],
  onSelectionChange,
  generatingId,
}: ReportTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleSelection = (reportId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedReports.includes(reportId)) {
      onSelectionChange(selectedReports.filter(id => id !== reportId));
    } else {
      onSelectionChange([...selectedReports, reportId]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedReports.length === reports.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(reports.map(report => report.id));
    }
  };

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    setDeletingId(reportId);
    try {
      await onDelete(reportId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerate = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await onRegenerate(reportId);
  };

  const getReportTypeLabel = (type: string) => {
    switch (type as ReportType) {
      case 'test_coverage': return 'Test Coverage';
      case 'bug_trends': return 'Bug Trends';
      case 'sprint_summary': return 'Sprint Summary';
      case 'team_performance': return 'Team Performance';
      case 'custom': return 'Custom';
      default: return type;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type as ReportType) {
      case 'test_coverage': return 'text-info bg-info/10';
      case 'bug_trends': return 'text-error bg-destructive/10';
      case 'sprint_summary': return 'text-success bg-success/10';
      case 'team_performance': return 'text-accent bg-accent/10';
      case 'custom': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No reports generated yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All */}
      {onSelectionChange && (
        <div className="flex items-center justify-between">
          <TableSelectAll
            checked={selectedReports.length === reports.length && reports.length > 0}
            onCheckedChange={handleSelectAll}
          />
          {selectedReports.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedReports.length} selected
            </span>
          )}
        </div>
      )}

      {/* Table Header */}
      <div className={`px-4 py-2 bg-muted/50 rounded-lg border border-border ${onSelectionChange ? 'pl-12' : ''}`}>
        <TableGrid columns={5} className="gap-4">
          <TableHeaderText className="text-xs uppercase font-semibold">
            Report Name
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Type
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Created By
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Generated
          </TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">
            Actions
          </TableHeaderText>
        </TableGrid>
      </div>

      {/* Table Rows */}
      <Table className="space-y-2">
        {reports.map((report) => {
          const isSelected = selectedReports.includes(report.id);
          const isGenerating = generatingId === report.id;
          const isDeleting = deletingId === report.id;
          
          // Safely cast report.data to ReportData
          const reportData = report.data as ReportData | null;
          
          return (
            <TableRow
              key={report.id}
              className="cursor-pointer"
              onClick={() => onView(report)}
              selected={isSelected}
              selectable={!!onSelectionChange}
            >
              {/* Checkbox */}
              {onSelectionChange && (
                <TableCheckbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelection(report.id)}
                />
              )}

              <TableGrid columns={5} className="gap-4">
                {/* Report Name Column */}
                <TableCell>
                  <div className="text-sm font-medium text-foreground">
                    {report.name}
                  </div>
                  {reportData?.summary && (
                    <TableDescriptionText className="line-clamp-1 mt-1">
                      {reportData.summary}
                    </TableDescriptionText>
                  )}
                </TableCell>

                {/* Type Column */}
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getReportTypeColor(report.type)}`}>
                    {getReportTypeLabel(report.type)}
                  </span>
                </TableCell>

                {/* Created By Column */}
                <TableCell>
                  {report.creator ? (
                    <div className="flex items-center gap-2">
                      {report.creator.avatar_url ? (
                        <img 
                          src={report.creator.avatar_url} 
                          alt={report.creator.name} 
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {report.creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-foreground">
                        {report.creator.name}
                      </span>
                    </div>
                  ) : (
                    <TableDescriptionText>—</TableDescriptionText>
                  )}
                </TableCell>

                {/* Generated Column */}
                <TableCell>
                  <TableDescriptionText>
                    {report.created_at ? format(new Date(report.created_at), 'MMM d, yyyy') : 'N/A'}
                  </TableDescriptionText>
                  {report.updated_at && report.updated_at !== report.created_at && (
                    <TableDescriptionText className="text-xs">
                      Updated {format(new Date(report.updated_at), 'MMM d')}
                    </TableDescriptionText>
                  )}
                </TableCell>

                {/* Actions Column */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleRegenerate(report.id, e)}
                      disabled={isGenerating}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                      title="Regenerate report"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Download feature coming soon');
                      }}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                      title="Download report"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(report.id, e)}
                      disabled={isDeleting}
                      className="p-1.5 text-muted-foreground hover:text-error hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableGrid>

              {/* View Button - Appears on hover */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(report);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                  title="View report"
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