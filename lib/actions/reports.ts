// ============================================
// lib/actions/reports.ts
// Server actions for report CRUD operations
// ============================================
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';
import {
  Report,
  ReportFormData,
  ReportData,
  ReportSchedule,
  ReportScheduleFormData,
  ReportScheduleWithReport
} from '@/types/report.types';

// ============================================
// Report Actions
// ============================================

export async function getReports(suiteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      creator:profiles!reports_created_by_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.log('Error fetching reports:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getReport(reportId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      creator:profiles!reports_created_by_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('id', reportId)
    .single();

  if (error) {
    logger.log('Error fetching report:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createReport(formData: ReportFormData, suiteId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Generate report data based on type
  const reportData = await generateReportData(formData, suiteId);

  const { data, error } = await supabase
    .from('reports')
    .insert({
      suite_id: suiteId,
      sprint_id: formData.filters?.sprint_id || null,
      name: formData.name,
      type: formData.type,
      data: reportData as any,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.log('Error creating report:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/reports');
  return { data, error: null };
}

export async function regenerateReport(reportId: string) {
  const supabase = await createClient();

  // Get existing report
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) {
    return { data: null, error: 'Report not found' };
  }

  const formData: ReportFormData = {
    name: report.name,
    type: report.type as any,
    filters: {},
  };

  // Regenerate data
  const reportData = await generateReportData(formData, report.suite_id);

  const { data, error } = await supabase
    .from('reports')
    .update({
      data: reportData as any,
      updated_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    logger.log('Error regenerating report:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/reports');
  return { data, error: null };
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    logger.log('Error deleting report:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/reports');
  return { error: null };
}

// ============================================
// Report Schedule Actions
// ============================================

export async function getReportSchedules(suiteId?: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  let query = supabase
    .from('report_schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (suiteId) {
    query = query.eq('suite_id', suiteId);
  }

  const { data, error } = await query;

  if (error) {
    logger.log('Error fetching schedules:', error);
    return { data: null, error: error.message };
  }

  // Type assertion since we don't have the report relation
  return { data: data as ReportScheduleWithReport[], error: null };
}

export async function createReportSchedule(
  formData: ReportScheduleFormData,
  suiteId: string
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const nextRun = calculateNextRun(formData.frequency);

  const { data, error } = await supabase
    .from('report_schedules')
    .insert({
      suite_id: suiteId,
      user_id: user.id,
      type: formData.type,
      frequency: formData.frequency,
      emails: formData.emails,
      is_active: formData.is_active ?? true,
      next_run: nextRun,
    })
    .select()
    .single();

  if (error) {
    logger.log('Error creating schedule:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/reports');
  return { data, error: null };
}

export async function updateReportSchedule(
  scheduleId: string,
  updates: Partial<ReportScheduleFormData>
) {
  const supabase = await createClient();

  const updateData: any = {};

  if (updates.type) updateData.type = updates.type;
  if (updates.emails) updateData.emails = updates.emails;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

  if (updates.frequency) {
    updateData.frequency = updates.frequency;
    updateData.next_run = calculateNextRun(updates.frequency);
  }

  const { data, error } = await supabase
    .from('report_schedules')
    .update(updateData)
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) {
    logger.log('Error updating schedule:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/reports');
  return { data, error: null };
}

export async function toggleReportSchedule(scheduleId: string, isActive: boolean) {
  return updateReportSchedule(scheduleId, { is_active: isActive } as any);
}

export async function deleteReportSchedule(scheduleId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('report_schedules')
    .delete()
    .eq('id', scheduleId);

  if (error) {
    logger.log('Error deleting schedule:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/reports');
  return { error: null };
}

export async function runReportScheduleNow(scheduleId: string) {
  const supabase = await createClient();

  const { data: schedule, error: fetchError } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (fetchError || !schedule) {
    return { error: 'Schedule not found' };
  }

  // Update next_run
  const { error } = await supabase
    .from('report_schedules')
    .update({
      next_run: calculateNextRun(schedule.frequency)
    })
    .eq('id', scheduleId);

  if (error) {
    logger.log('Error running schedule:', error);
    return { error: error.message };
  }

  // In production, this would trigger a background job to generate and email the report
  // For now, we'll just update the timestamps

  revalidatePath('/dashboard/reports');
  return { error: null };
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
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }

  now.setHours(9, 0, 0, 0);
  return now.toISOString();
}

async function generateReportData(
  formData: ReportFormData,
  suiteId: string
): Promise<ReportData> {
  const supabase = await createClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const period = {
    start: formData.filters?.date_range?.start || thirtyDaysAgo.toISOString(),
    end: formData.filters?.date_range?.end || now.toISOString(),
  };

  switch (formData.type) {
    case 'test_coverage':
      return await generateTestCoverageReport(supabase, suiteId, period);
    case 'bug_trends':
      return await generateBugTrendsReport(supabase, suiteId, period);
    case 'sprint_summary':
      return await generateSprintSummaryReport(supabase, suiteId, period, formData.filters?.sprint_id);
    case 'team_performance':
      return await generateTeamPerformanceReport(supabase, suiteId, period);
    default:
      return { period, metrics: {} };
  }
}

async function generateTestCoverageReport(
  supabase: any,
  suiteId: string,
  period: any
): Promise<ReportData> {
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

async function generateBugTrendsReport(
  supabase: any,
  suiteId: string,
  period: any
): Promise<ReportData> {
  const { data: bugs } = await supabase
    .from('bugs')
    .select('*')
    .eq('suite_id', suiteId)
    .gte('created_at', period.start)
    .lte('created_at', period.end);

  const total = bugs?.length || 0;
  const open = bugs?.filter((b: any) => b.status === 'open').length || 0;
  const resolved = bugs?.filter((b: any) => b.status === 'resolved').length || 0;

  // Count all critical bugs
  const critical = bugs?.filter((b: any) => b.severity === 'critical').length || 0;

  // Count critical bugs that are NOT resolved (these need attention)
  const criticalUnresolved = bugs?.filter((b: any) =>
    b.severity === 'critical' && b.status !== 'resolved'
  ).length || 0;

  // Count critical bugs that ARE resolved
  const criticalResolved = bugs?.filter((b: any) =>
    b.severity === 'critical' && b.status === 'resolved'
  ).length || 0;

  return {
    period,
    metrics: {
      totalBugs: total,
      openBugs: open,
      resolvedBugs: resolved,
      criticalBugs: critical,
      criticalResolved: criticalResolved,
      criticalUnresolved: criticalUnresolved,
    },
    summary: `Tracked ${total} bugs with ${open} open, ${resolved} resolved, and ${critical} critical (${criticalResolved} resolved, ${criticalUnresolved} needing attention).`,
    insights: [
      `${total} bugs tracked in this period`,
      resolved > 0 ? `${Math.round((resolved / total) * 100)}% resolution rate` : 'No bugs resolved',
      criticalUnresolved > 0
        ? `${criticalUnresolved} critical bugs require attention${criticalResolved > 0 ? ` (${criticalResolved} critical bugs resolved)` : ''}`
        : critical > 0
          ? `All ${critical} critical bugs have been resolved`
          : 'No critical bugs',
    ],
  };
}

async function generateSprintSummaryReport(
  supabase: any,
  suiteId: string,
  period: any,
  sprintId?: string
): Promise<ReportData> {
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

async function generateTeamPerformanceReport(
  supabase: any,
  suiteId: string,
  period: any
): Promise<ReportData> {
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