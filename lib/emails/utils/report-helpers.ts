// ============================================
// FILE: lib/email/utils/report-helpers.ts
// Shared utility functions for report handling
// ============================================

/**
 * Determines if a report is empty based on its type and metrics
 */
export function isReportEmpty(reportData: any, reportType: string): boolean {
  switch (reportType) {
    case 'test_coverage':
      return reportData.metrics.totalTests === 0;
    
    case 'bug_trends':
      return reportData.metrics.totalBugs === 0;
    
    case 'custom':
      // Custom reports are empty only if ALL sections have no data
      return (reportData.metrics.totalTests === 0 || reportData.metrics.totalTests === undefined) &&
             (reportData.metrics.totalBugs === 0 || reportData.metrics.totalBugs === undefined);
    
    case 'sprint_summary':
    case 'team_performance':
      // These are "coming soon" - always send to avoid confusion
      return false;
    
    default:
      return false;
  }
}