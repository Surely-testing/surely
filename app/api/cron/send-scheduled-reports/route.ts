// ============================================
// FILE: app/api/cron/send-scheduled-reports/route.ts
// Cron job to check and send scheduled reports
// Add to vercel.json: { "crons": [{ "path": "/api/cron/send-scheduled-reports", "schedule": "0 9 * * *" }] }
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.log('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    logger.log(`[CRON] Starting scheduled reports check at ${now.toISOString()}`);

    // Get all active schedules that are due to run
    const { data: schedules, error: schedulesError } = await supabase
      .from('report_schedules')
      .select(`
        *,
        suite:test_suites!report_schedules_suite_id_fkey (
          id,
          name,
          description
        )
      `)
      .eq('is_active', true)
      .lte('next_run', now.toISOString());

    if (schedulesError) {
      logger.log('[CRON] Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    if (!schedules || schedules.length === 0) {
      logger.log('[CRON] No schedules due to run');
      return NextResponse.json({
        success: true,
        message: 'No schedules due to run',
        processed: 0,
      });
    }

    logger.log(`[CRON] Found ${schedules.length} schedules to process`);

    const results = await Promise.allSettled(
      schedules.map(async (schedule) => {
        try {
          logger.log(`[CRON] Processing schedule ${schedule.id} (${schedule.name})`);

          // Validate schedule has required fields
          if (!schedule.suite_id) {
            throw new Error('Schedule missing suite_id');
          }

          if (!schedule.emails || schedule.emails.length === 0) {
            throw new Error('Schedule has no email recipients');
          }

          // Generate report data
          const reportData = await generateReportData(
            schedule.type,
            schedule.suite_id,
            schedule.frequency, // Pass frequency to determine the period
            supabase
          );

          // Send email to all recipients
          await sendReportEmail({
            schedule,
            reportData,
            suiteName: schedule.suite?.name || 'Unknown Suite',
          });

          // Update next_run time and last_run
          const nextRun = calculateNextRun(schedule.frequency);
          await supabase
            .from('report_schedules')
            .update({ 
              next_run: nextRun,
              last_run: now.toISOString()
            })
            .eq('id', schedule.id);

          logger.log(`[CRON] Successfully processed schedule ${schedule.id}. Next run: ${nextRun}`);

          return { success: true, scheduleId: schedule.id, name: schedule.name };
        } catch (error: any) {
          logger.log(`[CRON] Error processing schedule ${schedule.id}:`, error);
          return { 
            success: false, 
            scheduleId: schedule.id, 
            name: schedule.name,
            error: error.message 
          };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    logger.log(`[CRON] Completed: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} schedules`,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' }),
    });
  } catch (error: any) {
    logger.log('[CRON] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process scheduled reports' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateNextRun(frequency: string): string {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      // Schedule for next Monday at 9 AM
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      now.setDate(now.getDate() + daysUntilMonday);
      break;
    case 'monthly':
      // Schedule for 1st of next month at 9 AM
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      break;
  }

  // Always set to 9 AM UTC (adjust if you need a different timezone)
  now.setHours(9, 0, 0, 0);
  return now.toISOString();
}

async function generateReportData(
  type: string, 
  suiteId: string, 
  frequency: string,
  supabase: any
) {
  const now = new Date();
  
  let startDate: Date;
  
  // Set period based on frequency
  switch (frequency) {
    case 'daily':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to weekly
  }

  const period = {
    start: startDate.toISOString(),
    end: now.toISOString(),
  };

  // Use the same report generation logic
  switch (type) {
    case 'test_coverage':
      return await generateTestCoverageReport(supabase, suiteId, period);
    case 'bug_trends':
      return await generateBugTrendsReport(supabase, suiteId, period);
    case 'sprint_summary':
      return await generateSprintSummaryReport(supabase, suiteId, period);
    case 'team_performance':
      return await generateTeamPerformanceReport(supabase, suiteId, period);
    default:
      return { period, metrics: {}, summary: '', insights: [] };
  }
}

async function generateTestCoverageReport(supabase: any, suiteId: string, period: any) {
  const { data: tests } = await supabase
    .from('test_cases')
    .select('*')
    .eq('suite_id', suiteId)
    .gte('created_at', period.start)
    .lte('created_at', period.end);

  const total = tests?.length || 0;
  const passed = tests?.filter((t: any) => t.status === 'passed').length || 0;
  const failed = tests?.filter((t: any) => t.status === 'failed').length || 0;

  return {
    period,
    metrics: {
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      coveragePercentage: total > 0 ? Math.round((passed / total) * 100) : 0,
    },
    summary: `Generated ${total} test cases with ${passed} passing and ${failed} failing.`,
    insights: [
      total === 0 ? 'No test cases found in this period' : `${total} test cases analyzed`,
      passed > 0 ? `${Math.round((passed / total) * 100)}% pass rate` : 'No passing tests',
    ],
  };
}

async function generateBugTrendsReport(supabase: any, suiteId: string, period: any) {
  const { data: bugs } = await supabase
    .from('bugs')
    .select('*')
    .eq('suite_id', suiteId)
    .gte('created_at', period.start)
    .lte('created_at', period.end);

  const total = bugs?.length || 0;
  const open = bugs?.filter((b: any) => b.status === 'open').length || 0;
  const resolved = bugs?.filter((b: any) => b.status === 'resolved').length || 0;
  const critical = bugs?.filter((b: any) => b.severity === 'critical').length || 0;
  const criticalUnresolved = bugs?.filter(
    (b: any) => b.severity === 'critical' && b.status !== 'resolved'
  ).length || 0;
  const criticalResolved = bugs?.filter(
    (b: any) => b.severity === 'critical' && b.status === 'resolved'
  ).length || 0;

  return {
    period,
    metrics: {
      totalBugs: total,
      openBugs: open,
      resolvedBugs: resolved,
      criticalBugs: critical,
      criticalResolved,
      criticalUnresolved,
    },
    summary: `Tracked ${total} bugs with ${open} open, ${resolved} resolved, and ${critical} critical.`,
    insights: [
      `${total} bugs tracked in this period`,
      resolved > 0 ? `${Math.round((resolved / total) * 100)}% resolution rate` : 'No bugs resolved',
      criticalUnresolved > 0
        ? `${criticalUnresolved} critical bugs require attention`
        : critical > 0
        ? `All ${critical} critical bugs resolved`
        : 'No critical bugs',
    ],
  };
}

async function generateSprintSummaryReport(supabase: any, suiteId: string, period: any) {
  return {
    period,
    metrics: {
      sprintVelocity: 0,
      completedStories: 0,
    },
    summary: 'Sprint summary report generated.',
    insights: ['Sprint data integration coming soon'],
  };
}

async function generateTeamPerformanceReport(supabase: any, suiteId: string, period: any) {
  return {
    period,
    metrics: {
      teamMembers: 0,
      activeMembers: 0,
    },
    summary: 'Team performance report generated.',
    insights: ['Team metrics integration coming soon'],
  };
}

async function sendReportEmail({
  schedule,
  reportData,
  suiteName,
}: {
  schedule: any;
  reportData: any;
  suiteName: string;
}) {
  const emailHtml = generateReportEmailTemplate({
    reportType: schedule.type,
    suiteName,
    data: reportData,
    frequency: schedule.frequency,
  });

  const reportTypeNames: Record<string, string> = {
    test_coverage: 'Test Coverage',
    bug_trends: 'Bug Trends',
    sprint_summary: 'Sprint Summary',
    team_performance: 'Team Performance',
  };

  const subject = `${reportTypeNames[schedule.type] || 'Report'} - ${suiteName}`;

  try {
    logger.log(`[EMAIL] Sending to ${schedule.emails.length} recipients`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'reports@yourapp.com',
        to: schedule.emails,
        subject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await response.json();
    logger.log(`[EMAIL] Successfully sent. Email ID: ${result.id}`);
    return result;
  } catch (error) {
    logger.log('[EMAIL] Error sending email via Resend:', error);
    throw error;
  }
}

// ============================================
// EMAIL TEMPLATE
// ============================================

function generateReportEmailTemplate({
  reportType,
  suiteName,
  data,
  frequency,
}: {
  reportType: string;
  suiteName: string;
  data: any;
  frequency: string;
}) {
  const reportTypeNames: Record<string, string> = {
    test_coverage: 'Test Coverage Report',
    bug_trends: 'Bug Trends Report',
    sprint_summary: 'Sprint Summary Report',
    team_performance: 'Team Performance Report',
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1f2937;
            background-color: #f9fafb;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white; 
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700;
            margin-bottom: 8px;
          }
          .header p { 
            font-size: 14px; 
            opacity: 0.95;
            margin-top: 8px;
          }
          .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 12px;
          }
          .content { 
            padding: 40px 30px;
          }
          .summary {
            background: #f9fafb;
            border-left: 4px solid #0d9488;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
          }
          .summary p {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.6;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .metric-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .metric-card h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .metric-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #0d9488;
          }
          .metric-card .label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 4px;
          }
          .insights {
            margin-top: 30px;
          }
          .insights h2 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
          }
          .insight-item {
            background: #f0fdfa;
            border-left: 3px solid #14b8a6;
            padding: 12px 16px;
            margin-bottom: 12px;
            border-radius: 4px;
            font-size: 14px;
            color: #115e59;
          }
          .footer { 
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p { 
            color: #6b7280; 
            font-size: 13px;
            margin-bottom: 8px;
          }
          .footer a {
            color: #0d9488;
            text-decoration: none;
            font-weight: 500;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .branding {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .branding p {
            font-size: 12px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${reportName}</h1>
            <p>${suiteName}</p>
            <span class="badge">${frequency} Report</span>
          </div>

          <div class="content">
            <div class="summary">
              <p><strong>Period:</strong> ${periodText}</p>
              <p style="margin-top: 12px;">${data.summary}</p>
            </div>

            ${generateMetricsHTML(reportType, data.metrics)}

            ${data.insights && data.insights.length > 0 ? `
              <div class="insights">
                <h2>Key Insights</h2>
                ${data.insights.map((insight: string) => `
                  <div class="insight-item">${insight}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This is an automated ${frequency} report for ${suiteName}</p>
            <p>View full details in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports">dashboard</a></p>
            
            <div class="branding">
              <p>Powered by Your QA Platform</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateMetricsHTML(reportType: string, metrics: any): string {
  switch (reportType) {
    case 'test_coverage':
      return `
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Total Tests</h3>
            <div class="value">${metrics.totalTests || 0}</div>
          </div>
          <div class="metric-card">
            <h3>Pass Rate</h3>
            <div class="value">${metrics.coveragePercentage || 0}%</div>
          </div>
          <div class="metric-card">
            <h3>Passed</h3>
            <div class="value">${metrics.passedTests || 0}</div>
            <div class="label" style="color: #10b981;">✓ Passed</div>
          </div>
          <div class="metric-card">
            <h3>Failed</h3>
            <div class="value" style="color: #ef4444;">${metrics.failedTests || 0}</div>
            <div class="label" style="color: #ef4444;">✗ Failed</div>
          </div>
        </div>
      `;

    case 'bug_trends':
      return `
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Total Bugs</h3>
            <div class="value">${metrics.totalBugs || 0}</div>
          </div>
          <div class="metric-card">
            <h3>Resolution Rate</h3>
            <div class="value">${
              metrics.totalBugs > 0
                ? Math.round((metrics.resolvedBugs / metrics.totalBugs) * 100)
                : 0
            }%</div>
          </div>
          <div class="metric-card">
            <h3>Open Bugs</h3>
            <div class="value" style="color: #f59e0b;">${metrics.openBugs || 0}</div>
            <div class="label" style="color: #f59e0b;">Needs attention</div>
          </div>
          <div class="metric-card">
            <h3>Critical</h3>
            <div class="value" style="color: #ef4444;">${metrics.criticalUnresolved || 0}</div>
            <div class="label" style="color: #ef4444;">Unresolved</div>
          </div>
        </div>
      `;

    default:
      return '';
  }
}