// ============================================
// components/reports/ReportsView.tsx
// Main container with tabs: Reports | Schedules
// Mobile-first responsive with system colors
// ============================================
'use client';

import { useState } from 'react';
import { Plus, Calendar, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportTable } from '@/components/reports/ReportsTable';
import { ScheduleTable } from '@/components/reports/ScheduleTable';
import { GenerateReportDialog } from '@/components/reports/GenerateReportDialog';
import { ScheduleReportDialog } from '@/components/reports/ScheduleReportDialog';
import { ReportDetailsDialog } from '@/components/reports/ReportDetailsDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useReports } from '@/lib/hooks/useReports';
import { useReportSchedules } from '@/lib/hooks/useReportSchedules';
import { ReportWithCreator, ReportScheduleWithReport } from '@/types/report.types';

interface ReportsViewProps {
  suiteId: string;
}

type TabType = 'reports' | 'schedules';

export function ReportsView({ suiteId }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportWithCreator | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ReportScheduleWithReport | null>(null);

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
  };

  const handleGenerateReport = async (formData: any) => {
    await generateReport(formData);
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

  const isLoading = activeTab === 'reports' ? reportsLoading : schedulesLoading;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section - Mobile First */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs Navigation - Scrollable on mobile */}
        <div className="border-b border-border overflow-x-auto">
          <nav className="flex gap-4 sm:gap-6 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-1 py-2 sm:py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {activeTab === 'reports' ? (
            <Button
              size="sm"
              onClick={() => setIsGenerateOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsScheduleOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="space-y-3">
            {/* Table Header Skeleton */}
            <div className="px-4 py-2 bg-muted/50 rounded-lg border border-border">
              <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-24" />
                ))}
              </div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="grid grid-cols-5 gap-4 items-center">
                    {/* Report Name Column */}
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>

                    {/* Type Column */}
                    <div>
                      <Skeleton className="h-6 w-28 rounded-full" />
                    </div>

                    {/* Creator Column */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Date Column */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>

                    {/* Actions Column */}
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'reports' && (
              <ReportTable
                reports={reports}
                onView={setSelectedReport}
                onRegenerate={regenerateReport}
                onDelete={deleteReport}
                generatingId={generating}
              />
            )}
            {activeTab === 'schedules' && (
              <ScheduleTable
                schedules={schedules}
                onToggle={toggleSchedule}
                onDelete={deleteSchedule}
                onRunNow={runScheduleNow}
                onEdit={handleEditSchedule}
              />
            )}
          </>
        )}
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
    </div>
  );
}