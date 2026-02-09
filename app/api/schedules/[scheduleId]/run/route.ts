// ============================================
// FILE: app/api/schedules/[scheduleId]/run/route.ts
// API endpoint to manually trigger a scheduled report
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { generateReportEmailTemplate } from '@/lib/emails/templates/report-email-template';
import { isReportEmpty } from '@/lib/emails/utils/report-helpers';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ scheduleId: string }> }
) {
    const startTime = Date.now();
    
    try {
        // Await params for Next.js 15+
        const { scheduleId } = await context.params;
        
        if (!scheduleId || scheduleId === 'undefined') {
            return NextResponse.json(
                { error: 'Invalid schedule ID' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        logger.log(`[RUN NOW] Request received for schedule: ${scheduleId}`);

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            logger.log('[RUN NOW] Authentication failed');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch the schedule with suite details
        const { data: schedule, error: scheduleError } = await supabase
            .from('report_schedules')
            .select(`
                *,
                suite:test_suites!report_schedules_suite_id_fkey (
                    id,
                    name,
                    description
                )
            `)
            .eq('id', scheduleId)
            .eq('user_id', user.id) // Ensure user owns this schedule
            .single();

        if (scheduleError) {
            logger.log('[RUN NOW] Error fetching schedule:', scheduleError);
            throw scheduleError;
        }

        if (!schedule) {
            return NextResponse.json(
                { error: 'Schedule not found or access denied' },
                { status: 404 }
            );
        }

        // Cast to any to access filters and custom_config
        const scheduleData = schedule as any;

        // Validate schedule has required fields
        if (!scheduleData.suite_id) {
            return NextResponse.json(
                { error: 'Schedule missing suite_id' },
                { status: 400 }
            );
        }

        if (!scheduleData.emails || scheduleData.emails.length === 0) {
            return NextResponse.json(
                { error: 'Schedule has no email recipients' },
                { status: 400 }
            );
        }

        logger.log(`[RUN NOW] Processing schedule ${scheduleData.id} (${scheduleData.name})`);

        // Determine date range from schedule filters or frequency
        let period;
        if (scheduleData.filters && scheduleData.filters.date_range) {
            // Use explicit date range from schedule filters
            period = {
                start: scheduleData.filters.date_range.start,
                end: scheduleData.filters.date_range.end || new Date().toISOString(),
            };
        } else {
            // Fall back to frequency-based period
            period = calculatePeriodFromFrequency(scheduleData.frequency);
        }

        // Generate report data
        const reportData = await generateReportData(
            scheduleData.type,
            scheduleData.suite_id,
            period,
            supabase,
            scheduleData.custom_config // Pass custom config if it exists
        );

        // Check if report is empty (applies to both scheduled AND manual runs)
        if (isReportEmpty(reportData, scheduleData.type)) {
            logger.log(`[RUN NOW] Report is empty - no data for period`);
            
            // Still save to database for audit trail
            await supabase.from('reports').insert({
                suite_id: scheduleData.suite_id,
                name: `${scheduleData.name} - ${new Date().toLocaleDateString()} [Manual - Empty]`,
                type: scheduleData.type,
                data: { ...reportData, skipped: true, reason: 'No data in period' },
                created_by: user.id,
                schedule_id: scheduleData.id,
            });

            // Update last_run timestamp
            await supabase
                .from('report_schedules')
                .update({ last_run: new Date().toISOString() })
                .eq('id', scheduleData.id);

            return NextResponse.json({
                success: true,
                skipped: true,
                reason: 'No data found for the specified period',
                message: 'Report was not sent because there was no data to report',
                scheduleId: scheduleData.id,
            });
        }

        // Save report to database
        const { data: savedReport, error: saveError } = await supabase
            .from('reports')
            .insert({
                suite_id: scheduleData.suite_id,
                name: `${scheduleData.name} - ${new Date().toLocaleDateString()} [Manual]`,
                type: scheduleData.type,
                data: reportData,
                created_by: user.id,
                schedule_id: scheduleData.id,
            })
            .select()
            .single();

        if (saveError) {
            logger.log(`[RUN NOW] Error saving report to database:`, saveError);
            throw new Error('Failed to save report to database');
        }

        logger.log(`[RUN NOW] Report saved to database: ${savedReport.id}`);

        // Send email to all recipients
        try {
            await sendReportEmail({
                schedule: scheduleData,
                reportData,
                suiteName: scheduleData.suite?.name || 'Unknown Suite',
            });
            logger.log(`[RUN NOW] Email sent successfully to ${scheduleData.emails.length} recipient(s)`);
        } catch (emailError: any) {
            logger.log('[RUN NOW] Email sending failed:', emailError);
            // Don't throw - report was created successfully, email failure is non-critical
            // You might want to update report status to indicate email failed
            await supabase
                .from('reports')
                .update({ 
                    data: { 
                        ...reportData, 
                        emailStatus: 'failed',
                        emailError: emailError.message 
                    } 
                })
                .eq('id', savedReport.id);
        }

        // Update last_run timestamp
        await supabase
            .from('report_schedules')
            .update({
                last_run: new Date().toISOString()
            })
            .eq('id', scheduleData.id);

        const duration = Date.now() - startTime;
        logger.log(`[RUN NOW] Successfully completed in ${duration}ms for schedule ${scheduleData.id}`);

        return NextResponse.json({
            success: true,
            message: 'Report generated and sent successfully',
            scheduleId: scheduleData.id,
            reportId: savedReport.id,
            sentTo: scheduleData.emails,
            duration,
        });

    } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.log(`[RUN NOW] Error after ${duration}ms:`, error);
        
        return NextResponse.json(
            { 
                error: error.message || 'Failed to run scheduled report',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

// ============================================
// Helper Functions (same as cron job)
// ============================================

function calculatePeriodFromFrequency(frequency: string) {
    const now = new Date();
    let startDate: Date;

    switch (frequency) {
        case 'daily':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'monthly':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
        start: startDate.toISOString(),
        end: now.toISOString(),
    };
}

async function generateReportData(
    type: string,
    suiteId: string,
    period: { start: string; end: string },
    supabase: any,
    customConfig?: any
) {

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
            // Use custom configuration if provided
            if (customConfig) {
                return await generateCustomConfiguredReport(supabase, suiteId, period, customConfig);
            }
            // Fall back to combined overview for legacy custom reports
            return await generateCustomReport(supabase, suiteId, period);
        default:
            // For custom reports, generate a combined overview
            return await generateCustomReport(supabase, suiteId, period);
    }
}

async function generateCustomReport(supabase: any, suiteId: string, period: any) {
    // Get both test coverage and bug data for a comprehensive custom report
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

async function generateCustomConfiguredReport(supabase: any, suiteId: string, period: any, config: any) {
    const result: any = {
        period,
        metrics: {},
        summary: '',
        insights: [],
        customConfig: config,
    };

    const summaryParts: string[] = [];
    const allInsights: string[] = [];

    // Generate data for each selected section
    if (config.sections.includes('test_coverage')) {
        const testData = await generateTestCoverageReport(supabase, suiteId, period);
        
        // Filter metrics based on selected metrics
        if (config.metrics.testCoverage.includes('total_tests')) {
            result.metrics.totalTests = testData.metrics.totalTests;
        }
        if (config.metrics.testCoverage.includes('pass_rate') || config.metrics.testCoverage.includes('coverage_percentage')) {
            result.metrics.coveragePercentage = testData.metrics.coveragePercentage;
            result.metrics.passedTests = testData.metrics.passedTests;
        }
        if (config.metrics.testCoverage.includes('fail_rate')) {
            result.metrics.failedTests = testData.metrics.failedTests;
        }
        
        summaryParts.push(`${testData.metrics.totalTests || 0} tests analyzed`);
        allInsights.push(...(testData.insights || []));
    }

    if (config.sections.includes('bug_trends')) {
        const bugData = await generateBugTrendsReport(supabase, suiteId, period);
        
        // Filter metrics based on selected metrics
        if (config.metrics.bugTrends.includes('total_bugs')) {
            result.metrics.totalBugs = bugData.metrics.totalBugs;
        }
        if (config.metrics.bugTrends.includes('open_bugs')) {
            result.metrics.openBugs = bugData.metrics.openBugs;
        }
        if (config.metrics.bugTrends.includes('resolved_bugs')) {
            result.metrics.resolvedBugs = bugData.metrics.resolvedBugs;
        }
        if (config.metrics.bugTrends.includes('critical_bugs')) {
            result.metrics.criticalBugs = bugData.metrics.criticalBugs;
            result.metrics.criticalUnresolved = bugData.metrics.criticalUnresolved;
        }
        if (config.metrics.bugTrends.includes('resolution_rate')) {
            result.metrics.resolvedBugs = bugData.metrics.resolvedBugs;
            result.metrics.totalBugs = bugData.metrics.totalBugs;
        }
        
        summaryParts.push(`${bugData.metrics.totalBugs || 0} bugs tracked`);
        allInsights.push(...(bugData.insights || []));
    }

    if (config.sections.includes('performance')) {
        // TODO: Implement performance metrics when available
        summaryParts.push('Performance metrics analyzed');
        allInsights.push('Performance tracking coming soon');
    }

    if (config.sections.includes('team_activity')) {
        // TODO: Implement team activity when available
        summaryParts.push('Team activity tracked');
        allInsights.push('Team activity metrics coming soon');
    }

    // Build summary
    result.summary = `Custom report: ${summaryParts.join(', ')}.`;
    
    // Add insights
    result.insights = allInsights;

    // Add configuration summary
    result.insights.unshift(
        `Report configured with ${config.sections.length} section(s): ${config.sections.join(', ')}`
    );

    return result;
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
        isManualRun: true, // Flag to indicate this was manually triggered
    });

    const reportTypeNames: Record<string, string> = {
        test_coverage: 'Test Coverage',
        bug_trends: 'Bug Trends',
        sprint_summary: 'Sprint Summary',
        team_performance: 'Team Performance',
        custom: 'Custom Report',
    };

    const subject = `${reportTypeNames[schedule.type] || 'Report'} - ${suiteName}`;

    // Validate email configuration
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
    }

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