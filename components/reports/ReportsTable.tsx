// ============================================
// FILE: components/reports/ReportsTable.tsx
// Mobile: full scroll | Desktop: sticky checkbox & title
// ============================================
'use client';

import { ReportWithCreator } from '@/types/report.types';
import { FileText, Eye, RefreshCw, MoreVertical, Trash2 } from 'lucide-react';
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
  
  const handleToggleSelection = (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onSelectionChange) return;
    
    if (selectedReports.includes(reportId)) {
      onSelectionChange(selectedReports.filter(id => id !== reportId));
    } else {
      onSelectionChange([...selectedReports, reportId]);
    }
  };

  const getReportTypeVariant = (type: string): string => {
    switch (type) {
      case 'test_execution': return 'bg-blue-500 text-white';
      case 'test_coverage': return 'bg-green-500 text-white';
      case 'bug_trends': return 'bg-yellow-400 text-yellow-900';
      case 'sprint_summary': return 'bg-purple-500 text-white';
      case 'team_performance': return 'bg-orange-500 text-white';
      default: return 'bg-gray-400 text-gray-900';
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
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
        <p className="text-sm text-muted-foreground">Generate your first report to get started</p>
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
            Report Name
          </div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Report ID</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Type</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Creator</div>
          <div className="w-56 px-4 py-2 border-r border-border flex-shrink-0">Generated Date</div>
          <div className="w-32 px-4 py-2 flex-shrink-0">Actions</div>
        </div>

        {/* Table Body */}
        {reports.map((report) => {
          const isSelected = selectedReports.includes(report.id);
          const isGenerating = generatingId === report.id;

          return (
            <div
              key={report.id}
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
                    onClick={(e) => handleToggleSelection(report.id, e)}
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

              {/* Name - Sticky on md+ with shadow */}
              <div className={`w-80 px-4 py-3 border-r border-border md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div 
                  className="font-medium truncate cursor-help"
                  title={report.name || 'Untitled Report'}
                >
                  {report.name || 'Untitled Report'}
                </div>
              </div>

              {/* Report ID */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono">
                  {report.id.slice(0, 8)}
                </span>
              </div>

              {/* Type */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${getReportTypeVariant(report.type)}`}>
                  {getReportTypeLabel(report.type)}
                </span>
              </div>

              {/* Creator */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                {report.creator ? (
                  <div className="flex items-center gap-2">
                    {report.creator.avatar_url ? (
                      <img
                        src={report.creator.avatar_url}
                        alt={report.creator.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {report.creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm truncate">{report.creator.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unknown</span>
                )}
              </div>

              {/* Generated */}
              <div className="w-56 px-4 py-3 border-r border-border flex-shrink-0">
                <div className="text-sm whitespace-nowrap">
                  {formatDate(report.created_at)}
                </div>
                {isGenerating && (
                  <span className="text-xs text-yellow-600">Generating...</span>
                )}
              </div>

              {/* Actions */}
              <div className="w-32 px-4 py-3 flex-shrink-0">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}