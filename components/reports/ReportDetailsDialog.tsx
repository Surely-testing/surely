// ============================================
// components/reports/ReportDetailsDialog.tsx
// Full report view with metrics, charts, and PDF export
// ============================================
'use client';

import { X, RefreshCw, Download, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportMetricsChart } from '@/components/reports/ReportMetricsChart';
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
    const labels: Record<string, string> = {
      test_coverage: 'Test Coverage Report',
      bug_trends: 'Bug Trends Report',
      sprint_summary: 'Sprint Summary Report',
      team_performance: 'Team Performance Report',
      custom: 'Custom Report'
    };
    return labels[type] || 'Report';
  };

  const generateSummary = () => {
    switch (report.type) {
      case 'bug_trends':
        return `Tracked ${metrics.totalBugs || 0} bugs with ${metrics.openBugs || 0} open, ${metrics.resolvedBugs || 0} resolved, and ${metrics.criticalBugs || 0} critical (${metrics.criticalResolved || 0} resolved, ${metrics.criticalUnresolved || 0} needing attention).`;
      
      case 'test_coverage':
        return `Total of ${metrics.totalTests || 0} tests with ${metrics.passedTests || 0} passed and ${metrics.failedTests || 0} failed. Coverage at ${metrics.coveragePercentage || 0}%.`;
      
      case 'sprint_summary':
        return `Sprint velocity of ${metrics.sprintVelocity || 0} with ${metrics.completedStories || 0} stories completed and ${metrics.inProgressStories || 0} in progress.`;
      
      case 'team_performance':
        return `Team of ${metrics.teamMembers || 0} members with ${metrics.activeMembers || 0} active contributors. Average contribution: ${metrics.avgContribution || 0}.`;
      
      default:
        return reportData?.summary || 'No summary available';
    }
  };

  const downloadPDF = async () => {
    const button = document.querySelector('[data-pdf-btn]') as HTMLButtonElement;
    
    try {
      if (button) {
        button.disabled = true;
        button.textContent = 'Generating PDF...';
      }

      const html2pdf = await loadHtml2Pdf();
      
      const pdfElement = document.createElement('div');
      pdfElement.innerHTML = generatePDFContent();
      pdfElement.style.width = '800px';
      pdfElement.style.padding = '40px';
      pdfElement.style.background = 'white';
      pdfElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      const opt = {
        margin: 0.5,
        filename: `${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(pdfElement).save();
      
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;margin-right:8px;vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Download PDF';
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
      
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;margin-right:8px;vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Download PDF';
      }
    }
  };

  const loadHtml2Pdf = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => reject(new Error('Failed to load PDF library'));
      document.head.appendChild(script);
    });
  };

  const generatePDFContent = () => {
    const typeLabel = getReportTypeLabel(report.type);
    const periodText = period 
      ? `${format(new Date(period.start), 'MMM d, yyyy')} — ${format(new Date(period.end), 'MMM d, yyyy')}`
      : 'N/A';
    const summary = generateSummary();

    let metricsHTML = '';
    
    switch (report.type) {
      case 'test_coverage':
        metricsHTML = `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Total Tests</div>
              <div style="font-size: 24px; font-weight: bold;">${metrics.totalTests || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Coverage</div>
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${metrics.coveragePercentage || 0}%</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Passed</div>
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${metrics.passedTests || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Failed</div>
              <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${metrics.failedTests || 0}</div>
            </div>
          </div>
        `;
        break;
      
      case 'bug_trends':
        metricsHTML = `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Total Bugs</div>
              <div style="font-size: 24px; font-weight: bold;">${metrics.totalBugs || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Critical</div>
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${metrics.criticalBugs || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Open</div>
              <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${metrics.openBugs || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Resolved</div>
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${metrics.resolvedBugs || 0}</div>
            </div>
          </div>
          ${metrics.criticalResolved !== undefined ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
              <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Critical Resolved</div>
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${metrics.criticalResolved || 0}</div>
              </div>
              <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Critical Needing Attention</div>
                <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${metrics.criticalUnresolved || 0}</div>
              </div>
            </div>
          ` : ''}
        `;
        break;
      
      case 'sprint_summary':
        metricsHTML = `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Velocity</div>
              <div style="font-size: 24px; font-weight: bold;">${metrics.sprintVelocity || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Completed Stories</div>
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${metrics.completedStories || 0}</div>
            </div>
          </div>
        `;
        break;
      
      case 'team_performance':
        metricsHTML = `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Team Members</div>
              <div style="font-size: 24px; font-weight: bold;">${metrics.teamMembers || 0}</div>
            </div>
            <div style="padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Active Members</div>
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${metrics.activeMembers || 0}</div>
            </div>
          </div>
        `;
        break;
    }

    const insightsHTML = reportData?.insights?.length > 0 
      ? `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Insights</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${reportData.insights.map((insight: string) => `
              <li style="margin-bottom: 8px; color: #4b5563;">${insight}</li>
            `).join('')}
          </ul>
        </div>
      `
      : '';

    const recommendationsHTML = reportData?.recommendations?.length > 0 
      ? `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Recommendations</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${reportData.recommendations.map((rec: string) => `
              <li style="margin-bottom: 8px; color: #4b5563;">${rec}</li>
            `).join('')}
          </ul>
        </div>
      `
      : '';

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px;">
        <div style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
          <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 8px 0; color: #111827;">
            ${report.name}
          </h1>
          <div style="display: flex; gap: 16px; font-size: 12px; color: #6b7280; flex-wrap: wrap;">
            <span style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-weight: 500;">
              ${typeLabel}
            </span>
            ${report.creator ? `<span>Created by ${report.creator.name}</span>` : ''}
            ${report.created_at ? `<span>Generated ${format(new Date(report.created_at), 'MMM d, yyyy')}</span>` : ''}
          </div>
        </div>

        ${period ? `
          <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Report Period</div>
            <div style="font-size: 14px; font-weight: 500;">${periodText}</div>
          </div>
        ` : ''}

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Summary</h3>
          <p style="margin: 0; color: #4b5563; line-height: 1.6;">${summary}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Key Metrics</h3>
          ${metricsHTML}
        </div>

        ${insightsHTML}
        ${recommendationsHTML}

        <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center;">
          Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
        </div>
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-4xl w-full my-8">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4 mb-3">
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPDF}
              data-pdf-btn
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
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
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {generateSummary()}
            </p>
          </div>

          {/* Metrics and Charts - Using the new component */}
          <ReportMetricsChart type={report.type} metrics={metrics} />

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

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}