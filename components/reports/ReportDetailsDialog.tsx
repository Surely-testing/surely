// ============================================
// components/reports/ReportDetailsDialog.tsx
// Full report view with metrics and charts
// ============================================
'use client';

import { X, RefreshCw, Download, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportWithCreator } from '@/types/report.types';
import { format } from 'date-fns';

interface ReportDetailsDialogProps {
  report: ReportWithCreator;
  onClose: () => void;
  onRegenerate: () => void;
}

export function ReportDetailsDialog({
  report,
  onClose,
  onRegenerate,
}: ReportDetailsDialogProps) {
  const reportData = report.data as any;
  const metrics = reportData?.metrics || {};
  const period = reportData?.period;

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'test_coverage': return 'Test Coverage Report';
      case 'bug_trends': return 'Bug Trends Report';
      case 'sprint_summary': return 'Sprint Summary Report';
      case 'team_performance': return 'Team Performance Report';
      case 'custom': return 'Custom Report';
      default: return 'Report';
    }
  };

  const renderMetricCard = (label: string, value: any, color: string = 'text-foreground') => {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className={`text-2xl font-bold ${color}`}>
          {typeof value === 'number' ? value.toLocaleString() : value || '—'}
        </div>
      </div>
    );
  };

  const renderTestCoverageMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {renderMetricCard('Total Tests', metrics.totalTests)}
      {renderMetricCard('Passed', metrics.passedTests, 'text-success')}
      {renderMetricCard('Failed', metrics.failedTests, 'text-error')}
      {renderMetricCard('Coverage', `${metrics.coveragePercentage}%`, 'text-primary')}
    </div>
  );

  const renderBugTrendsMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {renderMetricCard('Total Bugs', metrics.totalBugs)}
      {renderMetricCard('Open', metrics.openBugs, 'text-error')}
      {renderMetricCard('Resolved', metrics.resolvedBugs, 'text-success')}
      {renderMetricCard('Critical', metrics.criticalBugs, 'text-warning')}
    </div>
  );

  const renderSprintMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {renderMetricCard('Velocity', metrics.sprintVelocity)}
      {renderMetricCard('Completed Stories', metrics.completedStories, 'text-success')}
      {renderMetricCard('In Progress', metrics.inProgressStories, 'text-info')}
    </div>
  );

  const renderTeamMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {renderMetricCard('Team Members', metrics.teamMembers)}
      {renderMetricCard('Active Members', metrics.activeMembers, 'text-success')}
      {renderMetricCard('Avg Contribution', metrics.avgContribution)}
    </div>
  );

  const renderMetrics = () => {
    switch (report.type) {
      case 'test_coverage':
        return renderTestCoverageMetrics();
      case 'bug_trends':
        return renderBugTrendsMetrics();
      case 'sprint_summary':
        return renderSprintMetrics();
      case 'team_performance':
        return renderTeamMetrics();
      default:
        return (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No metrics available
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-4xl w-full my-8">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {report.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                  {getReportTypeLabel(report.type)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {report.creator && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{report.creator.name}</span>
                  </div>
                )}
                {report.created_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Generated {format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Period */}
          {period && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Report Period
              </div>
              <div className="text-sm text-foreground">
                {format(new Date(period.start), 'MMM d, yyyy')} — {format(new Date(period.end), 'MMM d, yyyy')}
              </div>
            </div>
          )}

          {/* Summary */}
          {reportData?.summary && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {reportData.summary}
              </p>
            </div>
          )}

          {/* Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Key Metrics</h3>
            {renderMetrics()}
          </div>

          {/* Insights */}
          {reportData?.insights && reportData.insights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Insights</h3>
              <ul className="space-y-2">
                {reportData.insights.map((insight: string, index: number) => (
                  <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary shrink-0">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {reportData?.recommendations && reportData.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {reportData.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-success shrink-0">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-2">
          <Button
            variant="outline"
            onClick={onRegenerate}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="outline"
            onClick={() => alert('Download feature coming soon')}
            className="flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none ml-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}