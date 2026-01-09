// ============================================
// FILE: components/reports/ReportsTabContent.tsx
// Reports tab content with filtering, sorting, grouping, and pagination
// ============================================

import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportTable } from '@/components/reports/ReportsTable';
import { Pagination } from '@/components/shared/Pagination';
import { ReportWithCreator } from '@/types/report.types';
import { ReportGrid } from '@/components/reports/ReportsGrid';

type SortField = 'created_at' | 'name' | 'type' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'type' | 'status' | 'date';
type ViewMode = 'grid' | 'table';

interface ReportsTabContentProps {
  reports: ReportWithCreator[];
  searchQuery: string;
  filterStatus: string[];
  filterType: string[];
  sortField: SortField;
  sortOrder: SortOrder;
  groupBy: GroupBy;
  viewMode: ViewMode;
  selectedReportIds: string[];
  onSelectionChange: (ids: string[]) => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  onView: (report: ReportWithCreator) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string, name?: string) => void;
  generatingId: string | null;
  isLoading: boolean;
  onClearFilters: () => void;
}

export function ReportsTabContent({
  reports,
  searchQuery,
  filterStatus,
  filterType,
  sortField,
  sortOrder,
  groupBy,
  viewMode,
  selectedReportIds,
  onSelectionChange,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onView,
  onRegenerate,
  onDelete,
  generatingId,
  isLoading,
  onClearFilters
}: ReportsTabContentProps) {
  // Filter and sort logic
  const getFilteredAndSortedReports = () => {
    let filtered = [...reports];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.name?.toLowerCase().includes(query) ||
        report.type?.toLowerCase().includes(query)
      );
    }

    if (filterStatus.length > 0) {
      filtered = filtered.filter(report => filterStatus.includes(report.status));
    }

    if (filterType.length > 0) {
      filtered = filtered.filter(report => filterType.includes(report.type));
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'created_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });

    return filtered;
  };

  const filteredReports = useMemo(() => getFilteredAndSortedReports(), [
    reports, searchQuery, filterStatus, filterType, sortField, sortOrder
  ]);

  // Grouping logic
  const getGroupedReports = () => {
    if (groupBy === 'none') return { 'All Reports': filteredReports };

    const grouped: Record<string, ReportWithCreator[]> = {};
    filteredReports.forEach(report => {
      let groupKey = 'Uncategorized';

      switch (groupBy) {
        case 'type':
          groupKey = report.type ? report.type.replace('_', ' ').toUpperCase() : 'NO TYPE';
          break;
        case 'status':
          groupKey = report.status ? report.status.toUpperCase() : 'NO STATUS';
          break;
        case 'date':
          groupKey = report.created_at
            ? new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
            : 'NO DATE';
          break;
      }

      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(report);
    });

    return grouped;
  };

  const groupedReports = getGroupedReports();

  const paginatedReports = useMemo(() => {
    if (groupBy === 'none') {
      return filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }
    return filteredReports;
  }, [filteredReports, currentPage, itemsPerPage, groupBy]);

  // No results after filtering
  if (filteredReports.length === 0 && reports.length > 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Filter className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">No reports found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your filters or search query
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {/* Content */}
      {filteredReports.length > 0 && (
        groupBy === 'none' ? (
          <>
            {viewMode === 'grid' ? (
              <ReportGrid
                reports={paginatedReports}
                onView={onView}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
                generatingId={generatingId}
                selectedReports={selectedReportIds}
                onSelectionChange={onSelectionChange}
              />
            ) : (
              <ReportTable
                reports={paginatedReports}
                onView={onView}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
                generatingId={generatingId}
                selectedReports={selectedReportIds}
                onSelectionChange={onSelectionChange}
              />
            )}
          </>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedReports).map(([groupName, groupReports]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase">{groupName}</h3>
                  <span className="text-xs text-muted-foreground">({groupReports.length})</span>
                </div>
                {viewMode === 'grid' ? (
                  <ReportGrid
                    reports={groupReports}
                    onView={onView}
                    onRegenerate={onRegenerate}
                    onDelete={onDelete}
                    generatingId={generatingId}
                    selectedReports={selectedReportIds}
                    onSelectionChange={onSelectionChange}
                  />
                ) : (
                  <ReportTable
                    reports={groupReports}
                    onView={onView}
                    onRegenerate={onRegenerate}
                    onDelete={onDelete}
                    generatingId={generatingId}
                    selectedReports={selectedReportIds}
                    onSelectionChange={onSelectionChange}
                  />
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Pagination - only shown for table view when not grouped */}
      {groupBy === 'none' && viewMode === 'table' && filteredReports.length > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredReports.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              onPageChange(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onItemsPerPageChange={(items) => {
              onItemsPerPageChange(items);
              onPageChange(1);
            }}
          />
        </div>
      )}
    </div>
  );
}