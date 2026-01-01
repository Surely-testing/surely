// ============================================
// components/reports/ReportsView.tsx - Refactored
// Main container with tabs: Reports | Schedules
// ============================================
'use client';

import { useState } from 'react';
import { Plus, Calendar, FileText, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportsControlBar } from '@/components/reports/views/ReportsControlBar';
import { ReportsTabContent } from '@/components/reports/views/ReportsTabContent';
import { SchedulesTabContent } from '@/components/reports/views/SchedulesTabContent';
import { GenerateReportDialog } from '@/components/reports/GenerateReportDialog';
import { ScheduleReportDialog } from '@/components/reports/ScheduleReportDialog';
import { ReportDetailsDialog } from '@/components/reports/ReportDetailsDialog';
import { BulkActionsBar } from '@/components/shared/bulk-action/BulkActionBar';
import { useReports } from '@/lib/hooks/useReports';
import { useReportSchedules } from '@/lib/hooks/useReportSchedules';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReportWithCreator, ReportScheduleWithReport } from '@/types/report.types';
import { toast } from 'sonner';

interface ReportsViewProps {
  suiteId: string;
}

type TabType = 'reports' | 'schedules';
type ViewMode = 'grid' | 'table';
type SortField = 'created_at' | 'name' | 'type' | 'status';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'type' | 'status' | 'date';

interface DeleteDialogState {
  isOpen: boolean;
  type: 'report' | 'schedule' | 'bulk-report' | 'bulk-schedule' | null;
  itemId?: string;
  itemName?: string;
  bulkIds?: string[];
}

export function ReportsView({ suiteId }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportWithCreator | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ReportScheduleWithReport | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    type: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Search, Filter, Sort, Group - Reports
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showFilters, setShowFilters] = useState(false);

  // Filter - Schedules
  const [filterScheduleStatus, setFilterScheduleStatus] = useState<string[]>([]);
  const [filterFrequency, setFilterFrequency] = useState<string[]>([]);

  // Selection and Pagination
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    reports,
    loading: reportsLoading,
    generating,
    fetchReports,
    generateReport,
    deleteReport,
    regenerateReport,
  } = useReports(suiteId);

  const {
    schedules,
    loading: schedulesLoading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
    runScheduleNow,
  } = useReportSchedules(suiteId);

  const tabs = [
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
  ];

  const handleRefresh = async () => {
    if (activeTab === 'reports') {
      await fetchReports();
    } else {
      await fetchSchedules();
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateReport = async (formData: any) => {
    await generateReport(formData);
    setCurrentPage(1);
  };

  const handleScheduleReport = async (formData: any) => {
    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, formData);
      setEditingSchedule(null);
    } else {
      await createSchedule(formData, suiteId);
    }
  };

  const handleEditSchedule = (schedule: ReportScheduleWithReport) => {
    setEditingSchedule(schedule);
    setIsScheduleOpen(true);
  };

  const handleCloseScheduleDialog = () => {
    setIsScheduleOpen(false);
    setEditingSchedule(null);
  };

  // Delete handlers
  const openDeleteDialog = (type: DeleteDialogState['type'], itemId?: string, itemName?: string, bulkIds?: string[]) => {
    setDeleteDialog({
      isOpen: true,
      type,
      itemId,
      itemName,
      bulkIds,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      type: null,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteDialog.type === 'report' && deleteDialog.itemId) {
        await deleteReport(deleteDialog.itemId);
        toast.success('Report deleted successfully');
      } else if (deleteDialog.type === 'schedule' && deleteDialog.itemId) {
        await deleteSchedule(deleteDialog.itemId);
        toast.success('Schedule deleted successfully');
      } else if (deleteDialog.type === 'bulk-report' && deleteDialog.bulkIds) {
        await Promise.all(deleteDialog.bulkIds.map(id => deleteReport(id)));
        toast.success(`${deleteDialog.bulkIds.length} report(s) deleted`);
        setSelectedReportIds([]);
      } else if (deleteDialog.type === 'bulk-schedule' && deleteDialog.bulkIds) {
        await Promise.all(deleteDialog.bulkIds.map(id => deleteSchedule(id)));
        toast.success(`${deleteDialog.bulkIds.length} schedule(s) deleted`);
        setSelectedScheduleIds([]);
      }
      closeDeleteDialog();
    } catch (error: any) {
      toast.error('Delete failed', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteReport = (id: string, name?: string) => {
    openDeleteDialog('report', id, name);
  };

  const handleDeleteSchedule = (id: string, name?: string) => {
    openDeleteDialog('schedule', id, name);
  };

  const handleSelectAll = () => {
    if (activeTab === 'reports') {
      setSelectedReportIds(
        selectedReportIds.length === reports.length && reports.length > 0
          ? []
          : reports.map(r => r.id)
      );
    } else {
      setSelectedScheduleIds(
        selectedScheduleIds.length === schedules.length && schedules.length > 0
          ? []
          : schedules.map(s => s.id)
      );
    }
  };

  const handleReportBulkAction = async (actionId: string, selectedIds: string[]) => {
    try {
      switch (actionId) {
        case 'delete':
          openDeleteDialog('bulk-report', undefined, undefined, selectedIds);
          break;
        case 'regenerate':
          await Promise.all(selectedIds.map(id => regenerateReport(id)));
          toast.success(`${selectedIds.length} report(s) queued for regeneration`);
          setSelectedReportIds([]);
          break;
      }
    } catch (error: any) {
      toast.error('Bulk action failed', { description: error?.message });
    }
  };

  const handleScheduleBulkAction = async (actionId: string, selectedIds: string[]) => {
    try {
      switch (actionId) {
        case 'delete':
          openDeleteDialog('bulk-schedule', undefined, undefined, selectedIds);
          break;
        case 'enable':
          await Promise.all(selectedIds.map(id => toggleSchedule(id, true)));
          toast.success(`${selectedIds.length} schedule(s) enabled`);
          setSelectedScheduleIds([]);
          break;
        case 'disable':
          await Promise.all(selectedIds.map(id => toggleSchedule(id, false)));
          toast.success(`${selectedIds.length} schedule(s) disabled`);
          setSelectedScheduleIds([]);
          break;
      }
    } catch (error: any) {
      toast.error('Bulk action failed', { description: error?.message });
    }
  };

  const activeFiltersCount = activeTab === 'reports'
    ? filterStatus.length + filterType.length
    : filterScheduleStatus.length + filterFrequency.length;

  const isLoading = activeTab === 'reports' ? reportsLoading : schedulesLoading;

  // Get dialog content based on type
  const getDeleteDialogContent = () => {
    const count = deleteDialog.bulkIds?.length || 0;
    
    switch (deleteDialog.type) {
      case 'report':
        return {
          title: 'Delete Report?',
          description: deleteDialog.itemName
            ? `Are you sure you want to delete "${deleteDialog.itemName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this report? This action cannot be undone.',
        };
      case 'schedule':
        return {
          title: 'Delete Schedule?',
          description: deleteDialog.itemName
            ? `Are you sure you want to delete "${deleteDialog.itemName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this schedule? This action cannot be undone.',
        };
      case 'bulk-report':
        return {
          title: `Delete ${count} Report${count > 1 ? 's' : ''}?`,
          description: `Are you sure you want to delete ${count} report${count > 1 ? 's' : ''}? This action cannot be undone.`,
        };
      case 'bulk-schedule':
        return {
          title: `Delete ${count} Schedule${count > 1 ? 's' : ''}?`,
          description: `Are you sure you want to delete ${count} schedule${count > 1 ? 's' : ''}? This action cannot be undone.`,
        };
      default:
        return {
          title: 'Delete Item?',
          description: 'Are you sure you want to delete this item? This action cannot be undone.',
        };
    }
  };

  const dialogContent = getDeleteDialogContent();

  // Empty state check
  if (reports.length === 0 && schedules.length === 0 && !isLoading) {
    return (
      <>
        <div className="min-h-screen pb-24">
          <div className="mx-auto lg:px-2">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="rounded-lg mb-6">
              <div>
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${isActive
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Empty State */}
            {activeTab === 'reports' && (
              <EmptyState
                icon={FileText}
                iconSize={64}
                title="No reports yet"
                description="Generate your first report to get insights on test execution, bugs, coverage, and performance"
                actions={[
                  {
                    label: 'Generate Report',
                    onClick: () => setIsGenerateOpen(true),
                    variant: 'primary',
                    icon: Plus
                  }
                ]}
                minHeight="400px"
              />
            )}

            {activeTab === 'schedules' && (
              <EmptyState
                icon={Calendar}
                iconSize={64}
                title="No schedules yet"
                description="Schedule reports to be automatically generated on a recurring basis"
                actions={[
                  {
                    label: 'Schedule Report',
                    onClick: () => setIsScheduleOpen(true),
                    variant: 'primary',
                    icon: Plus
                  }
                ]}
                minHeight="400px"
              />
            )}
          </div>
        </div>

        {/* Dialogs */}
        <GenerateReportDialog
          isOpen={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          onGenerate={handleGenerateReport}
          isGenerating={!!generating}
        />

        <ScheduleReportDialog
          isOpen={isScheduleOpen}
          onClose={handleCloseScheduleDialog}
          onSchedule={handleScheduleReport}
          existingSchedule={editingSchedule}
        />

        {selectedReport && (
          <ReportDetailsDialog
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onRegenerate={() => {
              regenerateReport(selectedReport.id);
              setSelectedReport(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-24">
        <div className="mx-auto lg:px-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {activeTab === 'reports' ? (
                  <button
                    onClick={() => setIsGenerateOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Report</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsScheduleOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Report</span>
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center w-10 h-10 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="rounded-lg mb-6">
            <div>
              <nav className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setSearchQuery('');
                        setShowFilters(false);
                      }}
                      className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${isActive
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-0">
              <div className="space-y-6">
                {/* Main Content Card */}
                <div>
                  {/* Control Bar */}
                  <ReportsControlBar
                    activeTab={activeTab}
                    search={searchQuery}
                    onSearchChange={(value) => {
                      setSearchQuery(value);
                      setCurrentPage(1);
                    }}
                    filterStatus={filterStatus}
                    onFilterStatusChange={setFilterStatus}
                    filterType={filterType}
                    onFilterTypeChange={setFilterType}
                    filterScheduleStatus={filterScheduleStatus}
                    onFilterScheduleStatusChange={setFilterScheduleStatus}
                    filterFrequency={filterFrequency}
                    onFilterFrequencyChange={setFilterFrequency}
                    showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    activeFiltersCount={activeFiltersCount}
                    onClearFilters={() => {
                      if (activeTab === 'reports') {
                        setFilterStatus([]);
                        setFilterType([]);
                      } else {
                        setFilterScheduleStatus([]);
                        setFilterFrequency([]);
                      }
                    }}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortField(field);
                      setSortOrder(order);
                    }}
                    groupBy={groupBy}
                    onGroupByChange={setGroupBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    selectedIds={activeTab === 'reports' ? selectedReportIds : selectedScheduleIds}
                    paginatedItems={activeTab === 'reports' ? reports : schedules}
                    onSelectAll={handleSelectAll}
                    isLoading={isLoading}
                  />

                  {/* Tab Content */}
                  {activeTab === 'reports' ? (
                    <ReportsTabContent
                      reports={reports}
                      searchQuery={searchQuery}
                      filterStatus={filterStatus}
                      filterType={filterType}
                      sortField={sortField}
                      sortOrder={sortOrder}
                      groupBy={groupBy}
                      viewMode={viewMode}
                      selectedReportIds={selectedReportIds}
                      onSelectionChange={setSelectedReportIds}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      onView={setSelectedReport}
                      onRegenerate={regenerateReport}
                      onDelete={handleDeleteReport}
                      generatingId={generating}
                      isLoading={reportsLoading}
                      onClearFilters={() => {
                        setSearchQuery('');
                        setFilterStatus([]);
                        setFilterType([]);
                      }}
                    />
                  ) : (
                    <SchedulesTabContent
                      schedules={schedules}
                      searchQuery={searchQuery}
                      filterScheduleStatus={filterScheduleStatus}
                      filterFrequency={filterFrequency}
                      viewMode={viewMode}
                      selectedScheduleIds={selectedScheduleIds}
                      onSelectionChange={setSelectedScheduleIds}
                      onToggle={toggleSchedule}
                      onDelete={handleDeleteSchedule}
                      onRunNow={runScheduleNow}
                      onEdit={handleEditSchedule}
                      isLoading={schedulesLoading}
                      onClearFilters={() => {
                        setSearchQuery('');
                        setFilterScheduleStatus([]);
                        setFilterFrequency([]);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <GenerateReportDialog
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onGenerate={handleGenerateReport}
        isGenerating={!!generating}
      />

      <ScheduleReportDialog
        isOpen={isScheduleOpen}
        onClose={handleCloseScheduleDialog}
        onSchedule={handleScheduleReport}
        existingSchedule={editingSchedule}
      />

      {selectedReport && (
        <ReportDetailsDialog
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onRegenerate={() => {
            regenerateReport(selectedReport.id);
            setSelectedReport(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="text-left">
                {dialogContent.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left">
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="error"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete {deleteDialog.bulkIds && deleteDialog.bulkIds.length > 1 ? `(${deleteDialog.bulkIds.length})` : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={activeTab === 'reports' ? selectedReportIds : selectedScheduleIds}
        onClearSelection={() => activeTab === 'reports' ? setSelectedReportIds([]) : setSelectedScheduleIds([])}
        assetType={activeTab === 'reports' ? 'reports' : 'schedules'}
        onAction={activeTab === 'reports' ? handleReportBulkAction : handleScheduleBulkAction}
      />
    </>
  );
}