// ============================================
// FILE: components/reports/ReportsTable.tsx (FIXED)
// Using custom Table components with responsive behavior
// ============================================
'use client';

import { ReportWithCreator } from '@/types/report.types';
import { FileText, Eye, RefreshCw, MoreVertical, Trash2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableAvatar,
  TableEmpty,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';

interface ReportTableProps {
  reports: ReportWithCreator[];
  onView: (report: ReportWithCreator) => void;
  onRegenerate: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  generatingId?: string | null;
  selectedReports?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ReportTable({ 
  reports, 
  onView, 
  onRegenerate,
  onDelete,
  generatingId,
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

  const getReportTypeVariant = (type: string): "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red" => {
    switch (type) {
      case 'test_execution': return 'default';
      case 'test_coverage': return 'green';
      case 'bug_trends': return 'yellow';
      case 'sprint_summary': return 'pink';
      case 'team_performance': return 'orange';
      default: return 'gray';
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

  // FIX: Helper function to get creator name safely
  const getCreatorName = (creator: ReportWithCreator['creator']): string => {
    if (!creator) return 'Unknown';
    return creator.name || creator.full_name || creator.email || 'Unknown';
  };

  // FIX: Helper function to get creator initials safely
  const getCreatorInitials = (creator: ReportWithCreator['creator']): string => {
    if (!creator) return '?';
    const name = creator.name || creator.full_name || creator.email;
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (reports.length === 0) {
    return (
      <TableEmpty
        icon={<FileText className="w-8 h-8 text-primary" />}
        title="No reports found"
        description="Generate your first report to get started"
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="name" sticky minWidth="min-w-[320px]">Report Name</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[120px]">Report ID</TableHeaderCell>,
          <TableHeaderCell key="type" minWidth="min-w-[160px]">Type</TableHeaderCell>,
          <TableHeaderCell key="creator" minWidth="min-w-[180px]">Creator</TableHeaderCell>,
          <TableHeaderCell key="generated" minWidth="min-w-[200px]">Generated Date</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {reports.map((report) => {
        const isSelected = selectedReports.includes(report.id);
        const isGenerating = generatingId === report.id;
        const creatorName = getCreatorName(report.creator);
        const creatorInitials = getCreatorInitials(report.creator);

        return (
          <TableRow key={report.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(report.id)}
            />

            {/* Name - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div 
                className="font-medium truncate cursor-help"
                title={report.name || 'Untitled Report'}
              >
                {report.name || 'Untitled Report'}
              </div>
            </TableCell>

            {/* Report ID */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground font-mono">
                {report.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Type */}
            <TableCell minWidth="min-w-[160px]">
              <div className="flex items-center h-full py-1">
                <div className={`
                  inline-flex items-center justify-center px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap w-36
                  ${getReportTypeVariant(report.type) === 'default' ? 'bg-gray-100 text-gray-800' : ''}
                  ${getReportTypeVariant(report.type) === 'green' ? 'bg-green-500 text-white' : ''}
                  ${getReportTypeVariant(report.type) === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                  ${getReportTypeVariant(report.type) === 'pink' ? 'bg-pink-500 text-white' : ''}
                  ${getReportTypeVariant(report.type) === 'orange' ? 'bg-orange-500 text-white' : ''}
                  ${getReportTypeVariant(report.type) === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                `}>
                  {getReportTypeLabel(report.type)}
                </div>
              </div>
            </TableCell>

            {/* Creator - FIX: Handle undefined name */}
            <TableCell minWidth="min-w-[180px]">
              <div className="flex items-center gap-2">
                <TableAvatar
                  src={report.creator?.avatar_url || undefined}
                  alt={creatorName}
                  fallback={creatorInitials}
                />
                <span className="text-sm truncate">{creatorName}</span>
              </div>
            </TableCell>

            {/* Generated */}
            <TableCell minWidth="min-w-[200px]">
              <div className="text-sm whitespace-nowrap">
                {formatDate(report.created_at)}
              </div>
              {isGenerating && (
                <span className="text-xs text-yellow-600">Generating...</span>
              )}
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[120px]">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(report);
                  }}
                  disabled={isGenerating}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  title="View"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      disabled={isGenerating}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onRegenerate(report.id)}>
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(report.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}