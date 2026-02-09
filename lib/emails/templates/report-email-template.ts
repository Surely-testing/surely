// ============================================
// FILE: lib/email/templates/report-email-template.ts
// Shared email template for both manual and automated reports
// ============================================

import { LOGO_URL, APP_NAME, SUPPORT_EMAIL } from '@/config/logo';

interface ReportEmailTemplateProps {
  reportType: string;
  suiteName: string;
  data: any;
  frequency: string;
  isManualRun?: boolean;
}

export function generateReportEmailTemplate({
  reportType,
  suiteName,
  data,
  frequency,
  isManualRun = false,
}: ReportEmailTemplateProps): string {
  const reportTypeNames: Record<string, string> = {
    test_coverage: 'Test Coverage Report',
    bug_trends: 'Bug Trends Analysis',
    sprint_summary: 'Sprint Summary',
    team_performance: 'Team Performance Review',
    custom: 'Custom Report',
  };

  const reportName = reportTypeNames[reportType] || 'Report';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const periodText = `${formatDate(data.period.start)} - ${formatDate(data.period.end)}`;

  // Generate actionable recommendations based on metrics
  const recommendations = generateRecommendations(reportType, data.metrics);
  const statusIndicator = getStatusIndicator(reportType, data.metrics);

  // Logo configuration - use config file first, fallback to environment
  // For email compatibility, we need the full absolute URL
  let logoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  
  // If no environment variable, construct from LOGO_URL constant
  if (!logoUrl) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    // If LOGO_URL is a relative path (starts with /), prepend base URL
    if (LOGO_URL.startsWith('/')) {
      logoUrl = `${baseUrl}${LOGO_URL}`;
    } else {
      // If LOGO_URL is already absolute (https://...), use as is
      logoUrl = LOGO_URL;
    }
  }
  
  const appName = process.env.NEXT_PUBLIC_APP_NAME || APP_NAME;
  const supportEmail = process.env.SUPPORT_EMAIL || SUPPORT_EMAIL;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #18181B;
            background-color: #F4F4F5;
            padding: 0;
            margin: 0;
          }
          
          .container { 
            max-width: 100%;
            width: 100%;
            margin: 0 auto; 
            background: #FFFFFF;
          }
          
          /* Header - Using primary theme colors */
          .header { 
            background: linear-gradient(135deg, #326FF7 0%, #4D84F9 100%);
            color: white; 
            padding: 32px 24px;
            text-align: center;
          }
          
          .header-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 12px;
            display: inline-block;
          }
          
          .header h1 { 
            font-size: 26px; 
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
          }
          
          .header .suite-name { 
            font-size: 15px; 
            opacity: 0.95;
            font-weight: 500;
            margin-top: 6px;
          }
          
          .badges {
            display: flex;
            gap: 8px;
            margin-top: 14px;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            backdrop-filter: blur(10px);
          }
          
          .quick-report-badge {
            background: linear-gradient(135deg, #F7A332 0%, #FFB84D 100%);
          }
          
          /* Status Indicator */
          .status-indicator {
            margin-top: 16px;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
          }
          
          .status-excellent { 
            background: rgba(53, 214, 139, 0.15); 
            color: #065f46; 
            border: 2px solid #35D68B; 
          }
          
          .status-good { 
            background: rgba(50, 111, 247, 0.15); 
            color: #1e3a8a; 
            border: 2px solid #326FF7; 
          }
          
          .status-warning { 
            background: rgba(247, 163, 50, 0.15); 
            color: #78350f; 
            border: 2px solid #F7A332; 
          }
          
          .status-critical { 
            background: rgba(241, 85, 85, 0.15); 
            color: #7f1d1d; 
            border: 2px solid #F15555; 
          }
          
          /* Content */
          .content { 
            padding: 28px 24px;
          }
          
          /* Executive Summary */
          .executive-summary {
            background: linear-gradient(135deg, #EFF5FF 0%, #DBE9FE 100%);
            border-left: 4px solid #326FF7;
            padding: 20px;
            margin-bottom: 24px;
            border-radius: 8px;
            width: 100%;
          }
          
          .executive-summary h2 {
            font-size: 16px;
            color: #1D57D2;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .executive-summary p {
            color: #27272A;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 6px;
          }
          
          .executive-summary .period {
            font-size: 12px;
            color: #326FF7;
            font-weight: 600;
            margin-top: 10px;
          }
          
          /* Metrics Section */
          .metrics-section {
            margin-bottom: 24px;
            width: 100%;
          }
          
          .metrics-section h2 {
            font-size: 18px;
            color: #18181B;
            margin-bottom: 16px;
            font-weight: 700;
          }
          
          /* Metrics Table - Full Width */
          .metrics-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 24px;
          }
          
          .metrics-table td {
            background: linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);
            padding: 20px 16px;
            border: 2px solid #E4E4E7;
            text-align: center;
            transition: all 0.3s ease;
          }
          
          .metrics-table td:first-child {
            border-radius: 8px 0 0 8px;
          }
          
          .metrics-table td:last-child {
            border-radius: 0 8px 8px 0;
          }
          
          .metric-header {
            font-size: 10px;
            text-transform: uppercase;
            color: #71717A;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
            display: block;
          }
          
          .metric-value {
            font-size: 32px;
            font-weight: 800;
            color: #326FF7;
            line-height: 1;
            margin-bottom: 6px;
            display: block;
          }
          
          .metric-label {
            font-size: 11px;
            color: #71717A;
            font-weight: 500;
            display: block;
          }
          
          /* Insights Section */
          .insights-section {
            margin-top: 24px;
            width: 100%;
          }
          
          .insights-section h2 {
            font-size: 18px;
            font-weight: 700;
            color: #18181B;
            margin-bottom: 14px;
          }
          
          .insight-item {
            background: linear-gradient(135deg, #EFF5FF 0%, #FFFFFF 100%);
            border-left: 3px solid #326FF7;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
            font-size: 13px;
            color: #27272A;
            line-height: 1.5;
            width: 100%;
          }
          
          /* Recommendations Section */
          .recommendations-section {
            background: linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);
            border-radius: 8px;
            padding: 20px;
            margin-top: 24px;
            border: 2px solid #F7A332;
            width: 100%;
          }
          
          .recommendations-section h2 {
            font-size: 18px;
            font-weight: 700;
            color: #78350f;
            margin-bottom: 14px;
          }
          
          .recommendation-item {
            background: white;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 3px solid #F7A332;
            font-size: 13px;
            color: #27272A;
            line-height: 1.5;
            width: 100%;
          }
          
          .recommendation-item:last-child {
            margin-bottom: 0;
          }
          
          .recommendation-item strong {
            color: #78350f;
            font-weight: 700;
          }
          
          /* CTA Section */
          .cta-section {
            text-align: center;
            margin-top: 28px;
            padding-top: 24px;
            border-top: 2px solid #E4E4E7;
            width: 100%;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #326FF7 0%, #4D84F9 100%);
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(50, 111, 247, 0.3);
            transition: all 0.3s ease;
          }
          
          /* Footer */
          .footer { 
            background: #F9FAFB;
            padding: 28px 24px;
            text-align: center;
            border-top: 2px solid #E4E4E7;
          }
          
          .footer p { 
            color: #71717A; 
            font-size: 12px;
            margin-bottom: 8px;
            line-height: 1.5;
          }
          
          .footer a {
            color: #326FF7;
            text-decoration: none;
            font-weight: 600;
          }
          
          .footer .branding {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #E4E4E7;
          }
          
          .footer .branding p {
            font-size: 11px;
            color: #A1A1AA;
          }
          
          .footer-logo {
            max-width: 100px;
            height: auto;
            margin-bottom: 12px;
            opacity: 0.7;
          }
          
          /* Responsive Design */
          @media only screen and (max-width: 600px) {
            .header {
              padding: 24px 20px;
            }
            
            .header h1 {
              font-size: 22px;
            }
            
            .content {
              padding: 20px 16px;
            }
            
            .metrics-table {
              display: block;
              overflow-x: auto;
            }
            
            .metrics-table td {
              min-width: 100px;
            }
            
            .metric-value {
              font-size: 24px;
            }
            
            .footer {
              padding: 20px 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${appName} Logo" class="header-logo" style="display: block; margin: 0 auto 12px auto; max-width: 120px; height: auto;" />` : `<div style="font-size: 24px; font-weight: 800; margin-bottom: 12px;">${appName}</div>`}
            <h1>${reportName}</h1>
            <p class="suite-name">${suiteName}</p>
            <div class="badges">
              <span class="badge">${frequency.toUpperCase()}</span>
              ${isManualRun ? '<span class="badge quick-report-badge">QUICK REPORT</span>' : ''}
            </div>
            <div class="status-indicator ${statusIndicator.class}">
              ${statusIndicator.message}
            </div>
          </div>

          <div class="content">
            <div class="executive-summary">
              <h2>Executive Summary</h2>
              <p>${data.summary}</p>
              ${isManualRun ? '<p><strong>Note:</strong> This report was manually triggered and reflects real-time data.</p>' : ''}
              <p class="period">Reporting Period: ${periodText}</p>
            </div>

            <div class="metrics-section">
              <h2>Key Metrics</h2>
              ${generateMetricsHTML(reportType, data.metrics)}
            </div>

            ${data.insights && data.insights.length > 0 ? `
              <div class="insights-section">
                <h2>Key Insights</h2>
                ${data.insights.map((insight: string) => `
                  <div class="insight-item">${insight}</div>
                `).join('')}
              </div>
            ` : ''}

            ${recommendations.length > 0 ? `
              <div class="recommendations-section">
                <h2>Recommended Actions</h2>
                ${recommendations.map((rec: string) => `
                  <div class="recommendation-item">${rec}</div>
                `).join('')}
              </div>
            ` : ''}

            <div class="cta-section">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports" class="cta-button">
                View Full Dashboard
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>What's Next?</strong> Review the recommendations above and take action to improve your quality metrics.</p>
            <p>Questions about this report? <a href="mailto:${supportEmail}">Contact Support</a></p>
            <div class="branding">
              ${logoUrl ? `<img src="${logoUrl}" alt="${appName} Logo" class="footer-logo" style="display: block; margin: 0 auto 12px auto; max-width: 100px; height: auto; opacity: 0.7;" />` : ''}
              <p>
                This ${isManualRun ? 'quick' : frequency} report was generated automatically by ${appName}<br>
                To manage your report schedules, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports">Dashboard</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ============================================
// Helper Functions
// ============================================

function generateRecommendations(reportType: string, metrics: any): string[] {
  const recommendations: string[] = [];

  switch (reportType) {
    case 'test_coverage':
      if (metrics.coveragePercentage < 70) {
        recommendations.push('<strong>Priority:</strong> Test coverage is below 70%. Consider adding more test cases to critical user flows and edge cases.');
      }
      if (metrics.failedTests > 0) {
        recommendations.push(`<strong>Action Required:</strong> ${metrics.failedTests} test(s) are failing. Review and fix these tests to prevent regression issues.`);
      }
      if (metrics.totalTests === 0) {
        recommendations.push('<strong>Get Started:</strong> No tests found in this period. Begin by creating test cases for your most critical features.');
      }
      if (metrics.coveragePercentage >= 80 && metrics.failedTests === 0) {
        recommendations.push('<strong>Great Work!</strong> Excellent test coverage and all tests passing. Consider adding performance and load testing next.');
      }
      break;

    case 'bug_trends':
      if (metrics.criticalUnresolved > 0) {
        recommendations.push(`<strong>Critical:</strong> ${metrics.criticalUnresolved} critical bug(s) need immediate attention. Prioritize these in your next sprint.`);
      }
      if (metrics.openBugs > 10) {
        recommendations.push('<strong>Backlog Review:</strong> High number of open bugs detected. Schedule a bug triage session to prioritize and close stale issues.');
      }
      if (metrics.totalBugs > 0 && (metrics.resolvedBugs / metrics.totalBugs) < 0.5) {
        recommendations.push('<strong>Resolution Focus:</strong> Less than 50% of bugs are resolved. Allocate more resources to bug fixing in upcoming sprints.');
      }
      if (metrics.totalBugs === 0) {
        recommendations.push('<strong>Clean Slate:</strong> No bugs tracked in this period. Maintain this momentum with rigorous testing and early detection.');
      }
      if (metrics.criticalUnresolved === 0 && metrics.openBugs < 5) {
        recommendations.push('<strong>Healthy Status:</strong> Bug count is under control. Continue current quality practices and monitoring.');
      }
      break;

    case 'custom':
      if (metrics.coveragePercentage < 70) {
        recommendations.push('<strong>Testing:</strong> Improve test coverage to reduce production bugs.');
      }
      if (metrics.criticalUnresolved > 0) {
        recommendations.push(`<strong>Urgent:</strong> Address ${metrics.criticalUnresolved} critical bug(s) immediately.`);
      }
      if (metrics.totalTests > 0 && metrics.totalBugs === 0) {
        recommendations.push('<strong>Excellent:</strong> Strong testing practices are preventing bugs from reaching production.');
      }
      break;
  }

  // Add general recommendations if no specific ones
  if (recommendations.length === 0) {
    recommendations.push('<strong>Maintain Momentum:</strong> Your quality metrics look good. Keep up the excellent work and continue monitoring trends.');
    recommendations.push('<strong>Next Steps:</strong> Consider expanding your test coverage to include edge cases and integration scenarios.');
  }

  return recommendations;
}

function getStatusIndicator(reportType: string, metrics: any): { class: string; message: string } {
  let score = 0;
  let total = 0;

  switch (reportType) {
    case 'test_coverage':
      if (metrics.totalTests > 0) {
        score += metrics.coveragePercentage >= 80 ? 2 : metrics.coveragePercentage >= 60 ? 1 : 0;
        total += 2;
        score += metrics.failedTests === 0 ? 1 : 0;
        total += 1;
      }
      break;

    case 'bug_trends':
      if (metrics.totalBugs > 0) {
        const resolutionRate = metrics.resolvedBugs / metrics.totalBugs;
        score += resolutionRate >= 0.7 ? 2 : resolutionRate >= 0.5 ? 1 : 0;
        total += 2;
        score += metrics.criticalUnresolved === 0 ? 1 : 0;
        total += 1;
      }
      break;

    case 'custom':
      if (metrics.totalTests > 0) score += metrics.coveragePercentage >= 70 ? 1 : 0;
      total += 1;
      if (metrics.totalBugs > 0) score += metrics.criticalUnresolved === 0 ? 1 : 0;
      total += 1;
      break;
  }

  if (total === 0) {
    return { class: 'status-good', message: 'Report Generated - Review data to establish baseline' };
  }

  const percentage = (score / total) * 100;

  if (percentage >= 80) {
    return { class: 'status-excellent', message: 'Excellent - Quality metrics are strong' };
  } else if (percentage >= 60) {
    return { class: 'status-good', message: 'Good - Minor improvements recommended' };
  } else if (percentage >= 40) {
    return { class: 'status-warning', message: 'Attention Needed - Several areas require improvement' };
  } else {
    return { class: 'status-critical', message: 'Critical - Immediate action required' };
  }
}

function generateMetricsHTML(reportType: string, metrics: any): string {
  switch (reportType) {
    case 'test_coverage':
      return `
        <table class="metrics-table">
          <tr>
            <td>
              <span class="metric-header">Total Tests</span>
              <span class="metric-value">${metrics.totalTests || 0}</span>
            </td>
            <td>
              <span class="metric-header">Pass Rate</span>
              <span class="metric-value">${metrics.coveragePercentage || 0}%</span>
            </td>
            <td>
              <span class="metric-header">Passed</span>
              <span class="metric-value" style="color: #35D68B;">${metrics.passedTests || 0}</span>
              <span class="metric-label" style="color: #35D68B;">Passed</span>
            </td>
            <td>
              <span class="metric-header">Failed</span>
              <span class="metric-value" style="color: #F15555;">${metrics.failedTests || 0}</span>
              <span class="metric-label" style="color: #F15555;">Failed</span>
            </td>
          </tr>
        </table>
      `;

    case 'bug_trends':
      return `
        <table class="metrics-table">
          <tr>
            <td>
              <span class="metric-header">Total Bugs</span>
              <span class="metric-value">${metrics.totalBugs || 0}</span>
            </td>
            <td>
              <span class="metric-header">Resolution Rate</span>
              <span class="metric-value">${metrics.totalBugs > 0
                  ? Math.round((metrics.resolvedBugs / metrics.totalBugs) * 100)
                  : 0
              }%</span>
            </td>
            <td>
              <span class="metric-header">Open Bugs</span>
              <span class="metric-value" style="color: #F7A332;">${metrics.openBugs || 0}</span>
              <span class="metric-label" style="color: #F7A332;">Needs attention</span>
            </td>
            <td>
              <span class="metric-header">Critical</span>
              <span class="metric-value" style="color: #F15555;">${metrics.criticalUnresolved || 0}</span>
              <span class="metric-label" style="color: #F15555;">Unresolved</span>
            </td>
          </tr>
        </table>
      `;

    case 'custom':
      return `
        <table class="metrics-table">
          <tr>
            <td>
              <span class="metric-header">Total Tests</span>
              <span class="metric-value">${metrics.totalTests || 0}</span>
            </td>
            <td>
              <span class="metric-header">Pass Rate</span>
              <span class="metric-value">${metrics.coveragePercentage || 0}%</span>
            </td>
            <td>
              <span class="metric-header">Total Bugs</span>
              <span class="metric-value">${metrics.totalBugs || 0}</span>
            </td>
            <td>
              <span class="metric-header">Critical Bugs</span>
              <span class="metric-value" style="color: #F15555;">${metrics.criticalUnresolved || 0}</span>
              <span class="metric-label" style="color: #F15555;">Unresolved</span>
            </td>
          </tr>
        </table>
      `;

    default:
      return '';
  }
}