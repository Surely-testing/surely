// ============================================
// components/reports/ReportsTable.tsx
// Updated with selection support using custom Table components
// ============================================
'use client';

import { ReportWithCreator } from '@/types/report.types';
import { ReportGrid } from './ReportsGrid';
import { 
  Table, 
  TableRow, 
  TableCell, 
  TableGrid, 
  TableCheckbox,
  TableHeaderText,
  TableDescriptionText,
  TableEmpty 
} from '@/components/ui/Table';
import { FileText } from 'lucide-react';

interface ReportTableProps {
  reports: ReportWithCreator[];
  onView: (report: ReportWithCreator) => void;
  onRegenerate: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  generatingId?: string | null;
  viewMode?: 'grid' | 'table';
  selectedReports?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ReportTable({ 
  reports, 
  onView, 
  onRegenerate,
  onDelete,
  generatingId,
  viewMode = 'table',
  selectedReports = [],
  onSelectionChange,
}: ReportTableProps) {
  
  const handleToggleSelection = (reportId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedReports.includes(reportId)) {
      onSelectionChange(selectedReports.filter(id => id !== reportId));
    } else {
      onSelectionChange([...selectedReports, reportId]);
    }
  };

  // If grid view is selected, use ReportGrid component
  if (viewMode === 'grid') {
    return (
      <ReportGrid
        reports={reports}
        onView={onView}
        onRegenerate={onRegenerate}
        onDelete={onDelete}
        generatingId={generatingId}
        selectedReports={selectedReports}
        onSelectionChange={onSelectionChange}
      />
    );
  }

  const getReportTypeColor = (type: string): string => {
    switch (type) {
      case 'test_execution': return 'text-info bg-info/10 border-info/20';
      case 'test_coverage': return 'text-success bg-success/10 border-success/20';
      case 'bug_trends': return 'text-warning bg-warning/10 border-warning/20';
      case 'sprint_summary': return 'text-purple-600 bg-purple-600/10 border-purple-600/20';
      case 'team_performance': return 'text-blue-600 bg-blue-600/10 border-blue-600/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getReportTypeLabel = (type: string): string => {
    switch (type) {
      case 'test_execution': return 'Test Execution';
      case 'test_coverage': return 'Test Coverage';
      case 'bug_trends': return 'Bug Trends';
      case 'sprint_summary': return 'Sprint Summary';
      case 'team_performance': return 'Team Performance';
      default: return type;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (reports.length === 0) {
    return (
      <TableEmpty
        icon={<FileText className="w-8 h-8 text-muted-foreground" />}
        title="No reports found"
        description="Generate your first report to get started"
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-4 py-2 bg-muted/50 rounded-lg border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        <div>Report Name</div>
        <div>Type</div>
        <div>Creator</div>
        <div>Generated</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Rows */}
      {reports.map((report) => {
        const isGenerating = generatingId === report.id;
        const isSelected = selectedReports.includes(report.id);

        return (
          <TableRow
            key={report.id}
            selected={isSelected}
            selectable={!!onSelectionChange}
            onClick={() => onView(report)}
            className="cursor-pointer"
          >
            {/* Selection Checkbox */}
            {onSelectionChange && (
              <TableCheckbox
                checked={isSelected}
                onCheckedChange={() => handleToggleSelection(report.id)}
              />
            )}

            <TableGrid columns={5}>
              {/* Report Name Column */}
              <TableCell>
                <TableHeaderText>{report.name || 'Untitled Report'}</TableHeaderText>
                {report.data && typeof report.data === 'object' && 'summary' in report.data && (
                  <TableDescriptionText>{String(report.data.summary)}</TableDescriptionText>
                )}
              </TableCell>

              {/* Type Column */}
              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${getReportTypeColor(report.type)}`}>
                  {getReportTypeLabel(report.type)}
                </span>
              </TableCell>

              {/* Creator Column */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {report.creator?.avatar_url ? (
                    <img
                      src={report.creator.avatar_url}
                      alt={report.creator.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {report.creator?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-sm text-foreground truncate">
                    {report.creator?.name || 'Unknown'}
                  </span>
                </div>
              </TableCell>

              {/* Generated Column */}
              <TableCell>
                <div className="text-sm text-foreground">
                  {formatDate(report.created_at)}
                </div>
                {isGenerating && (
                  <span className="text-xs text-warning">Generating...</span>
                )}
              </TableCell>

              {/* Actions Column */}
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(report);
                    }}
                    disabled={isGenerating}
                    className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    title="View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate(report.id);
                    }}
                    disabled={isGenerating}
                    className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    title="Regenerate"
                  >
                    <svg className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(report.id);
                    }}
                    disabled={isGenerating}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </TableCell>
            </TableGrid>
          </TableRow>
        );
      })}
    </Table>
  );
}