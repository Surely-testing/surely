// ============================================
// FILE: app/api/cron/send-scheduled-reports/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { generateReportEmailTemplate } from '@/lib/emails/templates/report-email-template';
import { isReportEmpty } from '@/lib/emails/utils/report-helpers';

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

    // Check if today is a weekend
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      logger.log('[CRON] Skipping execution - weekend detected');
      return NextResponse.json({
        success: true,
        message: 'Skipped - weekends are excluded from scheduled reports',
        skipped: true,
        reason: 'weekend',
      });
    }

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
            schedule.frequency,
            supabase
          );

          // Check if report is empty
          if (isReportEmpty(reportData, schedule.type)) {
            logger.log(`[CRON] Report ${schedule.id} is empty - skipping email`);

            // Save empty report to database for audit trail
            await supabase
              .from('reports')
              .insert({
                suite_id: schedule.suite_id,
                name: `${schedule.type.replace(/_/g, ' ')} - ${new Date().toLocaleDateString()} [Empty]`,
                type: schedule.type,
                data: { ...reportData, skipped: true, reason: 'No data in period' },
                created_by: schedule.user_id,
                schedule_id: schedule.id,
              });

            // Update next_run and last_run timestamps
            const nextRun = calculateNextRun(schedule.frequency);
            await supabase
              .from('report_schedules')
              .update({ 
                next_run: nextRun,
                last_run: now.toISOString()
              })
              .eq('id', schedule.id);

            logger.log(`[CRON] Schedule ${schedule.id} skipped (empty report). Next run: ${nextRun}`);

            return { 
              success: true, 
              scheduleId: schedule.id, 
              name: schedule.name,
              skipped: true,
              reason: 'No data in period'
            };
          }

          // Save report to database
          const { data: savedReport, error: saveError } = await supabase
            .from('reports')
            .insert({
              suite_id: schedule.suite_id,
              name: `${schedule.type.replace(/_/g, ' ')} - ${new Date().toLocaleDateString()}`,
              type: schedule.type,
              data: reportData,
              created_by: schedule.user_id,
              schedule_id: schedule.id,
            })
            .select()
            .single();

          if (saveError) {
            logger.log(`[CRON] Error saving report to database:`, saveError);
            // Continue anyway - still send email
          } else {
            logger.log(`[CRON] Report saved to database: ${savedReport.id}`);
          }

          // Send email to all recipients
          await sendReportEmail({
            schedule,
            reportData,
            suiteName: schedule.suite?.name || 'Unknown Suite',
          });

          // Update next_run time
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

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success && !r.value.skipped).length;
    const skipped = results.filter((r) => r.status === 'fulfilled' && r.value.skipped).length;
    const failed = results.length - successful - skipped;

    logger.log(`[CRON] Completed: ${successful} successful, ${skipped} skipped (empty), ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} schedules`,
      successful,
      skipped,
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
      // Skip weekends for daily reports
      while (now.getDay() === 0 || now.getDay() === 6) {
        now.setDate(now.getDate() + 1);
      }
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
      // If 1st falls on weekend, move to next Monday
      while (now.getDay() === 0 || now.getDay() === 6) {
        now.setDate(now.getDate() + 1);
      }
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
    case 'custom':
    default:
      return await generateCustomReport(supabase, suiteId, period);
  }
}

async function generateCustomReport(supabase: any, suiteId: string, period: any) {
  const testData = await generateTestCoverageReport(supabase, suiteId, period);
  const bugData = await generateBugTrendsReport(supabase, suiteId, period);

  return {
    period,
    metrics: {
      ...testData.metrics,
      ...bugData.metrics,
    },
    summary: `Custom report generated. ${testData.metrics.totalTests || 0} tests run with ${bugData.metrics.totalBugs || 0} bugs tracked.`,
    insights: [
      ...(testData.insights || []),
      ...(bugData.insights || []),
    ],
  };
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
    isManualRun: false,
  });

  const reportTypeNames: Record<string, string> = {
    test_coverage: 'Test Coverage',
    bug_trends: 'Bug Trends',
    sprint_summary: 'Sprint Summary',
    team_performance: 'Team Performance',
    custom: 'Custom Report',
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