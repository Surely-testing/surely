// ============================================
// components/reports/ReportGrid.tsx
// Grid view with selection support - Aligned with TestCaseGrid
// ============================================
'use client';

import { useState, useMemo } from 'react';
import {
  MoreVertical,
  Calendar,
  User,
  FileText,
  Eye,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { ReportWithCreator } from '@/types/report.types';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/shared/Pagination';
import { cn } from '@/lib/utils/cn';

interface ReportGridProps {
  reports: ReportWithCreator[];
  onView: (report: ReportWithCreator) => void;
  onRegenerate: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  generatingId?: string | null;
  selectedReports?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ReportGrid({ 
  reports, 
  onView, 
  onRegenerate,
  onDelete,
  generatingId,
  selectedReports = [],
  onSelectionChange,
}: ReportGridProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Paginated data
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reports.slice(startIndex, endIndex);
  }, [reports, currentPage, itemsPerPage]);

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedReports, id]);
      } else {
        onSelectionChange(selectedReports.filter(selectedId => selectedId !== id));
      }
    }
  };

  const getReportTypeColor = (type: string): 'info' | 'success' | 'warning' | 'default' => {
    switch (type) {
      case 'test_execution': return 'info';
      case 'test_coverage': return 'success';
      case 'bug_trends': return 'warning';
      default: return 'default';
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
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCardClick = (report: ReportWithCreator) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Double click detection (within 300ms)
    if (lastClickedId === report.id && timeSinceLastClick < 300) {
      onView(report);
      setLastClickTime(0);
      setLastClickedId(null);
    } else {
      setLastClickTime(now);
      setLastClickedId(report.id);
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleViewDetails = (report: ReportWithCreator, e: React.MouseEvent) => {
    e.stopPropagation();
    onView(report);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">No reports found</h3>
        <p className="text-sm text-muted-foreground">Generate your first report to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedReports.map((report) => {
          const isMenuOpen = menuOpenId === report.id;
          const isGenerating = generatingId === report.id;
          const isSelected = selectedReports.includes(report.id);

          return (
            <div
              key={report.id}
              onClick={() => !isGenerating && handleCardClick(report)}
              className={cn(
                'bg-card rounded-lg border transition-all duration-200 cursor-pointer group hover:shadow-lg hover:border-primary/50',
                isGenerating ? 'opacity-50 cursor-wait' : '',
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              )}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {onSelectionChange && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectOne(report.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isGenerating}
                        className={cn(
                          "mt-1 w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer disabled:opacity-50",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {report.name || 'Untitled Report'}
                      </h3>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => toggleMenu(report.id, e)}
                      disabled={isGenerating}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                          }}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(report, e);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRegenerate(report.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate
                          </button>
                          <div className="my-1 h-px bg-border" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(report.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant={getReportTypeColor(report.type)} size="sm">
                    {getReportTypeLabel(report.type)}
                  </Badge>
                  {isGenerating && (
                    <Badge variant="warning" size="sm">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Meta Info */}
                <div className="space-y-2">
                  {report.creator && (
                    <div className="flex items-center gap-2 text-xs">
                      {report.creator.avatar_url ? (
                        <img 
                          src={report.creator.avatar_url} 
                          alt={report.creator.name} 
                          className="w-5 h-5 rounded-full ring-1 ring-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-1 ring-border flex-shrink-0">
                          {report.creator.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="text-muted-foreground truncate">{report.creator.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{formatDate(report.created_at)}</span>
                    {report.created_at && (
                      <span className="truncate">{formatTime(report.created_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {reports.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={reports.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}