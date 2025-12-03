// ============================================
// components/reports/ReportsView.tsx
// Main container with tabs: Reports | Schedules
// Mobile-first responsive with controls bar below tabs
// Matches BugsView design pattern
// ============================================
'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar, FileText, RefreshCw, Grid, List, Search, Filter, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportTable } from '@/components/reports/ReportsTable';
import { ScheduleTable } from '@/components/reports/ScheduleTable';
import { GenerateReportDialog } from '@/components/reports/GenerateReportDialog';
import { ScheduleReportDialog } from '@/components/reports/ScheduleReportDialog';
import { ReportDetailsDialog } from '@/components/reports/ReportDetailsDialog';
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar';
import { Pagination } from '@/components/shared/Pagination';
import { useReports } from '@/lib/hooks/useReports';
import { useReportSchedules } from '@/lib/hooks/useReportSchedules';
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

export function ReportsView({ suiteId }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportWithCreator | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ReportScheduleWithReport | null>(null);

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

  // Filter and sort logic for Reports
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

  // Filter logic for Schedules
  const getFilteredSchedules = () => {
    let filtered = [...schedules];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(schedule =>
        schedule.name?.toLowerCase().includes(query) ||
        schedule.description?.toLowerCase().includes(query)
      );
    }

    if (filterScheduleStatus.length > 0) {
      filtered = filtered.filter(schedule => {
        const status = schedule.is_active ? 'active' : 'inactive';
        return filterScheduleStatus.includes(status);
      });
    }

    if (filterFrequency.length > 0) {
      filtered = filtered.filter(schedule => filterFrequency.includes(schedule.frequency));
    }

    return filtered;
  };

  const filteredSchedules = useMemo(() => getFilteredSchedules(), [
    schedules, searchQuery, filterScheduleStatus, filterFrequency
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

  const handleSelectAll = () => {
    if (activeTab === 'reports') {
      setSelectedReportIds(
        selectedReportIds.length === paginatedReports.length && paginatedReports.length > 0
          ? []
          : paginatedReports.map(r => r.id)
      );
    } else {
      setSelectedScheduleIds(
        selectedScheduleIds.length === filteredSchedules.length && filteredSchedules.length > 0
          ? []
          : filteredSchedules.map(s => s.id)
      );
    }
  };

  const handleReportBulkAction = async (actionId: string, selectedIds: string[]) => {
    try {
      switch (actionId) {
        case 'delete':
          await Promise.all(selectedIds.map(id => deleteReport(id)));
          toast.success(`${selectedIds.length} report(s) deleted`);
          break;
        case 'regenerate':
          await Promise.all(selectedIds.map(id => regenerateReport(id)));
          toast.success(`${selectedIds.length} report(s) queued for regeneration`);
          break;
      }
      setSelectedReportIds([]);
    } catch (error: any) {
      toast.error('Bulk action failed', { description: error?.message });
    }
  };

  const handleScheduleBulkAction = async (actionId: string, selectedIds: string[]) => {
    try {
      switch (actionId) {
        case 'delete':
          await Promise.all(selectedIds.map(id => deleteSchedule(id)));
          toast.success(`${selectedIds.length} schedule(s) deleted`);
          break;
        case 'enable':
          await Promise.all(selectedIds.map(id => toggleSchedule(id, true)));
          toast.success(`${selectedIds.length} schedule(s) enabled`);
          break;
        case 'disable':
          await Promise.all(selectedIds.map(id => toggleSchedule(id, false)));
          toast.success(`${selectedIds.length} schedule(s) disabled`);
          break;
      }
      setSelectedScheduleIds([]);
    } catch (error: any) {
      toast.error('Bulk action failed', { description: error?.message });
    }
  };

  const activeFiltersCount = activeTab === 'reports'
    ? filterStatus.length + filterType.length
    : filterScheduleStatus.length + filterFrequency.length;

  const isLoading = activeTab === 'reports' ? reportsLoading : schedulesLoading;

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
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Report</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsScheduleOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
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
          <div className=" rounded-lg mb-6">
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
                  {/* Unified Controls Bar */}
                  <div className="px-3 py-2 border-b border-border bg-card">
                    {/* Mobile Layout - 3 Sections Stacked */}
                    <div className="flex flex-col gap-3 lg:hidden">
                      {/* Section 1: Search (Full Width on Mobile) */}
                      <div className="w-full">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            placeholder={activeTab === 'reports' ? "Search reports..." : "Search schedules..."}
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Section 2: Filter | Sort | Group */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Filter Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFilters(!showFilters)}
                          className="relative"
                          disabled={isLoading}
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                          {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                              {activeFiltersCount}
                            </span>
                          )}
                        </Button>

                        {/* Sort and Group - Only for Reports */}
                        {activeTab === 'reports' && (
                          <>
                            {/* Sort Dropdown */}
                            <select
                              value={`${sortField}-${sortOrder}`}
                              onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortField(field as SortField);
                                setSortOrder(order as SortOrder);
                              }}
                              disabled={isLoading}
                              className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground disabled:opacity-50"
                            >
                              <option value="created_at-desc">Newest First</option>
                              <option value="created_at-asc">Oldest First</option>
                              <option value="name-asc">Name (A-Z)</option>
                              <option value="name-desc">Name (Z-A)</option>
                              <option value="type-asc">Type (A-Z)</option>
                              <option value="status-asc">Status (A-Z)</option>
                            </select>

                            {/* Group By Dropdown */}
                            <select
                              value={groupBy}
                              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                              disabled={isLoading}
                              className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground disabled:opacity-50"
                            >
                              <option value="none">No Grouping</option>
                              <option value="type">Group by Type</option>
                              <option value="status">Group by Status</option>
                              <option value="date">Group by Date</option>
                            </select>
                          </>
                        )}
                      </div>

                      {/* Section 3: Select All | View Toggle */}
                      <div className="flex items-center justify-between">
                        {/* Select All */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={
                              activeTab === 'reports'
                                ? selectedReportIds.length === paginatedReports.length && paginatedReports.length > 0
                                : selectedScheduleIds.length === filteredSchedules.length && filteredSchedules.length > 0
                            }
                            onChange={handleSelectAll}
                            disabled={isLoading}
                            className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            Select All
                          </span>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                          <button
                            onClick={() => setViewMode('grid')}
                            disabled={isLoading}
                            className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
                                ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            title="Grid View"
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('table')}
                            disabled={isLoading}
                            className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
                                ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            title="Table View"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout - Single Row */}
                    <div className="hidden lg:flex lg:items-center lg:justify-between">
                      {/* Left: Select All */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={
                            activeTab === 'reports'
                              ? selectedReportIds.length === paginatedReports.length && paginatedReports.length > 0
                              : selectedScheduleIds.length === filteredSchedules.length && filteredSchedules.length > 0
                          }
                          onChange={handleSelectAll}
                          disabled={isLoading}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        />
                        <span className="text-sm font-medium text-muted-foreground">
                          Select All
                        </span>
                      </div>

                      {/* Right: All Controls */}
                      <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            placeholder={activeTab === 'reports' ? "Search reports..." : "Search schedules..."}
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                          />
                        </div>

                        {/* Filter Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFilters(!showFilters)}
                          className="relative"
                          disabled={isLoading}
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                          {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                              {activeFiltersCount}
                            </span>
                          )}
                        </Button>

                        {/* Sort and Group - Only for Reports */}
                        {activeTab === 'reports' && (
                          <>
                            <select
                              value={`${sortField}-${sortOrder}`}
                              onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortField(field as SortField);
                                setSortOrder(order as SortOrder);
                              }}
                              disabled={isLoading}
                              className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground disabled:opacity-50"
                            >
                              <option value="created_at-desc">Newest First</option>
                              <option value="created_at-asc">Oldest First</option>
                              <option value="name-asc">Name (A-Z)</option>
                              <option value="name-desc">Name (Z-A)</option>
                              <option value="type-asc">Type (A-Z)</option>
                              <option value="status-asc">Status (A-Z)</option>
                            </select>

                            <select
                              value={groupBy}
                              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                              disabled={isLoading}
                              className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground disabled:opacity-50"
                            >
                              <option value="none">No Grouping</option>
                              <option value="type">Group by Type</option>
                              <option value="status">Group by Status</option>
                              <option value="date">Group by Date</option>
                            </select>
                          </>
                        )}

                        {/* View Toggle */}
                        <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                          <button
                            onClick={() => setViewMode('grid')}
                            disabled={isLoading}
                            className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'grid'
                                ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            title="Grid View"
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('table')}
                            disabled={isLoading}
                            className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'table'
                                ? 'bg-primary text-primary-foreground shadow-theme-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            title="Table View"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                          {activeFiltersCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (activeTab === 'reports') {
                                  setFilterStatus([]);
                                  setFilterType([]);
                                } else {
                                  setFilterScheduleStatus([]);
                                  setFilterFrequency([]);
                                }
                              }}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>

                        {activeTab === 'reports' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Status Filter */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                                Status
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['completed', 'pending', 'failed'].map(status => (
                                  <button
                                    key={status}
                                    onClick={() => setFilterStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterStatus.includes(status)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:border-primary'
                                      }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Type Filter */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                                Type
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['test_execution', 'bug_summary', 'coverage', 'performance'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setFilterType(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterType.includes(type)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:border-primary'
                                      }`}
                                  >
                                    {type.replace('_', ' ')}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Status Filter for Schedules */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                                Status
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['active', 'inactive'].map(status => (
                                  <button
                                    key={status}
                                    onClick={() => setFilterScheduleStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterScheduleStatus.includes(status)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:border-primary'
                                      }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Frequency Filter */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                                Frequency
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['daily', 'weekly', 'monthly', 'custom'].map(frequency => (
                                  <button
                                    key={frequency}
                                    onClick={() => setFilterFrequency(prev => prev.includes(frequency) ? prev.filter(f => f !== frequency) : [...prev, frequency])}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${filterFrequency.includes(frequency)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:border-primary'
                                      }`}
                                  >
                                    {frequency}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="pt-6">
                    {/* Empty States */}
                    {activeTab === 'reports' && filteredReports.length === 0 && reports.length === 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No reports yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md">
                          Generate your first report to get insights on test execution, bugs, coverage, and performance
                        </p>
                        <button
                          onClick={() => setIsGenerateOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
                          Generate Report
                        </button>
                      </div>
                    )}

                    {activeTab === 'schedules' && filteredSchedules.length === 0 && schedules.length === 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No schedules yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md">
                          Schedule reports to be automatically generated on a recurring basis
                        </p>
                        <button
                          onClick={() => setIsScheduleOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
                          Schedule Report
                        </button>
                      </div>
                    )}

                    {/* No Results After Filtering */}
                    {activeTab === 'reports' && filteredReports.length === 0 && reports.length > 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <Filter className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No reports found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Try adjusting your filters or search query
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterStatus([]);
                            setFilterType([]);
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}

                    {activeTab === 'schedules' && filteredSchedules.length === 0 && schedules.length > 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <Filter className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No schedules found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Try adjusting your filters or search query
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterScheduleStatus([]);
                            setFilterFrequency([]);
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}

                    {/* Content */}
                    {filteredReports.length > 0 && activeTab === 'reports' && (
                      groupBy === 'none' ? (
                        <ReportTable
                          reports={paginatedReports}
                          onView={setSelectedReport}
                          onRegenerate={regenerateReport}
                          onDelete={deleteReport}
                          generatingId={generating}
                          viewMode={viewMode}
                          selectedReports={selectedReportIds}
                          onSelectionChange={setSelectedReportIds}
                        />
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(groupedReports).map(([groupName, groupReports]) => (
                            <div key={groupName}>
                              <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-sm font-semibold text-foreground uppercase">{groupName}</h3>
                                <span className="text-xs text-muted-foreground">({groupReports.length})</span>
                              </div>
                              <ReportTable
                                reports={groupReports}
                                onView={setSelectedReport}
                                onRegenerate={regenerateReport}
                                onDelete={deleteReport}
                                generatingId={generating}
                                viewMode={viewMode}
                                selectedReports={selectedReportIds}
                                onSelectionChange={setSelectedReportIds}
                              />
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {filteredSchedules.length > 0 && activeTab === 'schedules' && (
                      <ScheduleTable
                        schedules={filteredSchedules}
                        onToggle={toggleSchedule}
                        onDelete={deleteSchedule}
                        onRunNow={runScheduleNow}
                        onEdit={handleEditSchedule}
                        viewMode={viewMode}
                        selectedSchedules={selectedScheduleIds}
                        onSelectionChange={setSelectedScheduleIds}
                      />
                    )}

                    {/* Pagination */}
                    {groupBy === 'none' && filteredReports.length > itemsPerPage && activeTab === 'reports' && (
                      <div className="mt-6">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={filteredReports.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={(page) => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onItemsPerPageChange={(items) => {
                            setItemsPerPage(items);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    )}
                  </div>
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