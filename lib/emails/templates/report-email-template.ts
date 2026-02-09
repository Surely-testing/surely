// ============================================
// FILE: lib/email/templates/report-email-template.ts
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

  // Logo configuration
  let logoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  if (!logoUrl) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    if (LOGO_URL.startsWith('/')) {
      logoUrl = `${baseUrl}${LOGO_URL}`;
    } else {
      logoUrl = LOGO_URL;
    }
  }
  
  const appName = process.env.NEXT_PUBLIC_APP_NAME || APP_NAME;
  const supportEmail = process.env.SUPPORT_EMAIL || SUPPORT_EMAIL;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports`;

  // Status indicator colors
  const statusColors = {
    'status-excellent': { bg: 'rgba(53, 214, 139, 0.15)', border: '#35D68B', text: '#065f46' },
    'status-good': { bg: 'rgba(50, 111, 247, 0.15)', border: '#326FF7', text: '#1e3a8a' },
    'status-warning': { bg: 'rgba(247, 163, 50, 0.15)', border: '#F7A332', text: '#78350f' },
    'status-critical': { bg: 'rgba(241, 85, 85, 0.15)', border: '#F15555', text: '#7f1d1d' },
  };

  const statusStyle = statusColors[statusIndicator.class as keyof typeof statusColors];

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table {border-collapse: collapse;}
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    p { display: block; margin: 13px 0; }
    
    /* Responsive styles */
    @media only screen and (max-width: 740px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .desktop-metrics { display: none !important; }
      .mobile-metrics { display: table !important; width: 100% !important; }
      .content-padding { padding: 24px 16px !important; }
      .header-padding { padding: 28px 16px !important; }
    }
    
    @media only screen and (max-width: 480px) {
      .content-padding { padding: 20px 12px !important; }
      .header-padding { padding: 24px 12px !important; }
      .outer-padding { padding: 10px 5px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#f4f4f5;">
  
  <!-- Outer wrapper table -->
  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#f4f4f5;">
    <tr>
      <td align="center" class="outer-padding" style="padding:20px 5px;">
        
        <!-- Main email container - 720px width for maximum content space -->
        <table role="presentation" class="email-container" style="width:720px;max-width:720px;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
          
          <!-- HEADER SECTION -->
          <tr>
            <td align="center" class="header-padding" style="padding:32px 24px;background-color:#326FF7;background-image:linear-gradient(135deg, #326FF7 0%, #4D84F9 100%);">
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
                
                <!-- Logo -->
                ${logoUrl ? `
                <tr>
                  <td align="center" style="padding:0 0 12px 0;">
                    <img src="${logoUrl}" alt="${appName}" width="120" style="height:auto;display:block;border:0;max-width:120px;" />
                  </td>
                </tr>
                ` : ''}
                
                <!-- Report Title -->
                <tr>
                  <td align="center" style="padding:0 0 8px 0;color:#ffffff;font-size:26px;line-height:30px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    ${reportName}
                  </td>
                </tr>
                
                <!-- Suite Name -->
                <tr>
                  <td align="center" style="padding:0 0 14px 0;color:#ffffff;font-size:15px;line-height:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;opacity:0.95;">
                    ${suiteName}
                  </td>
                </tr>
                
                <!-- Badges -->
                <tr>
                  <td align="center" style="padding:0 0 16px 0;">
                    <table role="presentation" style="border-collapse:collapse;border:0;border-spacing:0;">
                      <tr>
                        <td style="padding:6px 12px;background-color:rgba(255,255,255,0.2);border-radius:20px;color:#ffffff;font-size:11px;line-height:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                          ${frequency.toUpperCase()}
                        </td>
                        ${isManualRun ? `
                        <td width="8"></td>
                        <td style="padding:6px 12px;background-color:#F7A332;background-image:linear-gradient(135deg, #F7A332 0%, #FFB84D 100%);border-radius:20px;color:#ffffff;font-size:11px;line-height:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                          QUICK REPORT
                        </td>
                        ` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Status Indicator -->
                <tr>
                  <td align="center" style="padding:0;">
                    <table role="presentation" style="border-collapse:collapse;border:0;border-spacing:0;">
                      <tr>
                        <td style="padding:12px 16px;background-color:${statusStyle.bg};border:2px solid ${statusStyle.border};border-radius:8px;color:${statusStyle.text};font-size:13px;line-height:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                          ${statusIndicator.message}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- CONTENT SECTION -->
          <tr>
            <td class="content-padding" style="padding:32px 28px;">
              
              <!-- Executive Summary -->
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#EFF5FF;background-image:linear-gradient(135deg, #EFF5FF 0%, #DBE9FE 100%);border-left:4px solid #326FF7;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <h2 style="margin:0 0 10px 0;padding:0;color:#1D57D2;font-size:16px;line-height:20px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                      Executive Summary
                    </h2>
                    <p style="margin:0 0 6px 0;padding:0;color:#27272A;font-size:14px;line-height:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                      ${data.summary}
                    </p>
                    ${isManualRun ? `
                    <p style="margin:6px 0;padding:0;color:#27272A;font-size:14px;line-height:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                      <strong>Note:</strong> This report was manually triggered and reflects real-time data.
                    </p>
                    ` : ''}
                    <p style="margin:10px 0 0 0;padding:0;color:#326FF7;font-size:12px;line-height:16px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                      Reporting Period: ${periodText}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Key Metrics Section -->
              <h2 style="margin:0 0 18px 0;padding:0;color:#18181B;font-size:18px;line-height:24px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                Key Metrics
              </h2>
              
              ${generateMetricsHTML(reportType, data.metrics)}
              
              <!-- Key Insights Section -->
              ${data.insights && data.insights.length > 0 ? `
              <h2 style="margin:28px 0 16px 0;padding:0;color:#18181B;font-size:18px;line-height:24px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                Key Insights
              </h2>
              ${data.insights.map((insight: string) => `
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#EFF5FF;background-image:linear-gradient(135deg, #EFF5FF 0%, #FFFFFF 100%);border-left:3px solid #326FF7;border-radius:6px;margin-bottom:10px;">
                <tr>
                  <td style="padding:14px 18px;color:#27272A;font-size:13px;line-height:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    ${insight}
                  </td>
                </tr>
              </table>
              `).join('')}
              ` : ''}
              
              <!-- Recommendations Section -->
              ${recommendations.length > 0 ? `
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#FFF4E6;background-image:linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);border:2px solid #F7A332;border-radius:8px;margin-top:28px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <h2 style="margin:0 0 16px 0;padding:0;color:#78350f;font-size:18px;line-height:24px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                      Recommended Actions
                    </h2>
                    ${recommendations.map((rec: string) => `
                    <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;border-left:3px solid #F7A332;border-radius:6px;margin-bottom:10px;">
                      <tr>
                        <td style="padding:14px 18px;color:#27272A;font-size:13px;line-height:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                          ${rec}
                        </td>
                      </tr>
                    </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- CTA Button Section -->
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;margin-top:32px;padding-top:28px;">
                <tr>
                  <td align="center" style="padding:0;">
                    <table role="presentation" style="border-collapse:collapse;border:0;border-spacing:0;">
                      <tr>
                        <td style="border-radius:8px;background-color:#326FF7;background-image:linear-gradient(135deg, #326FF7 0%, #4D84F9 100%);">
                          <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;line-height:18px;font-weight:700;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                            View Full Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- FOOTER SECTION -->
          <tr>
            <td style="padding:28px 24px;background:#F9FAFB;border-top:2px solid #E4E4E7;">
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
                <tr>
                  <td align="center" style="padding:0 0 8px 0;color:#71717A;font-size:12px;line-height:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    <strong>What's Next?</strong> Review the recommendations above and take action to improve your quality metrics.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 16px 0;color:#71717A;font-size:12px;line-height:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                    Questions about this report? <a href="mailto:${supportEmail}" style="color:#326FF7;text-decoration:none;font-weight:600;">Contact Support</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:16px 0 0 0;border-top:1px solid #E4E4E7;">
                    ${logoUrl ? `
                    <img src="${logoUrl}" alt="${appName}" width="100" style="height:auto;display:block;border:0;max-width:100px;opacity:0.7;margin:0 auto 12px auto;" />
                    ` : ''}
                    <p style="margin:0;padding:0;color:#A1A1AA;font-size:11px;line-height:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                      This ${isManualRun ? 'quick' : frequency} report was generated automatically by ${appName}<br>
                      To manage your report schedules, visit your <a href="${dashboardUrl}" style="color:#326FF7;text-decoration:none;font-weight:600;">Dashboard</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
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
        <!-- Metrics Grid (Desktop) - 4 columns with more space -->
        <table role="presentation" class="desktop-metrics" style="width:100%;border-collapse:separate;border-spacing:12px;margin-bottom:28px;">
          <tr>
            ${[
              { label: 'Total Tests', value: metrics.totalTests || 0, color: '#326FF7' },
              { label: 'Pass Rate', value: `${metrics.coveragePercentage || 0}%`, color: '#326FF7' },
              { label: 'Passed', value: metrics.passedTests || 0, sublabel: 'Passed', color: '#35D68B' },
              { label: 'Failed', value: metrics.failedTests || 0, sublabel: 'Failed', color: '#F15555' }
            ].map((metric) => `
            <td style="padding:24px 20px;background:#FAFAFA;background-image:linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);border:2px solid #E4E4E7;border-radius:10px;text-align:center;width:25%;">
              <div style="font-size:10px;text-transform:uppercase;color:#71717A;font-weight:700;letter-spacing:0.8px;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.label}</div>
              <div style="font-size:36px;font-weight:800;color:${metric.color};line-height:1;margin-bottom:${metric.sublabel ? '8' : '0'}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.value}</div>
              ${metric.sublabel ? `<div style="font-size:11px;color:${metric.color};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.sublabel}</div>` : ''}
            </td>
            `).join('')}
          </tr>
        </table>
        
        <!-- Metrics Stacked (Mobile & Tablet) -->
        ${[
          { label: 'Total Tests', value: metrics.totalTests || 0, color: '#326FF7' },
          { label: 'Pass Rate', value: `${metrics.coveragePercentage || 0}%`, color: '#326FF7' },
          { label: 'Passed', value: metrics.passedTests || 0, sublabel: 'Passed', color: '#35D68B' },
          { label: 'Failed', value: metrics.failedTests || 0, sublabel: 'Failed', color: '#F15555' }
        ].map((metric, index) => `
          <table role="presentation" class="mobile-metrics" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;margin-bottom:${index === 3 ? '28' : '12'}px;display:none;">
            <tr>
              <td style="padding:20px 18px;background:#FAFAFA;background-image:linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);border:2px solid #E4E4E7;border-radius:10px;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#71717A;font-weight:700;letter-spacing:0.8px;margin-bottom:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.label}</div>
                <div style="font-size:28px;font-weight:800;color:${metric.color};line-height:1;margin-bottom:${metric.sublabel ? '6' : '0'}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.value}</div>
                ${metric.sublabel ? `<div style="font-size:11px;color:${metric.color};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.sublabel}</div>` : ''}
              </td>
            </tr>
          </table>
        `).join('')}
      `;

    case 'bug_trends':
      return `
        <!-- Metrics Grid (Desktop) - 4 columns with more space -->
        <table role="presentation" class="desktop-metrics" style="width:100%;border-collapse:separate;border-spacing:12px;margin-bottom:28px;">
          <tr>
            ${[
              { label: 'Total Bugs', value: metrics.totalBugs || 0, color: '#326FF7' },
              { label: 'Resolution Rate', value: `${metrics.totalBugs > 0 ? Math.round((metrics.resolvedBugs / metrics.totalBugs) * 100) : 0}%`, color: '#326FF7' },
              { label: 'Open Bugs', value: metrics.openBugs || 0, sublabel: 'Needs attention', color: '#F7A332' },
              { label: 'Critical', value: metrics.criticalUnresolved || 0, sublabel: 'Unresolved', color: '#F15555' }
            ].map((metric) => `
            <td style="padding:24px 20px;background:#FAFAFA;background-image:linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);border:2px solid #E4E4E7;border-radius:10px;text-align:center;width:25%;">
              <div style="font-size:10px;text-transform:uppercase;color:#71717A;font-weight:700;letter-spacing:0.8px;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.label}</div>
              <div style="font-size:36px;font-weight:800;color:${metric.color};line-height:1;margin-bottom:${metric.sublabel ? '8' : '0'}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.value}</div>
              ${metric.sublabel ? `<div style="font-size:11px;color:${metric.color};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.sublabel}</div>` : ''}
            </td>
            `).join('')}
          </tr>
        </table>
        
        <!-- Metrics Stacked (Mobile & Tablet) -->
        ${[
          { label: 'Total Bugs', value: metrics.totalBugs || 0, color: '#326FF7' },
          { label: 'Resolution Rate', value: `${metrics.totalBugs > 0 ? Math.round((metrics.resolvedBugs / metrics.totalBugs) * 100) : 0}%`, color: '#326FF7' },
          { label: 'Open Bugs', value: metrics.openBugs || 0, sublabel: 'Needs attention', color: '#F7A332' },
          { label: 'Critical', value: metrics.criticalUnresolved || 0, sublabel: 'Unresolved', color: '#F15555' }
        ].map((metric, index) => `
          <table role="presentation" class="mobile-metrics" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;margin-bottom:${index === 3 ? '28' : '12'}px;display:none;">
            <tr>
              <td style="padding:20px 18px;background:#FAFAFA;background-image:linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);border:2px solid #E4E4E7;border-radius:10px;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#71717A;font-weight:700;letter-spacing:0.8px;margin-bottom:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.label}</div>
                <div style="font-size:28px;font-weight:800;color:${metric.color};line-height:1;margin-bottom:${metric.sublabel ? '6' : '0'}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.value}</div>
                ${metric.sublabel ? `<div style="font-size:11px;color:${metric.color};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.sublabel}</div>` : ''}
              </td>
            </tr>
          </table>
        `).join('')}
      `;

    case 'custom':
      return `
        <!-- Metrics Grid (Desktop) - 4 columns with more space -->
        <table role="presentation" class="desktop-metrics" style="width:100%;border-collapse:separate;border-spacing:12px;margin-bottom:28px;">
          <tr>
            ${[
              { label: 'Total Tests', value: metrics.totalTests || 0, color: '#326FF7' },
              { label: 'Pass Rate', value: `${metrics.coveragePercentage || 0}%`, color: '#326FF7' },
              { label: 'Total Bugs', value: metrics.totalBugs || 0, color: '#326FF7' },
              { label: 'Critical Bugs', value: metrics.criticalUnresolved || 0, sublabel: 'Unresolved', color: '#F15555' }
            ].map((metric) => `
            <td style="padding:24px 20px;background:#FAFAFA;background-image:linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);border:2px solid #E4E4E7;border-radius:10px;text-align:center;width:25%;">
              <div style="font-size:10px;text-transform:uppercase;color:#71717A;font-weight:700;letter-spacing:0.8px;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.label}</div>
              <div style="font-size:36px;font-weight:800;color:${metric.color};line-height:1;margin-bottom:${metric.sublabel ? '8' : '0'}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.value}</div>
              ${metric.sublabel ? `<div style="font-size:11px;color:${metric.color};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.sublabel}</div>` : ''}
            </td>
            `).join('')}
          </tr>
        </table>
        
        <!-- Metrics Stacked (Mobile & Tablet) -->
        ${[
          { label: 'Total Tests', value: metrics.totalTests || 0, color: '#326FF7' },
          { label: 'Pass Rate', value: `${metrics.coveragePercentage || 0}%`, color: '#326FF7' },
          { label: 'Total Bugs', value: metrics.totalBugs || 0, color: '#326FF7' },
          { label: 'Critical Bugs', value: metrics.criticalUnresolved || 0, sublabel: 'Unresolved', color: '#F15555' }
        ].map((metric, index) => `
          <table role="presentation" class="mobile-metrics" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;margin-bottom:${index === 3 ? '28' : '12'}px;display:none;">
            <tr>
              <td style="padding:20px 18px;background:#FAFAFA;background-image:linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);border:2px solid #E4E4E7;border-radius:10px;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#71717A;font-weight:700;letter-spacing:0.8px;margin-bottom:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.label}</div>
                <div style="font-size:28px;font-weight:800;color:${metric.color};line-height:1;margin-bottom:${metric.sublabel ? '6' : '0'}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.value}</div>
                ${metric.sublabel ? `<div style="font-size:11px;color:${metric.color};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${metric.sublabel}</div>` : ''}
              </td>
            </tr>
          </table>
        `).join('')}
      `;

    default:
      return '';
  }
}